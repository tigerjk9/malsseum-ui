'use client'
import { useState } from 'react'
import { BOOK_IDS, BOOK_NAMES_KO } from '@/lib/constants'
import type { TranslationCode, VerseData } from '@/lib/types'

interface Props {
  onPickVerse: (verse: VerseData) => void
  translation: TranslationCode
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

const BOOK_OPTIONS = Object.keys(BOOK_IDS)

interface BrowseChapterResponse {
  book: string
  chapter: number
  bookNameKo: string
  translation: TranslationCode
  verses: { verse: number; text: string }[]
}

export default function BrowsePanel({ onPickVerse, translation }: Props) {
  const [book, setBook] = useState<string>('John')
  const [chapterStr, setChapterStr] = useState<string>('1')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [data, setData] = useState<BrowseChapterResponse | null>(null)

  const load = async () => {
    const chapter = parseInt(chapterStr, 10)
    if (!book || isNaN(chapter) || chapter < 1) return
    setStatus('loading')
    setErrorMsg('')
    setData(null)
    try {
      const res = await fetch(
        `/api/browse?book=${book}&chapter=${chapter}&translation=${translation}`
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `조회 실패 (${res.status})`)
      }
      const json: BrowseChapterResponse = await res.json()
      setData(json)
      setStatus('ok')
    } catch (err) {
      const message = err instanceof Error ? err.message : '조회 실패'
      setErrorMsg(message)
      setStatus('error')
    }
  }

  const pick = (verse: number, text: string) => {
    if (!data) return
    onPickVerse({
      ref: { book: data.book, chapter: data.chapter, verse, translation: data.translation },
      text,
      bookNameKo: data.bookNameKo,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block">
          <span className="verse-label block mb-1">책</span>
          <select
            value={book}
            onChange={(e) => setBook(e.target.value)}
            className="w-full bg-[var(--paper-white)] border border-[var(--clay-border)]
                       rounded-lg px-3 py-2 text-[0.85rem] text-[var(--ink-dark)]
                       focus:outline-none focus:border-[var(--clay)]"
          >
            {BOOK_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {BOOK_NAMES_KO[b] ?? b}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="verse-label block mb-1">장</span>
          <input
            type="number"
            min={1}
            value={chapterStr}
            onChange={(e) => setChapterStr(e.target.value)}
            className="w-full bg-[var(--paper-white)] border border-[var(--clay-border)]
                       rounded-lg px-3 py-2 text-[0.85rem] text-[var(--ink-dark)]
                       focus:outline-none focus:border-[var(--clay)]"
          />
        </label>
        <button
          onClick={load}
          disabled={status === 'loading'}
          className="w-full px-3 py-2 rounded-lg bg-[var(--ink-dark)]
                     text-[var(--hanji-cream)] text-[0.8rem]
                     hover:bg-[var(--clay)] transition-colors disabled:opacity-40"
        >
          {status === 'loading' ? '불러오는 중...' : '불러오기'}
        </button>
      </div>

      {status === 'error' && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">{errorMsg}</div>
      )}

      {status === 'ok' && data && (
        <div className="space-y-2">
          <div className="verse-label">
            {data.bookNameKo} {data.chapter}장 · {data.verses.length}절
          </div>
          <ul className="space-y-1">
            {data.verses.map((v) => (
              <li key={v.verse}>
                <button
                  onClick={() => pick(v.verse, v.text)}
                  className="w-full text-left py-1 px-2 rounded hover:bg-[var(--clay-light)]
                             transition-colors flex gap-2"
                >
                  <span className="verse-label flex-shrink-0 mt-1 w-6 text-right">
                    {v.verse}
                  </span>
                  <span className="verse-text text-[0.85rem]">{v.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
