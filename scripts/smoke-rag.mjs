// Quick local sanity test: load the index from the filesystem (not via fetch),
// embed a query via Gemini REST, run top-K. Run with: node scripts/smoke-rag.mjs
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
console.log(`meta count=${meta.count} model=${meta.model}`)

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

const queries = ['사랑', '용서', '부활', '믿음', '그리스도의 십자가']
for (const q of queries) {
  console.log(`\n=== "${q}" ===`)
  const qv = await embedQuery(q)
  const t0 = Date.now()
  const hits = topK(qv, 5)
  const ms = Date.now() - t0
  console.log(`  (cosine ${ms}ms)`)
  for (const h of hits) {
    const m = meta.verses[h.row]
    console.log(`  ${h.score.toFixed(3)}  ${m.b} ${m.c}:${m.v}  ${m.t.slice(0, 60)}`)
  }
}
