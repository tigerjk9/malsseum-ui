import { describe, it, expect } from 'vitest'
import { HANJA_GLOSSARY, annotateHanja } from '../hanja-glossary'

describe('hanja-glossary', () => {
  it('30개 엔트리', () => {
    expect(HANJA_GLOSSARY).toHaveLength(30)
  })

  it('한국어 키 유니크', () => {
    const koreans = HANJA_GLOSSARY.map((e) => e.korean)
    expect(new Set(koreans).size).toBe(koreans.length)
  })

  it('annotateHanja: 매칭 단어 분리', () => {
    const segs = annotateHanja('하나님은 사랑이시라')
    const hanjaSeg = segs.find((s) => s.type === 'hanja' && s.text === '하나님')
    expect(hanjaSeg).toBeDefined()
    if (hanjaSeg && hanjaSeg.type === 'hanja') {
      expect(hanjaSeg.hanja).toBe('神')
    }
    expect(segs.some((s) => s.type === 'hanja' && s.text === '사랑')).toBe(true)
  })

  it('annotateHanja: 매칭 없으면 plain 한 덩어리', () => {
    const segs = annotateHanja('가나다라')
    expect(segs).toHaveLength(1)
    expect(segs[0]).toEqual({ type: 'plain', text: '가나다라' })
  })

  it('annotateHanja: 긴 단어 우선 매칭 (소망 vs 망)', () => {
    const segs = annotateHanja('소망')
    const hanjaSegs = segs.filter((s) => s.type === 'hanja')
    expect(hanjaSegs).toHaveLength(1)
    if (hanjaSegs[0].type === 'hanja') {
      expect(hanjaSegs[0].text).toBe('소망')
      expect(hanjaSegs[0].hanja).toBe('所望')
    }
  })

  it('annotateHanja: 빈 문자열 → 빈 배열', () => {
    expect(annotateHanja('')).toEqual([])
  })

  it('annotateHanja: 단어 사이 일반 텍스트 보존', () => {
    const segs = annotateHanja('나의 사랑과 믿음')
    const reconstructed = segs.map((s) => s.text).join('')
    expect(reconstructed).toBe('나의 사랑과 믿음')
  })
})
