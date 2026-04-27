import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchPanel from '../SearchPanel'

global.fetch = vi.fn()
beforeEach(() => vi.clearAllMocks())

describe('SearchPanel', () => {
  it('초기 안내 문구', () => {
    render(<SearchPanel onPickVerse={vi.fn()} />)
    expect(screen.getByPlaceholderText(/검색어/)).toBeInTheDocument()
  })

  it('검색 버튼 클릭 시 /api/search 호출', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: '용서',
        results: [
          {
            ref: { book: '1John', chapter: 1, verse: 9, translation: 'KRV' },
            text: '만일 우리가 우리 죄를 자백하면',
            bookNameKo: '요한일서',
          },
        ],
      }),
    } as Response)

    render(<SearchPanel onPickVerse={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/검색어/), '용서')
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=%EC%9A%A9%EC%84%9C'))
    })
    await waitFor(() => {
      expect(screen.getByText(/만일 우리가 우리 죄를 자백하면/)).toBeInTheDocument()
    })
  })

  it('빈 검색어는 호출 안 됨', () => {
    render(<SearchPanel onPickVerse={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('결과 클릭 시 onPickVerse 호출', async () => {
    const onPickVerse = vi.fn()
    const verse = {
      ref: { book: '1John', chapter: 1, verse: 9, translation: 'KRV' as const },
      text: '만일 우리가 우리 죄를 자백하면',
      bookNameKo: '요한일서',
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query: '용서', results: [verse] }),
    } as Response)

    render(<SearchPanel onPickVerse={onPickVerse} />)
    await userEvent.type(screen.getByPlaceholderText(/검색어/), '용서')
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))

    await waitFor(() => {
      expect(screen.getByText(/만일 우리가 우리 죄를 자백하면/)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(/만일 우리가 우리 죄를 자백하면/).closest('button')!)
    expect(onPickVerse).toHaveBeenCalledWith(verse)
  })

  it('API 실패 시 에러 표시', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: '검색 실패' }),
    } as Response)

    render(<SearchPanel onPickVerse={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/검색어/), '용서')
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))

    await waitFor(() => {
      expect(screen.getByText(/검색 실패/)).toBeInTheDocument()
    })
  })
})
