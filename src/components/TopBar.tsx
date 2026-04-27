'use client'
import { TRANSLATION_LABELS } from '@/lib/constants'
import type { TranslationCode } from '@/lib/types'
import ThemeToggle from './ThemeToggle'

interface Props {
  translation: TranslationCode
  onTranslationChange: (t: TranslationCode) => void
  onNewChat: () => void
}

const TRANSLATIONS: TranslationCode[] = ['KRV', 'RNKSV', 'NIV', 'ESV', 'KJV']

export default function TopBar({ translation, onTranslationChange, onNewChat }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5
                       border-b border-[var(--clay-border)] bg-[var(--hanji-cream)]
                       sticky top-0 z-10">
      <button onClick={onNewChat} className="text-left hover:opacity-70 transition-opacity">
        <div className="text-[0.75rem] tracking-[0.25em] text-[var(--ink-medium)]">
          말씀의 길
        </div>
        <div className="text-[0.5rem] tracking-[0.4em] text-[var(--clay)] uppercase">
          VERBUM
        </div>
      </button>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <select
          value={translation}
          onChange={(e) => onTranslationChange(e.target.value as TranslationCode)}
          className="text-[0.75rem] bg-[var(--clay-light)] text-[var(--ink-medium)] border-none
                     rounded-xl px-3 py-1 focus:outline-none cursor-pointer"
        >
          {TRANSLATIONS.map((t) => (
            <option key={t} value={t}>{TRANSLATION_LABELS[t]}</option>
          ))}
        </select>
      </div>
    </header>
  )
}
