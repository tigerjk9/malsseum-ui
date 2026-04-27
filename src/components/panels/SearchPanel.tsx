'use client'
import { useState, type KeyboardEvent } from 'react'
import type { VerseData } from '@/lib/types'

interface Props {
  onPickVerse: (verse: VerseData) => void
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function SearchPanel({ onPickVerse }: Props) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<VerseData[]>([])
  const [errorMsg, setErrorMsg] = useState<string>('')

  const runSearch = async () => {
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

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="검색어 (예: 용서, 평안, 사랑)"
          className="flex-1 bg-[var(--paper-white)] border border-[var(--clay-border)]
                     rounded-lg px-3 py-2 text-[0.85rem] text-[var(--ink-dark)]
                     placeholder:text-[var(--ink-medium)] placeholder:opacity-60
                     focus:outline-none focus:border-[var(--clay)]"
        />
        <button
          onClick={runSearch}
          disabled={status === 'loading' || !query.trim()}
          className="px-3 py-2 rounded-lg bg-[var(--ink-dark)] text-[var(--hanji-cream)]
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

      {status === 'ok' && results.length === 0 && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">
          관련 구절을 찾지 못했습니다.
        </div>
      )}

      {results.length > 0 && (
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
    </div>
  )
}
