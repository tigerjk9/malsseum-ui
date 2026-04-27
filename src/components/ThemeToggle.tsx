'use client'
import { useTheme } from './ThemeProvider'
import type { ThemePref } from '@/lib/theme'

const LABELS: Record<ThemePref, string> = {
  light: '🌞 라이트',
  dark: '🌙 다크',
  system: '🖥️ 시스템',
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemePref)}
      aria-label="테마 선택"
      className="text-[0.7rem] bg-[var(--clay-light)] text-[var(--ink-medium)] border-none
                 rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
    >
      {(['light', 'dark', 'system'] as ThemePref[]).map((t) => (
        <option key={t} value={t}>{LABELS[t]}</option>
      ))}
    </select>
  )
}
