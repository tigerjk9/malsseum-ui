import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from '../theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('getStoredTheme: 미설정시 system 반환', () => {
    expect(getStoredTheme()).toBe('system')
  })

  it('setStoredTheme + getStoredTheme 왕복', () => {
    setStoredTheme('dark')
    expect(getStoredTheme()).toBe('dark')
    setStoredTheme('light')
    expect(getStoredTheme()).toBe('light')
    setStoredTheme('system')
    expect(getStoredTheme()).toBe('system')
  })

  it('잘못된 값은 system 으로 폴백', () => {
    localStorage.setItem('verbum-theme', 'garbage')
    expect(getStoredTheme()).toBe('system')
  })

  it('resolveTheme(light) 항상 light', () => {
    expect(resolveTheme('light')).toBe('light')
  })

  it('resolveTheme(dark) 항상 dark', () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('resolveTheme(system): matchMedia dark prefer 시 dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList)
    expect(resolveTheme('system')).toBe('dark')
  })

  it('resolveTheme(system): matchMedia 미일치 시 light', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as unknown as MediaQueryList)
    expect(resolveTheme('system')).toBe('light')
  })

  it('applyTheme: dark 적용 → html.dark 클래스 추가', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applyTheme: light 적용 → html.dark 클래스 제거', () => {
    document.documentElement.classList.add('dark')
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
