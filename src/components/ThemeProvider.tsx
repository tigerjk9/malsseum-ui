'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getStoredTheme, setStoredTheme, resolveTheme, applyTheme,
  type ThemePref, type ResolvedTheme,
} from '@/lib/theme'

interface ThemeContextValue {
  theme: ThemePref
  resolved: ResolvedTheme
  setTheme: (pref: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(() => getStoredTheme())
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()))

  useEffect(() => {
    const initial = getStoredTheme()
    const r = resolveTheme(initial)
    setThemeState(initial)
    setResolved(r)
    applyTheme(r)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolveTheme('system')
      setResolved(r)
      applyTheme(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((pref: ThemePref) => {
    setStoredTheme(pref)
    const r = resolveTheme(pref)
    setThemeState(pref)
    setResolved(r)
    applyTheme(r)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
