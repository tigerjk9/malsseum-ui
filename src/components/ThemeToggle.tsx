'use client'
import { useTheme } from './ThemeProvider'
import type { ThemePref } from '@/lib/theme'
import { SunIcon, MoonIcon, MonitorIcon } from './icons'

const LABELS: Record<ThemePref, string> = {
  light: '라이트',
  dark: '다크',
  system: '시스템',
}

const ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
} as const

const ORDER: ThemePref[] = ['light', 'dark', 'system']

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const cycle = () => {
    const idx = ORDER.indexOf(theme)
    setTheme(ORDER[(idx + 1) % ORDER.length])
  }
  const Icon = ICONS[theme]
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`테마: ${LABELS[theme]} (눌러서 변경)`}
      title={`테마: ${LABELS[theme]}`}
      className="flex items-center gap-1.5 text-[0.7rem] bg-[var(--clay-light)] text-[var(--ink-medium)]
                 rounded-[var(--radius-control)] px-2 py-1 cursor-pointer
                 hover:text-[var(--clay)] transition-colors"
    >
      <Icon width={14} height={14} />
      <span>{LABELS[theme]}</span>
    </button>
  )
}
