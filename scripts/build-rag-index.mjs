#!/usr/bin/env node
// Build RAG index for malsseum-ui.
//   1. Fetch all KRV verses from Bolls.life (chapter-bulk endpoint).
//   2. Batch-embed via Gemini text-embedding-004 (768d).
//   3. L2-normalize, quantize to int8.
//   4. Write public/rag/verses-embed.bin + verses-meta.json.gz.
//
// Resumable via scripts/.rag-build-state.json. Run: npm run build:rag

import fs from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
const gzip = promisify(zlib.gzip)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const STATE_FILE = path.join(ROOT, 'scripts', '.rag-build-state.json')
const OUT_DIR = path.join(ROOT, 'public', 'rag')
const OUT_EMBED = path.join(OUT_DIR, 'verses-embed.bin')
const OUT_META = path.join(OUT_DIR, 'verses-meta.json.gz')

const EMBED_MODEL = 'gemini-embedding-001'
const EMBED_DIM = 768
const WAVE_SIZE = 30          // verses processed concurrently per wave
const WAVE_DELAY_MS = 1500    // pause between waves → ~1200 RPM, under 1500 RPM limit
const BOLLS_DELAY_MS = 80

const BOOK_IDS = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5,
  Joshua: 6, Judges: 7, Ruth: 8, '1Samuel': 9, '2Samuel': 10,
  '1Kings': 11, '2Kings': 12, '1Chronicles': 13, '2Chronicles': 14,
  Ezra: 15, Nehemiah: 16, Esther: 17, Job: 18, Psalms: 19,
  Proverbs: 20, Ecclesiastes: 21, SongOfSolomon: 22, Isaiah: 23,
  Jeremiah: 24, Lamentations: 25, Ezekiel: 26, Daniel: 27,
  Hosea: 28, Joel: 29, Amos: 30, Obadiah: 31, Jonah: 32,
  Micah: 33, Nahum: 34, Habakkuk: 35, Zephaniah: 36, Haggai: 37,
  Zechariah: 38, Malachi: 39, Matthew: 40, Mark: 41, Luke: 42,
  John: 43, Acts: 44, Romans: 45, '1Corinthians': 46, '2Corinthians': 47,
  Galatians: 48, Ephesians: 49, Philippians: 50, Colossians: 51,
  '1Thessalonians': 52, '2Thessalonians': 53, '1Timothy': 54, '2Timothy': 55,
  Titus: 56, Philemon: 57, Hebrews: 58, James: 59, '1Peter': 60,
  '2Peter': 61, '1John': 62, '2John': 63, '3John': 64, Jude: 65,
  Revelation: 66,
}

const BOOK_CHAPTERS = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, '1Samuel': 31, '2Samuel': 24,
  '1Kings': 22, '2Kings': 25, '1Chronicles': 29, '2Chronicles': 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150,
  Proverbs: 31, Ecclesiastes: 12, SongOfSolomon: 8, Isaiah: 66,
  Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12,
  Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4,
  Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2,
  Zechariah: 14, Malachi: 4, Matthew: 28, Mark: 16, Luke: 24,
  John: 21, Acts: 28, Romans: 16, '1Corinthians': 16, '2Corinthians': 13,
  Galatians: 6, Ephesians: 6, Philippians: 4, Colossians: 4,
  '1Thessalonians': 5, '2Thessalonians': 3, '1Timothy': 6, '2Timothy': 4,
  Titus: 3, Philemon: 1, Hebrews: 13, James: 5, '1Peter': 5,
  '2Peter': 3, '1John': 5, '2John': 1, '3John': 1, Jude: 1, Revelation: 22,
}

