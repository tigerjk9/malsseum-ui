import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import OriginalLanguagePanel from '../OriginalLanguagePanel'
import type { VerseRef } from '@/lib/types'

global.fetch = vi.fn()
beforeEach(() => vi.clearAllMocks())

const johnRef: VerseRef = {
  book: 'John', chapter: 3, verse: 16, translation: 'KRV',
}

describe('OriginalLanguagePanel', () => {
  it('verseRef=null → 안내 문구', () => {
    render(<OriginalLanguagePanel verseRef={null} />)
    expect(screen.getByText(/원어 보기/)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('verseRef 설정 → /api/original 호출 + 단어 카드 렌더', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ref: 'John:3:16',
        bookNameKo: '요한복음',
        verse: '하나님이 세상을 이처럼 사랑하사',
        language: 'Greek',
        words: [
          {
            korean: '사랑하사',
            original: 'ἠγάπησεν',
            transliteration: 'ēgapēsen',
            meaning: 'agapaō의 부정과거형. 의지적·헌신적 사랑.',
            context: '에로스가 아닌 아가페로, 자기희생적 사랑을 강조.',
          },
        ],
      }),
    } as Response)

    render(<OriginalLanguagePanel verseRef={johnRef} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/original?ref=John:3:16'),
        expect.any(Object)
      )
    })
    expect(await screen.findByText('ἠγάπησεν')).toBeInTheDocument()
    expect(screen.getByText('ēgapēsen')).toBeInTheDocument()
    expect(screen.getByText(/aga[pP]aō/)).toBeInTheDocument()
    expect(screen.getByText(/헬라어/)).toBeInTheDocument()
  })

  it('API 실패 시 에러 메시지', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: '원어 분석 실패' }),
    } as Response)

    render(<OriginalLanguagePanel verseRef={johnRef} />)
    await waitFor(() => {
      expect(screen.getByText(/원어 분석 실패/)).toBeInTheDocument()
    })
  })

  it('Hebrew 응답 → 히브리어 라벨', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ref: 'Genesis:1:1',
        bookNameKo: '창세기',
        verse: '태초에 하나님이 천지를 창조하시니라',
        language: 'Hebrew',
        words: [
          {
            korean: '창조하시니라',
            original: 'בָּרָא',
            transliteration: 'bara',
            meaning: '무에서 유를 만들어내는 창조 행위.',
          },
        ],
      }),
    } as Response)

    render(<OriginalLanguagePanel verseRef={{
      book: 'Genesis', chapter: 1, verse: 1, translation: 'KRV',
    }} />)

    expect(await screen.findByText(/히브리어/)).toBeInTheDocument()
    expect(screen.getByText('בָּרָא')).toBeInTheDocument()
  })
})
