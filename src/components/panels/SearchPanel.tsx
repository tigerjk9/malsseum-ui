'use client'
import { useState, type KeyboardEvent } from 'react'
import { searchThemes, type Theme, type ThemeVerse } from '@/lib/data/themes'
import type { VerseData, VerseRef, TranslationCode } from '@/lib/types'

interface Props {
  onPickVerse: (verse: VerseData) => void
}

type Status = 'idle' | 'loading' | 'ok' | 'error'
type Mode = 'verse' | 'theme'

function parseThemeRef(ref: string): VerseRef | null {
  const parts = ref.split(':')
  if (parts.length !== 3) return null
  const [book, c, v] = parts
  const chapter = parseInt(c, 10)
  const verse = parseInt(v, 10)
  if (!book || isNaN(chapter) || isNaN(verse)) return null
  return { book, chapter, verse, translation: 'KRV' as TranslationCode }
}

export default function SearchPanel({ onPickVerse }: Props) {
  const [mode, setMode] = useState<Mode>('verse')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<VerseData[]>([])
  const [themeMatches, setThemeMatches] = useState<Theme[]>([])
  const [errorMsg, setErrorMsg] = useState<string>('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setStatus('idle')
    setResults([])
    setThemeMatches([])
    setErrorMsg('')
  }

  const runVerseSearch = async () => {
    const q = query.trim()
    if (!q) return
    setStatus('loading')
    setErrorMsg('')
    setResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `검색 실패 (${res.status})`)
      }
      const data: { results: VerseData[] } = await res.json()
      setResults(data.results)
      setStatus('ok')
    } catch (err) {
      const message = err instanceof Error ? err.message : '검색 실패'
      setErrorMsg(message)
      setStatus('error')
    }
  }

  const runThemeSearch = () => {
    const matches = searchThemes(query)
    setThemeMatches(matches)
    setStatus('ok')
  }

  const runSearch = () => {
    if (mode === 'theme') runThemeSearch()
    else runVerseSearch()
  }

  const pickThemeVerse = async (theme: Theme, tv: ThemeVerse) => {
    const ref = parseThemeRef(tv.ref)
    if (!ref) return
    setStatus('loading')
    try {
      const res = await fetch(
        `/api/verse?ref=${ref.book}:${ref.chapter}:${ref.verse}&translation=${ref.translation}`
      )
      if (!res.ok) throw new Error('본문 로드 실패')
      const verse: VerseData = await res.json()
      onPickVerse(verse)
      setStatus('ok')
    } catch (err) {
      const message = err instanceof Error ? err.message : '본문 로드 실패'
      setErrorMsg(message)
      setStatus('error')
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
    }
  }

  const placeholder = mode === 'theme' ? '주제 키워드 (예: 사랑, 용서)' : '검색어 (예: 용서, 평안, 사랑)'

  return (
    <div className="space-y-4">
      <div className="flex gap-1 text-[0.7rem]" role="tablist" aria-label="검색 모드">
        <button
          role="tab"
          aria-selected={mode === 'verse'}
          onClick={() => switchMode('verse')}
          className={`flex-1 px-2 py-1 rounded-[var(--radius-paper)] transition-colors ${
            mode === 'verse'
              ? 'bg-[var(--clay-light)] text-[var(--clay)]'
              : 'text-[var(--ink-medium)] hover:bg-[var(--clay-light)]'
          }`}
        >
          구절 검색
        </button>
        <button
          role="tab"
          aria-selected={mode === 'theme'}
          onClick={() => switchMode('theme')}
          className={`flex-1 px-2 py-1 rounded-[var(--radius-paper)] transition-colors ${
            mode === 'theme'
              ? 'bg-[var(--clay-light)] text-[var(--clay)]'
              : 'text-[var(--ink-medium)] hover:bg-[var(--clay-light)]'
          }`}
        >
          주제로 검색
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 bg-[var(--paper-white)] border border-[var(--clay-border)]
                     rounded-[var(--radius-control)] px-3 py-2 text-[0.85rem] text-[var(--ink-dark)]
                     placeholder:text-[var(--ink-medium)] placeholder:opacity-60
                     focus:border-[var(--clay)]"
        />
        <button
          onClick={runSearch}
          disabled={status === 'loading' || !query.trim()}
          className="px-3 py-2 rounded-[var(--radius-control)] bg-[var(--ink-dark)] text-[var(--hanji-cream)]
                     text-[0.8rem] hover:bg-[var(--clay)] transition-colors
                     disabled:opacity-40"
        >
          검색
        </button>
      </div>

      {status === 'loading' && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] opacity-60">검색 중...</div>
      )}

      {status === 'error' && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">{errorMsg}</div>
      )}

      {mode === 'verse' && status === 'ok' && results.length === 0 && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">
          관련 구절을 찾지 못했습니다.
        </div>
      )}

      {mode === 'verse' && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((v) => (
            <li key={`${v.ref.book}-${v.ref.chapter}-${v.ref.verse}`}>
              <button
                onClick={() => onPickVerse(v)}
                className="w-full text-left border-l-2 border-[var(--clay-border)]
                           hover:border-[var(--clay)] pl-3 py-1
                           transition-colors group"
              >
                <div className="verse-label mb-1 group-hover:text-[var(--clay)]">
                  {v.bookNameKo} {v.ref.chapter}:{v.ref.verse}
                </div>
                <p className="verse-text text-[0.85rem] line-clamp-3">{v.text}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {mode === 'theme' && status === 'ok' && themeMatches.length === 0 && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">
          일치하는 주제가 없습니다.
        </div>
      )}

      {mode === 'theme' && themeMatches.length > 0 && (
        <div className="space-y-3">
          {themeMatches.map((t) => (
            <div key={t.id} className="space-y-1">
              <div className="text-[0.85rem] font-medium text-[var(--ink-dark)]">
                {t.emoji} {t.title}
              </div>
              <ul className="space-y-1 pl-2">
                {t.verses.map((v) => (
                  <li key={v.ref}>
                    <button
                      onClick={() => pickThemeVerse(t, v)}
                      className="text-[0.8rem] text-[var(--ink-medium)] hover:text-[var(--clay)]
                                 hover:underline text-left"
                    >
                      {v.display}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