const BOOK_NAMES_KO = {
  Genesis: '창세기', Exodus: '출애굽기', Leviticus: '레위기',
  Numbers: '민수기', Deuteronomy: '신명기', Joshua: '여호수아',
  Judges: '사사기', Ruth: '룻기', '1Samuel': '사무엘상', '2Samuel': '사무엘하',
  '1Kings': '열왕기상', '2Kings': '열왕기하', '1Chronicles': '역대상',
  '2Chronicles': '역대하', Ezra: '에스라', Nehemiah: '느헤미야',
  Esther: '에스더', Job: '욥기', Psalms: '시편', Proverbs: '잠언',
  Ecclesiastes: '전도서', SongOfSolomon: '아가', Isaiah: '이사야',
  Jeremiah: '예레미야', Lamentations: '예레미야애가', Ezekiel: '에스겔',
  Daniel: '다니엘', Hosea: '호세아', Joel: '요엘', Amos: '아모스',
  Obadiah: '오바댜', Jonah: '요나', Micah: '미가', Nahum: '나훔',
  Habakkuk: '하박국', Zephaniah: '스바냐', Haggai: '학개',
  Zechariah: '스가랴', Malachi: '말라기', Matthew: '마태복음',
  Mark: '마가복음', Luke: '누가복음', John: '요한복음', Acts: '사도행전',
  Romans: '로마서', '1Corinthians': '고린도전서', '2Corinthians': '고린도후서',
  Galatians: '갈라디아서', Ephesians: '에베소서', Philippians: '빌립보서',
  Colossians: '골로새서', '1Thessalonians': '데살로니가전서',
  '2Thessalonians': '데살로니가후서', '1Timothy': '디모데전서',
  '2Timothy': '디모데후서', Titus: '디도서', Philemon: '빌레몬서',
  Hebrews: '히브리서', James: '야고보서', '1Peter': '베드로전서',
  '2Peter': '베드로후서', '1John': '요한일서', '2John': '요한이서',
  '3John': '요한삼서', Jude: '유다서', Revelation: '요한계시록',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { phase: 'fetch', verses: [], embeddedCount: 0 }
  }
}

async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state))
}

async function fetchChapter(book, chapter) {
  const bookId = BOOK_IDS[book]
  const url = `https://bolls.life/get-text/KRV/${bookId}/${chapter}/`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Bolls ${res.status} for ${book} ${chapter}`)
  const data = await res.json()
  return data.map((row) => ({
    book,
    chapter,
    verse: row.verse,
    text: String(row.text ?? '').replace(/<[^>]+>/g, '').trim(),
  }))
}

async function phaseFetch(state) {
  if (state.verses.length > 0) {
    console.log(`[fetch] resuming with ${state.verses.length} verses already fetched`)
  }
  const fetched = new Set(state.verses.map((v) => `${v.book}:${v.chapter}`))
  const allBooks = Object.keys(BOOK_IDS)
  const totalChapters = Object.values(BOOK_CHAPTERS).reduce((a, b) => a + b, 0)
  let done = fetched.size

  for (const book of allBooks) {
    const chapters = BOOK_CHAPTERS[book]
    for (let ch = 1; ch <= chapters; ch++) {
      const key = `${book}:${ch}`
      if (fetched.has(key)) continue
      try {
        const verses = await fetchChapter(book, ch)
        state.verses.push(...verses)
        fetched.add(key)
        done++
        if (done % 50 === 0) {
          await saveState(state)
          process.stdout.write(
            `\r[fetch] ${done}/${totalChapters} chapters · ${state.verses.length} verses`
          )
        }
        await sleep(BOLLS_DELAY_MS)
      } catch (err) {
        console.error(`\n[fetch] failed ${book} ${ch}:`, err.message, '— retrying once after 2s')
        await sleep(2000)
        const verses = await fetchChapter(book, ch)
        state.verses.push(...verses)
        fetched.add(key)
        done++
      }
    }
  }
  console.log(`\n[fetch] complete: ${state.verses.length} verses across ${done} chapters`)
  state.phase = 'embed'
  await saveState(state)
}

async function embedSingle(text, apiKey) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent` +
    `?key=${apiKey}`
  const body = {
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: EMBED_DIM,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`embed ${res.status}: ${errText.slice(0, 300)}`)
  }
  const data = await res.json()
  if (!data.embedding?.values || data.embedding.values.length !== EMBED_DIM) {
    throw new Error(`Invalid embedding response: dim=${data.embedding?.values?.length}`)
  }
  return data.embedding.values
}

function quantizeRow(values) {
  // Re-normalize: gemini-embedding-001 with outputDimensionality < 3072 must be
  // re-normalized to unit length per Google docs.
  let norm = 0
  for (let k = 0; k < values.length; k++) norm += values[k] * values[k]
  norm = Math.sqrt(norm) || 1
  const row = new Array(EMBED_DIM)
  for (let k = 0; k < EMBED_DIM; k++) {
    const q = Math.round((values[k] / norm) * 127)
    row[k] = q < -128 ? -128 : q > 127 ? 127 : q
  }
  return row
}

