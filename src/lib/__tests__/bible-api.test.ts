import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVerse, buildBollsUrl, fetchChapter } from '../bible-api'
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

describe('fetchChapter', () => {
  it('Bolls.life 챕터 API 호출 → 절 배열 반환', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { pk: 1, verse: 1, text: '만물이 그로 말미암아 지은 바 되었으니' },
        { pk: 2, verse: 2, text: '그 안에 생명이 있었으니' },
      ],
    } as Response)

    const result = await fetchChapter({
      book: 'John',
      chapter: 1,
      translation: 'KRV',
    })
    expect(result.bookNameKo).toBe('요한복음')
    expect(result.book).toBe('John')
    expect(result.chapter).toBe(1)
    expect(result.verses).toHaveLength(2)
    expect(result.verses[0]).toEqual({ verse: 1, text: '만물이 그로 말미암아 지은 바 되었으니' })
  })

  it('API 실패 시 에러', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 502 } as Response)
    await expect(
      fetchChapter({ book: 'John', chapter: 1, translation: 'KRV' })
    ).rejects.toThrow('Bible API 502')
  })

  it('알 수 없는 책명은 에러', async () => {
    await expect(
      fetchChapter({ book: 'BadBook', chapter: 1, translation: 'KRV' })
    ).rejects.toThrow(/Unknown book/)
  })
})
