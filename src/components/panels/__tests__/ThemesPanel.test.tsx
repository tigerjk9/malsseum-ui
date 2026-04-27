import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemesPanel from '../ThemesPanel'

describe('ThemesPanel', () => {
  it('12개 주제 칩 렌더링', () => {
    render(<ThemesPanel onPickTheme={vi.fn()} />)
    expect(screen.getByText('사랑')).toBeInTheDocument()
    expect(screen.getByText('용서')).toBeInTheDocument()
    expect(screen.getByText('순종')).toBeInTheDocument()
  })

  it('주제 클릭 → 해당 주제의 본문 목록 노출', () => {
    render(<ThemesPanel onPickTheme={vi.fn()} />)
    fireEvent.click(screen.getByText('사랑'))
    expect(screen.getByText(/요한일서 4:8/)).toBeInTheDocument()
    expect(screen.getByText(/← 주제 목록/)).toBeInTheDocument()
  })

  it('뒤로 버튼 → 주제 목록 복귀', () => {
    render(<ThemesPanel onPickTheme={vi.fn()} />)
    fireEvent.click(screen.getByText('사랑'))
    fireEvent.click(screen.getByText(/← 주제 목록/))
    expect(screen.getByText('사랑')).toBeInTheDocument()
    expect(screen.queryByText(/요한일서 4:8/)).not.toBeInTheDocument()
  })

  it('본문 클릭 → onPickTheme(prompt) 호출', () => {
    const onPickTheme = vi.fn()
    render(<ThemesPanel onPickTheme={onPickTheme} />)
    fireEvent.click(screen.getByText('사랑'))
    const verseBtn = screen.getByText(/요한일서 4:8/).closest('button')!
    fireEvent.click(verseBtn)
    expect(onPickTheme).toHaveBeenCalledWith(
      expect.stringContaining('사랑')
    )
    expect(onPickTheme).toHaveBeenCalledWith(
      expect.stringContaining('요한일서 4:8')
    )
  })
})
