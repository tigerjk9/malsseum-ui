import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SlidePanel from '../SlidePanel'

describe('SlidePanel', () => {
  it('open=false 일 때 렌더링하지 않음', () => {
    const { container } = render(
      <SlidePanel open={false} title="검색" onClose={vi.fn()}>
        <p>내용</p>
      </SlidePanel>
    )
    expect(container.firstChild).toBeNull()
  })

  it('open=true 일 때 제목과 내용 렌더링', () => {
    render(
      <SlidePanel open={true} title="검색" onClose={vi.fn()}>
        <p>패널 내용</p>
      </SlidePanel>
    )
    expect(screen.getByText('검색')).toBeInTheDocument()
    expect(screen.getByText('패널 내용')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: '검색' })).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose 호출', () => {
    const onClose = vi.fn()
    render(
      <SlidePanel open={true} title="검색" onClose={onClose}>
        <p />
      </SlidePanel>
    )
    fireEvent.click(screen.getByRole('button', { name: /닫기/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it('ESC 키 누르면 onClose 호출', () => {
    const onClose = vi.fn()
    render(
      <SlidePanel open={true} title="검색" onClose={onClose}>
        <p />
      </SlidePanel>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('오버레이 클릭 시 onClose 호출', () => {
    const onClose = vi.fn()
    render(
      <SlidePanel open={true} title="검색" onClose={onClose}>
        <p />
      </SlidePanel>
    )
    fireEvent.click(screen.getByTestId('slide-panel-overlay'))
    expect(onClose).toHaveBeenCalled()
  })
})
