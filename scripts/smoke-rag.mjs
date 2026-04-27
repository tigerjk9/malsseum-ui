// Quick local sanity test: load the index from the filesystem (not via fetch),
// embed a query via Gemini REST, run top-K. Run with: node scripts/smoke-rag.mjs
// Pass --compare to show query-expansion before/after side by side.
import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const EMBED_FILE = path.join(ROOT, 'public', 'rag', 'verses-embed.bin')
const META_FILE = path.join(ROOT, 'public', 'rag', 'verses-meta.json.gz')

const envRaw = await fs.readFile(path.join(ROOT, '.env.local'), 'utf-8')
const KEY = envRaw.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m)[1].trim().replace(/^['"]|['"]$/g, '')

const embedBuf = await fs.readFile(EMBED_FILE)
const magic = embedBuf.toString('ascii', 0, 4)
const count = embedBuf.readUInt32LE(4)
const dim = embedBuf.readUInt32LE(8)
console.log(`magic=${magic} count=${count} dim=${dim}`)
const vectors = new Int8Array(embedBuf.buffer, embedBuf.byteOffset + 16, count * dim)

const metaGz = await fs.readFile(META_FILE)
const meta = JSON.parse(zlib.gunzipSync(metaGz).toString('utf-8'))
console.log(`meta count=${meta.count} model=${meta.model}\n`)

async function embedQuery(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    }),
  })
  const d = await res.json()
  const v = d.embedding.values
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  const out = new Float32Array(768)
  for (let i = 0; i < 768; i++) out[i] = v[i] / n
  return out
}

async function expandQuery(query) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음 성경 검색 쿼리와 신학적으로 관련된 한국어 키워드 8개를 추출하세요.\n공백으로 구분된 키워드만 한 줄로 출력하세요. 설명 없이.\n\n쿼리: ${query}`,
          }],
        }],
        generationConfig: { maxOutputTokens: 60, temperature: 0 },
      }),
    })
    if (!res.ok) return query
    const d = await res.json()
    const keywords = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return keywords ? `${query} ${keywords}` : query
  } catch {
    return query
  } finally {
    clearTimeout(timeout)
  }
}

function topK(query, k = 5) {
  const heap = []
  for (let row = 0; row < count; row++) {
    const off = row * dim
    let dot = 0
    for (let j = 0; j < dim; j++) dot += query[j] * vectors[off + j]
    const score = dot / 127
    if (heap.length < k) {
      heap.push({ row, score })
      if (heap.length === k) heap.sort((a, b) => a.score - b.score)
    } else if (score > heap[0].score) {
      heap[0] = { row, score }
      heap.sort((a, b) => a.score - b.score)
    }
  }
  return heap.sort((a, b) => b.score - a.score)
}

function printHits(hits, threshold = 0.35) {
  for (const h of hits) {
    const m = meta.verses[h.row]
    const flag = h.score < threshold ? ' ✗' : ''
    console.log(`  ${h.score.toFixed(3)}${flag}  ${m.b} ${m.c}:${m.v}  ${m.t.slice(0, 60)}`)
  }
}

const QUERIES = [
  '회개와 죄의 용서',
  '부활의 소망',
  '하나님의 사랑과 심판',
  '기도가 응답되지 않을 때',
  '믿음이란 무엇인가',
]

const compareMode = process.argv.includes('--compare')
const THRESHOLD = 0.35

for (const q of QUERIES) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`쿼리: "${q}"`)

  if (compareMode) {
    // Before: original query
    const qvBefore = await embedQuery(q)
    const t0 = Date.now()
    const hitsBefore = topK(qvBefore, 5)
    const msBefore = Date.now() - t0
    console.log(`\n  [확장 전] (${msBefore}ms)`)
    printHits(hitsBefore, THRESHOLD)

    // After: expanded query
    const expanded = await expandQuery(q)
    console.log(`\n  [확장 후] "${expanded.slice(0, 80)}..."`)
    const qvAfter = await embedQuery(expanded)
    const t1 = Date.now()
    const hitsAfter = topK(qvAfter, 5)
    const msAfter = Date.now() - t1
    console.log(`  (${msAfter}ms, threshold=${THRESHOLD} — ✗ = 제외됨)`)
    printHits(hitsAfter, THRESHOLD)
  } else {
    const qv = await embedQuery(q)
    const t0 = Date.now()
    const hits = topK(qv, 5)
    const ms = Date.now() - t0
    console.log(`  (${ms}ms, ✗ = threshold ${THRESHOLD} 미만)`)
    printHits(hits, THRESHOLD)
  }
}

console.log('\n✓ smoke-rag 완료. --compare 플래그로 확장 전/후 비교 가능.')
