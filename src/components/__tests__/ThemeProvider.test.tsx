import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ThemeProvider, { useTheme } from '../ThemeProvider'

function Probe() {
  const { theme, resolved, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setTheme('dark')}>다크로</button>
      <button onClick={() => setTheme('light')}>라이트로</button>
      <button onClick={() => setTheme('system')}>시스템으로</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('초기값 system', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('setTheme(dark) → html.dark + localStorage 저장', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    act(() => {
      fireEvent.click(screen.getByText('다크로'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('verbum-theme')).toBe('dark')
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
  })

  it('setTheme(light) → html.dark 제거', () => {
    document.documentElement.classList.add('dark')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    act(() => {
      fireEvent.click(screen.getByText('라이트로'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('verbum-theme')).toBe('light')
  })

  it('localStorage 에 dark 가 저장돼 있으면 마운트 시 적용', () => {
    localStorage.setItem('verbum-theme', 'dark')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('useTheme: Provider 외부에서 호출 시 throw', () => {
    expect(() => render(<Probe />)).toThrow()
  })
})
