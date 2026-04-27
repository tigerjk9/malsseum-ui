import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVerse, buildBollsUrl } from '../bible-api'
import type { VerseRef } from '../types'

global.fetch = vi.fn()

beforeEach(() => vi.clearAllMocks())

const ref: VerseRef = { book: '1John', chapter: 1, verse: 9, translation: 'KRV' }

describe('buildBollsUrl', () => {
  it('Bolls.life URL 생성', () => {
    const url = buildBollsUrl(ref)
    expect(url).toBe('https://bolls.life/get-verse/KRV/62/1/9/')
  })
})

describe('fetchVerse', () => {
  it('구절 데이터 반환', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '만일 우리가 우리 죄를 자백하면...' }),
    } as Response)

    const result = await fetchVerse(ref)
    expect(result.text).toBe('만일 우리가 우리 죄를 자백하면...')
    expect(result.bookNameKo).toBe('요한일서')
    expect(result.ref).toEqual(ref)
  })

  it('API 실패 시 에러', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    await expect(fetchVerse(ref)).rejects.toThrow('Bible API 404')
  })
})
