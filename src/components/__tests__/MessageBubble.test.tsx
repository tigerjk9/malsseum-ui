import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '../MessageBubble'
import type { ChatMessage } from '@/lib/types'

const userMsg: ChatMessage = {
  id: '1', role: 'user',
  content: '용서에 대해 알고 싶어요',
  verses: [], suggestions: [],
}

const aiMsg: ChatMessage = {
  id: '2', role: 'assistant',
  content: '지금 용서가 필요한 상황이신가요?',
  verses: [], suggestions: [{ label: '더 깊이', prompt: '더 깊이' }],
}

describe('MessageBubble', () => {
  it('사용자 메시지 — 우측 정렬', () => {
    const { container } = render(
      <MessageBubble message={userMsg} onAction={vi.fn()} onSuggestion={vi.fn()} />
    )
    expect(screen.getByText('용서에 대해 알고 싶어요')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('items-end')
  })

  it('AI 메시지 — 말씀 길잡이 레이블', () => {
    render(<MessageBubble message={aiMsg} onAction={vi.fn()} onSuggestion={vi.fn()} />)
    expect(screen.getByText(/말씀 길잡이/)).toBeInTheDocument()
    expect(screen.getByText('지금 용서가 필요한 상황이신가요?')).toBeInTheDocument()
    expect(screen.getByText('더 깊이')).toBeInTheDocument()
  })
})
