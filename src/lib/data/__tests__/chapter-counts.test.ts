import { describe, it, expect } from 'vitest'
import { BOOK_CHAPTER_COUNTS, getMaxChapter, isValidChapter } from '../chapter-counts'
import { BOOK_IDS } from '@/lib/constants'

describe('chapter-counts', () => {
  it('66권 모두 매핑', () => {
    expect(Object.keys(BOOK_CHAPTER_COUNTS)).toHaveLength(66)
  })

  it('대표 책 장수 정확', () => {
    expect(BOOK_CHAPTER_COUNTS.Genesis).toBe(50)
    expect(BOOK_CHAPTER_COUNTS.Psalms).toBe(150)
    expect(BOOK_CHAPTER_COUNTS.John).toBe(21)
    expect(BOOK_CHAPTER_COUNTS.Revelation).toBe(22)
    expect(BOOK_CHAPTER_COUNTS.Obadiah).toBe(1)
  })

  it('BOOK_IDS 키와 1:1 대응', () => {
    expect(Object.keys(BOOK_CHAPTER_COUNTS).sort())
      .toEqual(Object.keys(BOOK_IDS).sort())
  })

  it('getMaxChapter: 알려진 책', () => {
    expect(getMaxChapter('John')).toBe(21)
  })

  it('getMaxChapter: 미지의 책 → null', () => {
    expect(getMaxChapter('Unknown')).toBeNull()
  })

  it('isValidChapter: 경계값', () => {
    expect(isValidChapter('John', 1)).toBe(true)
    expect(isValidChapter('John', 21)).toBe(true)
    expect(isValidChapter('John', 22)).toBe(false)
    expect(isValidChapter('John', 0)).toBe(false)
    expect(isValidChapter('John', -1)).toBe(false)
    expect(isValidChapter('Unknown', 1)).toBe(false)
  })
})