async function embedWithRetry(text, apiKey, label) {
  const attempts = 4
  for (let a = 0; a < attempts; a++) {
    try {
      return await embedSingle(text, apiKey)
    } catch (err) {
      const msg = err.message || String(err)
      const transient = /\b(429|500|502|503|504)\b/.test(msg) || /fetch failed/i.test(msg)
      if (!transient || a === attempts - 1) throw err
      const backoff = 1500 * Math.pow(2, a)
      console.error(`\n[embed] ${label} retry ${a + 1}/${attempts} after ${backoff}ms: ${msg.slice(0, 120)}`)
      await sleep(backoff)
    }
  }
  throw new Error('unreachable')
}

async function phaseEmbed(state, apiKey) {
  const total = state.verses.length
  if (!state.embeddings) state.embeddings = []

  let i = state.embeddings.length
  if (i > 0) console.log(`[embed] resuming from verse ${i}/${total}`)

  while (i < total) {
    const wave = state.verses.slice(i, i + WAVE_SIZE)
    const start = i

    const results = await Promise.all(
      wave.map((v, j) =>
        embedWithRetry(v.text, apiKey, `${v.book} ${v.chapter}:${v.verse}`).then((vals) => ({
          j,
          row: quantizeRow(vals),
        }))
      )
    )
    results.sort((a, b) => a.j - b.j)
    for (const r of results) state.embeddings.push(r.row)

    i = start + wave.length
    await saveState(state)
    const pct = ((i / total) * 100).toFixed(1)
    process.stdout.write(`\r[embed] ${i}/${total} verses (${pct}%)`)
    if (i < total) await sleep(WAVE_DELAY_MS)
  }
  console.log(`\n[embed] complete: ${state.embeddings.length} vectors`)
  state.phase = 'write'
  await saveState(state)
}

async function phaseWrite(state) {
  const count = state.verses.length
  console.log(`[write] packing ${count} × ${EMBED_DIM} int8 vectors`)

  // Header (16 bytes): magic "MAL1" + count u32 LE + dim u32 LE + reserved u32
  const header = Buffer.alloc(16)
  header.write('MAL1', 0, 'ascii')
  header.writeUInt32LE(count, 4)
  header.writeUInt32LE(EMBED_DIM, 8)
  header.writeUInt32LE(0, 12)

  // Vectors: count × dim Int8
  const vectors = Buffer.alloc(count * EMBED_DIM)
  for (let i = 0; i < count; i++) {
    const row = state.embeddings[i]
    const offset = i * EMBED_DIM
    for (let k = 0; k < EMBED_DIM; k++) {
      vectors.writeInt8(row[k], offset + k)
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(OUT_EMBED, Buffer.concat([header, vectors]))
  const embedSize = (header.length + vectors.length) / (1024 * 1024)
  console.log(`[write] ${OUT_EMBED}: ${embedSize.toFixed(2)} MB`)

  // Meta
  const meta = {
    version: 1,
    model: EMBED_MODEL,
    dim: EMBED_DIM,
    count,
    books: BOOK_NAMES_KO,
    verses: state.verses.map((v, i) => ({
      i,
      b: v.book,
      c: v.chapter,
      v: v.verse,
      t: v.text,
    })),
  }
  const metaJson = JSON.stringify(meta)
  const metaGz = await gzip(metaJson, { level: 9 })
  await fs.writeFile(OUT_META, metaGz)
  console.log(
    `[write] ${OUT_META}: ${(metaGz.length / (1024 * 1024)).toFixed(2)} MB ` +
      `(uncompressed ${(metaJson.length / (1024 * 1024)).toFixed(2)} MB)`
  )

  state.phase = 'done'
  await saveState(state)
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Try to load from .env.local
    try {
      const envRaw = await fs.readFile(path.join(ROOT, '.env.local'), 'utf-8')
      const match = envRaw.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m)
      if (match) process.env.GEMINI_API_KEY = match[1].trim().replace(/^['"]|['"]$/g, '')
    } catch {
      // ignore
    }
  }
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('GEMINI_API_KEY 환경변수 또는 .env.local에 키 필요')
    process.exit(1)
  }

  const state = await loadState()
  console.log(`[main] starting at phase=${state.phase}`)

  if (state.phase === 'fetch') await phaseFetch(state)
  if (state.phase === 'embed') await phaseEmbed(state, key)
  if (state.phase === 'write') await phaseWrite(state)

  console.log('\n✓ RAG index build complete')
  console.log(`  ${OUT_EMBED}`)
  console.log(`  ${OUT_META}`)
  console.log(`  state file (can be deleted): ${STATE_FILE}`)
}

main().catch((err) => {
  console.error('\n[fatal]', err)
  process.exit(1)
})
