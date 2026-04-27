// RAG retrieval library for malsseum-ui.
//   - Loads quantized embedding index from /rag/verses-embed.bin (int8, unit-normalized)
//   - Loads verse metadata from /rag/verses-meta.json.gz
//   - Embeds queries via Gemini text-embedding-004 with RETRIEVAL_QUERY taskType
//   - Returns top-K verses by cosine similarity (= dot product on unit vectors)

import { gunzipSync } from 'node:zlib'

export const EMBED_MODEL = 'gemini-embedding-001'
export const EMBED_DIM = 768
const MAGIC = 'MAL1'
const HEADER_BYTES = 16

export interface VerseMetaRow {
  i: number
  b: string
  c: number
  v: number
  t: string
}

interface MetaPayload {
  version: number
  model: string
  dim: number
  count: number
  books: Record<string, string>
  verses: VerseMetaRow[]
}

export interface RagIndex {
  count: number
  dim: number
  vectors: Int8Array
  meta: VerseMetaRow[]
  books: Record<string, string>
}

export interface RetrievalResult {
  ref: { book: string; chapter: number; verse: number }
  bookNameKo: string
  text: string
  score: number
}

let cached: RagIndex | null = null
let pending: Promise<RagIndex> | null = null

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  return 'http://localhost:3000'
}

async function fetchIndex(): Promise<RagIndex> {
  const base = getBaseUrl()
  const [embedRes, metaRes] = await Promise.all([
    fetch(`${base}/rag/verses-embed.bin`, { cache: 'force-cache' }),
    fetch(`${base}/rag/verses-meta.json.gz`, { cache: 'force-cache' }),
  ])
  if (!embedRes.ok) throw new Error(`RAG embed fetch failed: ${embedRes.status}`)
  if (!metaRes.ok) throw new Error(`RAG meta fetch failed: ${metaRes.status}`)

  const embedBuf = Buffer.from(await embedRes.arrayBuffer())
  if (embedBuf.length < HEADER_BYTES) throw new Error('RAG embed file truncated')

  const magic = embedBuf.toString('ascii', 0, 4)
  if (magic !== MAGIC) throw new Error(`RAG embed magic mismatch: ${magic}`)

  const count = embedBuf.readUInt32LE(4)
  const dim = embedBuf.readUInt32LE(8)
  if (dim !== EMBED_DIM) throw new Error(`RAG embed dim mismatch: ${dim}`)
  const expected = HEADER_BYTES + count * dim
  if (embedBuf.length !== expected) {
    throw new Error(`RAG embed size mismatch: got ${embedBuf.length}, expected ${expected}`)
  }

  const vectors = new Int8Array(
    embedBuf.buffer,
    embedBuf.byteOffset + HEADER_BYTES,
    count * dim
  )

  const metaGz = Buffer.from(await metaRes.arrayBuffer())
  const metaJson = gunzipSync(metaGz).toString('utf-8')
  const meta = JSON.parse(metaJson) as MetaPayload
  if (meta.count !== count) {
    throw new Error(`RAG meta/embed count mismatch: meta=${meta.count}, embed=${count}`)
  }

  return {
    count,
    dim,
    vectors,
    meta: meta.verses,
    books: meta.books,
  }
}

export async function loadIndex(): Promise<RagIndex> {
  if (cached) return cached
  if (pending) return pending
  pending = fetchIndex()
    .then((idx) => {
      cached = idx
      return idx
    })
    .finally(() => {
      pending = null
    })
  return pending
}

export async function embedQuery(text: string, apiKey: string): Promise<Float32Array> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent` +
    `?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: EMBED_DIM,
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini embed ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } }
  const values = data.embedding?.values
  if (!values || values.length !== EMBED_DIM) {
    throw new Error(`Embedding dim mismatch: ${values?.length} vs ${EMBED_DIM}`)
  }
  // Re-normalize per Google docs (required when outputDimensionality < 3072)
  let norm = 0
  for (let i = 0; i < values.length; i++) norm += values[i] * values[i]
  norm = Math.sqrt(norm) || 1
  const out = new Float32Array(EMBED_DIM)
  for (let i = 0; i < EMBED_DIM; i++) out[i] = values[i] / norm
  return out
}

export interface ScoredHit {
  index: number
  score: number
}

// Top-K cosine similarity using a small min-heap kept in a fixed-size array.
// Each int8 vector is treated as a unit vector scaled by 127, so the dot product
// yields the cosine after dividing by 127.
export function topKVectors(query: Float32Array, k: number, idx: RagIndex): ScoredHit[] {
  if (query.length !== idx.dim) {
    throw new Error(`Query dim ${query.length} != index dim ${idx.dim}`)
  }
  const { count, dim, vectors } = idx
  const heap: ScoredHit[] = []

  for (let row = 0; row < count; row++) {
    const off = row * dim
    let dot = 0
    for (let j = 0; j < dim; j++) dot += query[j] * vectors[off + j]
    const score = dot / 127

    if (heap.length < k) {
      heap.push({ index: row, score })
      if (heap.length === k) heap.sort((a, b) => a.score - b.score)
    } else if (score > heap[0].score) {
      // Replace min and re-sort (k is small, ~10, so sort is fine)
      heap[0] = { index: row, score }
      heap.sort((a, b) => a.score - b.score)
    }
  }

  return heap.sort((a, b) => b.score - a.score)
}

export async function retrieve(
  query: string,
  k: number,
  apiKey: string
): Promise<RetrievalResult[]> {
  if (!apiKey) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  if (!query?.trim()) return []
  const idx = await loadIndex()
  const queryVec = await embedQuery(query, apiKey)
  const hits = topKVectors(queryVec, k, idx)
  return hits.map((h) => {
    const m = idx.meta[h.index]
    return {
      ref: { book: m.b, chapter: m.c, verse: m.v },
      bookNameKo: idx.books[m.b] ?? m.b,
      text: m.t,
      score: h.score,
    }
  })
}

// For tests: allow injecting a synthetic index without hitting the network.
export function _setCachedIndexForTesting(idx: RagIndex | null): void {
  cached = idx
}
