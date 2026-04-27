import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import TranslationComparePanel from '../TranslationComparePanel'
import type { VerseRef } from '@/lib/types'

global.fetch = vi.fn()
beforeEach(() => vi.clearAllMocks())

const ref: VerseRef = { book: 'John', chapter: 3, verse: 16, translation: 'KRV' }

describe('TranslationComparePanel', () => {
  it('verseRef 없으면 안내 문구', () => {
    render(<TranslationComparePanel verseRef={null} />)
    expect(screen.getByText(/구절을 선택/)).toBeInTheDocument()
  })

  it('각 번역본에 대해 fetch 호출 후 텍스트 렌더링', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      const u = String(url)
      if (u.includes('translation=KRV')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ text: '하나님이 세상을 이처럼 사랑하사', bookNameKo: '요한복음', ref }),
        } as Response)
      }
      if (u.includes('translation=NIV')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ text: 'For God so loved the world', bookNameKo: '요한복음', ref }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ text: '...', bookNameKo: '요한복음', ref }),
      } as Response)
    })

    render(<TranslationComparePanel verseRef={ref} />)

    await waitFor(() => {
      expect(screen.getByText(/하나님이 세상을 이처럼 사랑하사/)).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText(/For God so loved the world/)).toBeInTheDocument()
    })
    expect(screen.getByText(/요한복음 3:16/)).toBeInTheDocument()
  })

  it('일부 fetch 실패 시 에러 표시 + 나머지는 표시', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      const u = String(url)
      if (u.includes('translation=KRV')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ text: '말씀', bookNameKo: '요한복음', ref }),
        } as Response)
      }
      return Promise.resolve({ ok: false, status: 502 } as Response)
    })

    render(<TranslationComparePanel verseRef={ref} />)

    await waitFor(() => {
      expect(screen.getByText('말씀')).toBeInTheDocument()
    })
    expect(screen.getAllByText(/조회 실패/).length).toBeGreaterThan(0)
  })
})
