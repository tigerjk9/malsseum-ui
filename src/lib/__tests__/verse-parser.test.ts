import { describe, it, expect } from 'vitest'
import { extractVerseRefs, stripVerseTags } from '../verse-parser'

describe('extractVerseRefs', () => {
  it('단일 태그 추출', () => {
    const text = '이 말씀이 있습니다. [[VERSE:1John:1:9:KRV]] 참 위로가 됩니다.'
    expect(extractVerseRefs(text)).toEqual(['1John:1:9:KRV'])
  })

  it('여러 태그 추출', () => {
    const text = '[[VERSE:John:3:16:KRV]] 그리고 [[VERSE:Romans:8:28:KRV]]'
    expect(extractVerseRefs(text)).toEqual(['John:3:16:KRV', 'Romans:8:28:KRV'])
  })

  it('태그 없으면 빈 배열', () => {
    expect(extractVerseRefs('태그 없는 텍스트입니다.')).toEqual([])
  })

  it('중복 태그는 한 번만', () => {
    const text = '[[VERSE:John:3:16:KRV]] 다시 [[VERSE:John:3:16:KRV]]'
    expect(extractVerseRefs(text)).toEqual(['John:3:16:KRV'])
  })
})

describe('stripVerseTags', () => {
  it('태그 제거 후 공백 정리', () => {
    const text = '말씀이 있습니다. [[VERSE:1John:1:9:KRV]] 위로가 됩니다.'
    expect(stripVerseTags(text)).toBe('말씀이 있습니다.  위로가 됩니다.')
  })

  it('태그 없으면 원본 반환', () => {
    expect(stripVerseTags('원본 텍스트')).toBe('원본 텍스트')
  })
})
