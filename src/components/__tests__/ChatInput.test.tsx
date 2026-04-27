import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from '../ChatInput'

describe('ChatInput', () => {
  it('텍스트 입력 후 전송', async () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, '용서에 대해')
    await userEvent.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('용서에 대해')
  })

  it('빈 입력은 전송 안 됨', async () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled={false} />)
    await userEvent.keyboard('{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disabled 상태에서 비활성화', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
