import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SEARCH_SYSTEM_PROMPT } from '../gemini'

describe('SEARCH_SYSTEM_PROMPT', () => {
  it('5개 구절 명시', () => {
    expect(SEARCH_SYSTEM_PROMPT).toMatch(/5개/)
  })

  it('VERSE 태그 형식 명시', () => {
    expect(SEARCH_SYSTEM_PROMPT).toMatch(/\[\[VERSE:/)
  })

  it('KRV 번역코드 강제', () => {
    expect(SEARCH_SYSTEM_PROMPT).toMatch(/KRV/)
  })
})

describe('getSearchModel', () => {
  const ORIGINAL_KEY = process.env.GEMINI_API_KEY

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key-for-unit-test'
  })

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = ORIGINAL_KEY
  })

  it('환경변수 사용 가능 시 모델 인스턴스 반환', async () => {
    const { getSearchModel } = await import('../gemini')
    const model = getSearchModel()
    expect(model).toBeDefined()
  })
})
