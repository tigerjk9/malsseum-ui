import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomNav from '../BottomNav'

describe('BottomNav', () => {
  it('4개 탭 렌더링', () => {
    render(<BottomNav activePanel="none" onToggle={vi.fn()} onHome={vi.fn()} />)
    expect(screen.getByRole('button', { name: /채팅/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^검색$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /탐독/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /묵상/ })).toBeInTheDocument()
  })

  it('search 탭 클릭 → onToggle("search")', () => {
    const onToggle = vi.fn()
    render(<BottomNav activePanel="none" onToggle={onToggle} onHome={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^검색$/ }))
    expect(onToggle).toHaveBeenCalledWith('search')
  })

  it('browse 탭 클릭 → onToggle("browse")', () => {
    const onToggle = vi.fn()
    render(<BottomNav activePanel="none" onToggle={onToggle} onHome={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /탐독/ }))
    expect(onToggle).toHaveBeenCalledWith('browse')
  })

  it('themes 탭 클릭 → onToggle("themes")', () => {
    const onToggle = vi.fn()
    render(<BottomNav activePanel="none" onToggle={onToggle} onHome={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /묵상/ }))
    expect(onToggle).toHaveBeenCalledWith('themes')
  })

  it('홈 탭 클릭 → onHome', () => {
    const onHome = vi.fn()
    render(<BottomNav activePanel="search" onToggle={vi.fn()} onHome={onHome} />)
    fireEvent.click(screen.getByRole('button', { name: /채팅/ }))
    expect(onHome).toHaveBeenCalled()
  })

  it('activePanel="search" → 검색 탭 aria-current="page"', () => {
    render(<BottomNav activePanel="search" onToggle={vi.fn()} onHome={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^검색$/ }))
      .toHaveAttribute('aria-current', 'page')
  })

  it('activePanel="none" → 채팅 탭 aria-current="page"', () => {
    render(<BottomNav activePanel="none" onToggle={vi.fn()} onHome={vi.fn()} />)
    expect(screen.getByRole('button', { name: /채팅/ }))
      .toHaveAttribute('aria-current', 'page')
  })
})
