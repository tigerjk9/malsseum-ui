'use client'
import { useState } from 'react'
import { THEMES, type Theme } from '@/lib/data/themes'

interface Props {
  onPickTheme: (prompt: string) => void
}

export default function ThemesPanel({ onPickTheme }: Props) {
  const [selected, setSelected] = useState<Theme | null>(null)

  if (selected) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelected(null)}
          className="text-[0.75rem] text-[var(--ink-medium)] hover:underline"
        >
          ← 주제 목록
        </button>
        <div className="space-y-1">
          <div className="text-base font-medium text-[var(--ink-dark)]">
            {selected.emoji} {selected.title}
          </div>
          <p className="text-[0.8rem] text-[var(--ink-medium)] italic">
            {selected.description}
          </p>
        </div>
        <ul className="space-y-2">
          {selected.verses.map((v) => (
            <li key={v.ref}>
              <button
                onClick={() => onPickTheme(
                  `${selected.title}에 대한 ${v.display} 말씀을 함께 묵상하고 싶어요.`
                )}
                className="w-full text-left p-2 rounded-lg
                           hover:bg-[var(--clay-light)] transition-colors"
              >
                <div className="verse-label">{v.display}</div>
                {v.hint && (
                  <div className="text-[0.8rem] text-[var(--ink-medium)] mt-0.5">
                    {v.hint}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setSelected(t)}
          className="p-3 rounded-lg border border-[var(--clay-border)]
                     hover:bg-[var(--clay-light)] transition-colors text-left"
        >
          <div className="text-lg" aria-hidden="true">{t.emoji}</div>
          <div className="text-[0.85rem] font-medium text-[var(--ink-dark)]">
            {t.title}
          </div>
        </button>
      ))}
    </div>
  )
}
