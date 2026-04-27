import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HanjaToggle from '../HanjaToggle'
import HanjaText from '../HanjaText'

describe('HanjaToggle', () => {
  it('초기 상태 OFF', () => {
    render(<HanjaToggle enabled={false} onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /한자 표기 토글/ })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).toHaveTextContent(/OFF/)
  })

  it('enabled=true → ON 표기 + aria-pressed=true', () => {
    render(<HanjaToggle enabled={true} onChange={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /한자 표기 토글/ })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn).toHaveTextContent(/ON/)
  })

  it('클릭 → onChange(반전)', () => {
    const onChange = vi.fn()
    render(<HanjaToggle enabled={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /한자 표기 토글/ }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('HanjaText', () => {
  it('enabled=false → 원문 그대로', () => {
    const { container } = render(<HanjaText text="하나님은 사랑이시라" enabled={false} />)
    expect(container.textContent).toBe('하나님은 사랑이시라')
    expect(container.querySelector('ruby')).toBeNull()
  })

  it('enabled=true → ruby 태그로 한자 병기', () => {
    const { container } = render(<HanjaText text="하나님은 사랑이시라" enabled={true} />)
    const rubies = container.querySelectorAll('ruby')
    expect(rubies.length).toBeGreaterThanOrEqual(2)
    const texts = Array.from(container.querySelectorAll('rt')).map((r) => r.textContent)
    expect(texts).toContain('神')
    expect(texts).toContain('愛')
  })

  it('enabled=true → 매칭 안 되는 글자 보존', () => {
    const { container } = render(<HanjaText text="가나다" enabled={true} />)
    expect(container.textContent).toBe('가나다')
    expect(container.querySelector('ruby')).toBeNull()
  })
})
