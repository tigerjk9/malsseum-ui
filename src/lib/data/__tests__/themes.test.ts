import { describe, it, expect } from 'vitest'
import { THEMES, getTheme, searchThemes } from '../themes'

describe('themes', () => {
  it('12개 주제', () => expect(THEMES).toHaveLength(12))

  it('각 주제는 최소 4개 본문', () => {
    THEMES.forEach((t) => expect(t.verses.length).toBeGreaterThanOrEqual(4))
  })

  it('id 는 모두 유니크', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getTheme(love) 매칭', () => {
    expect(getTheme('love')?.title).toBe('사랑')
  })

  it('getTheme(unknown) → undefined', () => {
    expect(getTheme('unknown')).toBeUndefined()
  })

  it('searchThemes(용서) → 용서 주제 포함', () => {
    const results = searchThemes('용서')
    expect(results.some((t) => t.id === 'forgiveness')).toBe(true)
  })

  it('searchThemes(빈 문자열) → 빈 배열', () => {
    expect(searchThemes('')).toEqual([])
    expect(searchThemes('   ')).toEqual([])
  })

  it('각 verse 의 ref 는 Book:Chapter:Verse 형식', () => {
    THEMES.forEach((t) => {
      t.verses.forEach((v) => {
        expect(v.ref).toMatch(/^[A-Za-z0-9]+:\d+:\d+$/)
      })
    })
  })
})
