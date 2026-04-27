import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SuggestionChips from '../SuggestionChips'

const chips = [
  { label: '더 깊이 묵상하기', prompt: '더 깊이 묵상하기' },
  { label: '연결된 말씀 보기', prompt: '연결된 말씀 보기' },
]

describe('SuggestionChips', () => {
  it('칩 목록 렌더링', () => {
    render(<SuggestionChips chips={chips} onSelect={vi.fn()} />)
    expect(screen.getByText('더 깊이 묵상하기')).toBeInTheDocument()
    expect(screen.getByText('연결된 말씀 보기')).toBeInTheDocument()
  })

  it('칩 클릭 시 onSelect 호출', () => {
    const onSelect = vi.fn()
    render(<SuggestionChips chips={chips} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('더 깊이 묵상하기'))
    expect(onSelect).toHaveBeenCalledWith('더 깊이 묵상하기')
  })
})
