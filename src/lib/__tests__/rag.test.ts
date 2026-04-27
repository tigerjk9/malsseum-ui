import { describe, it, expect, beforeEach } from 'vitest'
import { topKVectors, _setCachedIndexForTesting } from '../rag'
import type { RagIndex, VerseMetaRow } from '../rag'

const DIM = 768

function quantize(vec: number[]): Int8Array {
  let norm = 0
  for (const x of vec) norm += x * x
  norm = Math.sqrt(norm) || 1
  const out = new Int8Array(vec.length)
  for (let i = 0; i < vec.length; i++) {
    const q = Math.round((vec[i] / norm) * 127)
    out[i] = q < -128 ? -128 : q > 127 ? 127 : q
  }
  return out
}

function unitFloat32(vec: number[]): Float32Array {
  let norm = 0
  for (const x of vec) norm += x * x
  norm = Math.sqrt(norm) || 1
  const out = new Float32Array(vec.length)
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm
  return out
}

function makeMockIndex(rows: { vec: number[]; meta: VerseMetaRow }[]): RagIndex {
  const dim = rows[0]?.vec.length ?? DIM
  const count = rows.length
  const vectors = new Int8Array(count * dim)
  for (let i = 0; i < count; i++) {
    const q = quantize(rows[i].vec)
    for (let j = 0; j < dim; j++) vectors[i * dim + j] = q[j]
  }
  return {
    count,
    dim,
    vectors,
    meta: rows.map((r) => r.meta),
    books: { Genesis: '창세기', John: '요한복음', Romans: '로마서' },
  }
}

describe('rag: cosine math', () => {
  beforeEach(() => {
    _setCachedIndexForTesting(null)
  })

  it('identical unit vectors score ≈ 1', () => {
    const v = [1, 0, 0]
    const idx = makeMockIndex([
      { vec: v, meta: { i: 0, b: 'Genesis', c: 1, v: 1, t: 'a' } },
    ])
    const q = unitFloat32(v)
    const hits = topKVectors(q, 1, idx)
    expect(hits).toHaveLength(1)
    expect(hits[0].score).toBeCloseTo(1, 1)
  })

  it('orthogonal unit vectors score ≈ 0', () => {
    const idx = makeMockIndex([
      { vec: [1, 0, 0], meta: { i: 0, b: 'Genesis', c: 1, v: 1, t: 'x' } },
      { vec: [0, 1, 0], meta: { i: 1, b: 'Genesis', c: 1, v: 2, t: 'y' } },
    ])
    const q = unitFloat32([1, 0, 0])
    const hits = topKVectors(q, 2, idx)
    expect(hits[0].index).toBe(0)
    expect(hits[0].score).toBeCloseTo(1, 1)
    expect(hits[1].index).toBe(1)
    expect(Math.abs(hits[1].score)).toBeLessThan(0.05)
  })

  it('opposite unit vectors score ≈ -1', () => {
    const idx = makeMockIndex([
      { vec: [1, 0, 0], meta: { i: 0, b: 'Genesis', c: 1, v: 1, t: 'x' } },
      { vec: [-1, 0, 0], meta: { i: 1, b: 'Genesis', c: 1, v: 2, t: 'y' } },
    ])
    const q = unitFloat32([1, 0, 0])
    const hits = topKVectors(q, 2, idx)
    expect(hits[0].index).toBe(0)
    expect(hits[1].index).toBe(1)
    expect(hits[1].score).toBeCloseTo(-1, 1)
  })

  it('top-K returns exactly k hits sorted by score desc', () => {
    const rows = [
      { vec: [1, 0, 0], meta: { i: 0, b: 'Genesis', c: 1, v: 1, t: 'a' } },
      { vec: [0.9, 0.1, 0], meta: { i: 1, b: 'Genesis', c: 1, v: 2, t: 'b' } },
      { vec: [0.5, 0.5, 0.7], meta: { i: 2, b: 'Genesis', c: 1, v: 3, t: 'c' } },
      { vec: [0, 1, 0], meta: { i: 3, b: 'Genesis', c: 1, v: 4, t: 'd' } },
      { vec: [-1, 0, 0], meta: { i: 4, b: 'Genesis', c: 1, v: 5, t: 'e' } },
    ]
    const idx = makeMockIndex(rows)
    const q = unitFloat32([1, 0, 0])
    const hits = topKVectors(q, 3, idx)
    expect(hits).toHaveLength(3)
    expect(hits[0].index).toBe(0)
    expect(hits[1].index).toBe(1)
    expect(hits[2].index).toBe(2)
    expect(hits[0].score).toBeGreaterThan(hits[1].score)
    expect(hits[1].score).toBeGreaterThan(hits[2].score)
  })

  it('rejects dim mismatch', () => {
    const idx = makeMockIndex([
      { vec: [1, 0, 0], meta: { i: 0, b: 'Genesis', c: 1, v: 1, t: 'a' } },
    ])
    const q = new Float32Array([1, 0])
    expect(() => topKVectors(q, 1, idx)).toThrow(/dim/i)
  })
})

describe('rag: int8 quantization round-trip', () => {
  it('error for unit vectors stays under 1.5%', () => {
    // Synthesize a 768-dim unit vector and check quantize→dequantize loss.
    const vec: number[] = []
    for (let i = 0; i < DIM; i++) vec.push(Math.sin(i * 0.137) + Math.cos(i * 0.241))
    let norm = 0
    for (const x of vec) norm += x * x
    norm = Math.sqrt(norm)
    const unit: number[] = vec.map((x) => x / norm)

    const q = new Int8Array(DIM)
    for (let i = 0; i < DIM; i++) q[i] = Math.round(unit[i] * 127)

    let recoveredDot = 0
    for (let i = 0; i < DIM; i++) recoveredDot += unit[i] * (q[i] / 127)
    // Self-similarity should be ~1 with small quantization noise
    expect(recoveredDot).toBeGreaterThan(0.985)
    expect(recoveredDot).toBeLessThanOrEqual(1.001)
  })
})
