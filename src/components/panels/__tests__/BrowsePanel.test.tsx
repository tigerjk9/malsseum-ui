import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BrowsePanel from '../BrowsePanel'

global.fetch = vi.fn()
beforeEach(() => vi.clearAllMocks())

describe('BrowsePanel', () => {
  it('책 선택 + 장 입력 + 불러오기 → /api/browse 호출', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        book: 'John',
        chapter: 3,
        bookNameKo: '요한복음',
        translation: 'KRV',
        verses: [
          { verse: 16, text: '하나님이 세상을 이처럼 사랑하사' },
          { verse: 17, text: '하나님이 그 아들을 세상에 보내신 것은' },
        ],
      }),
    } as Response)

    render(<BrowsePanel onPickVerse={vi.fn()} translation="KRV" />)

    const bookSelect = screen.getByLabelText(/책/) as HTMLSelectElement
    fireEvent.change(bookSelect, { target: { value: 'John' } })

    const chapterInput = screen.getByLabelText(/장/) as HTMLInputElement
    await userEvent.clear(chapterInput)
    await userEvent.type(chapterInput, '3')

    fireEvent.click(screen.getByRole('button', { name: /불러오기/ }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/browse?book=John&chapter=3&translation=KRV')
      )
    })
    await waitFor(() => {
      expect(screen.getByText(/하나님이 세상을 이처럼 사랑하사/)).toBeInTheDocument()
    })
  })

  it('절 클릭 시 onPickVerse 호출', async () => {
    const onPickVerse = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        book: 'John',
        chapter: 3,
        bookNameKo: '요한복음',
        translation: 'KRV',
        verses: [{ verse: 16, text: '하나님이 세상을 이처럼 사랑하사' }],
      }),
    } as Response)

    render(<BrowsePanel onPickVerse={onPickVerse} translation="KRV" />)
    fireEvent.change(screen.getByLabelText(/책/), { target: { value: 'John' } })
    fireEvent.click(screen.getByRole('button', { name: /불러오기/ }))

    await waitFor(() => {
      expect(screen.getByText(/하나님이 세상을 이처럼 사랑하사/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/하나님이 세상을 이처럼 사랑하사/).closest('button')!)
    expect(onPickVerse).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: expect.objectContaining({
          book: 'John',
          chapter: 3,
          verse: 16,
          translation: 'KRV',
        }),
        text: '하나님이 세상을 이처럼 사랑하사',
        bookNameKo: '요한복음',
      })
    )
  })

  it('API 실패 시 에러 표시', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: '챕터 조회 실패' }),
    } as Response)

    render(<BrowsePanel onPickVerse={vi.fn()} translation="KRV" />)
    fireEvent.change(screen.getByLabelText(/책/), { target: { value: 'John' } })
    fireEvent.click(screen.getByRole('button', { name: /불러오기/ }))

    await waitFor(() => {
      expect(screen.getByText(/챕터 조회 실패/)).toBeInTheDocument()
    })
  })
})
