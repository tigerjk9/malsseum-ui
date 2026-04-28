'use client'
import { useState } from 'react'
import { THEMES, type Theme } from '@/lib/data/themes'
import type { VerseData } from '@/lib/types'

interface Props {
  onPickTheme: (prompt: string) => void
  geminiKey?: string
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function ThemesPanel({ onPickTheme, geminiKey }: Props) {
  const [selected, setSelected] = useState<Theme | null>(null)
  const [dynamicVerses, setDynamicVerses] = useState<VerseData[]>([])
  const [status, setStatus] = useState<Status>('idle')

  const handleSelectTheme = async (theme: Theme) => {
    setSelected(theme)
    setStatus('loading')
    setDynamicVerses([])

    try {
      const headers: HeadersInit = {}
      if (geminiKey) headers['x-gemini-api-key'] = geminiKey
      const q = encodeURIComponent(`${theme.title} ${theme.description}`)
      const res = await fetch(`/api/search?q=${q}`, { headers })
      if (!res.ok) throw new Error('검색 실패')
      const data: { results: VerseData[] } = await res.json()
      setDynamicVerses(data.results ?? [])
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  const handleBack = () => {
    setSelected(null)
    setStatus('idle')
    setDynamicVerses([])
  }

  if (selected) {
    const showDynamic = status === 'ok' && dynamicVerses.length > 0
    const showFallback = status === 'error' || (status === 'ok' && dynamicVerses.length === 0)

    return (
      <div className="space-y-3">
        <button
          onClick={handleBack}
          className="text-[0.75rem] text-[var(--ink-medium)] hover:text-[var(--clay)] transition-colors"
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

        <button
          onClick={() => onPickTheme(`${selected.title}에 대해 깊이 묵상하고 싶어요.`)}
          className="w-full py-2 rounded-[var(--radius-control)]
                     bg-[var(--ink-dark)] text-[var(--hanji-cream)]
                     text-[0.8rem] hover:bg-[var(--clay)] transition-colors"
        >
          이 주제로 대화 시작
        </button>

        {status === 'loading' && (
          <div className="text-[0.8rem] text-[var(--ink-medium)] opacity-60 py-2">
            관련 말씀 검색 중…
          </div>
        )}

        {showDynamic && (
          <>
            <p className="text-[0.65rem] text-[var(--ink-medium)] opacity-60 tracking-wide uppercase">
              관련 구절 (RAG 검색)
            </p>
            <ul className="space-y-2">
              {dynamicVerses.map((v) => (
                <li key={`${v.ref.book}-${v.ref.chapter}-${v.ref.verse}`}>
                  <button
                    onClick={() => onPickTheme(
                      `${selected.title}에 대한 ${v.bookNameKo} ${v.ref.chapter}:${v.ref.verse} 말씀을 함께 묵상하고 싶어요.`
                    )}
                    className="w-full text-left border-l-2 border-[var(--clay-border)]
                               hover:border-[var(--clay)] pl-3 py-1.5
                               transition-colors group space-y-0.5"
                  >
                    <div className="verse-label group-hover:text-[var(--clay)]">
                      {v.bookNameKo} {v.ref.chapter}:{v.ref.verse}
                    </div>
                    <p className="text-[0.8rem] text-[var(--ink-medium)] leading-snug line-clamp-2">
                      {v.text}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {showFallback && (
          <>
            <p className="text-[0.65rem] text-[var(--ink-medium)] opacity-60 tracking-wide uppercase">
              큐레이션 구절
            </p>
            <ul className="space-y-2">
              {selected.verses.map((v) => (
                <li key={v.ref}>
                  <button
                    onClick={() => onPickTheme(
                      `${selected.title}에 대한 ${v.display} 말씀을 함께 묵상하고 싶어요.`
                    )}
                    className="w-full text-left p-2 rounded-[var(--radius-paper)]
                               hover:bg-[var(--clay-light)] transition-colors"
                  >
                    <div className="verse-label">{v.display}</div>
                    {v.hint && (
                      <p className="text-[0.8rem] text-[var(--ink-medium)] mt-0.5">{v.hint}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => handleSelectTheme(t)}
          className="p-3 rounded-[var(--radius-paper)] border border-[var(--clay-border)]
                     hover:bg-[var(--clay-light)] transition-colors text-left"
        >
          <div className="text-lg" aria-hidden="true">{t.emoji}</div>
          <div className="text-[0.85rem] font-medium text-[var(--ink-dark)]">
            {t.title}
          </div>
          <div className="text-[0.7rem] text-[var(--ink-medium)] opacity-70 mt-0.5 line-clamp-1">
            {t.description}
          </div>
        </button>
      ))}
    </div>
  )
}
