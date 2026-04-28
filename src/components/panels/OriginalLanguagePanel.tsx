'use client'
import { useEffect, useState } from 'react'
import { BOOK_NAMES_KO } from '@/lib/constants'
import type { VerseRef } from '@/lib/types'

interface Props {
  verseRef: VerseRef | null
  geminiKey?: string
}

interface OriginalWord {
  korean: string
  original: string
  transliteration: string
  meaning: string
  context?: string
}

interface OriginalResponse {
  ref: string
  bookNameKo: string
  verse: string
  language: 'Greek' | 'Hebrew'
  words: OriginalWord[]
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

export default function OriginalLanguagePanel({ verseRef, geminiKey }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<OriginalResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!verseRef) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('idle')
      setData(null)
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    setData(null)
    setErrorMsg('')

    const refStr = `${verseRef.book}:${verseRef.chapter}:${verseRef.verse}`
    const originalHeaders: HeadersInit = {}
    if (geminiKey) originalHeaders['x-gemini-api-key'] = geminiKey
    fetch(`/api/original?ref=${refStr}`, { signal: controller.signal, headers: originalHeaders })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `원어 분석 실패 (${res.status})`)
        }
        return res.json() as Promise<OriginalResponse>
      })
      .then((json) => {
        if (controller.signal.aborted) return
        setData(json)
        setStatus('ok')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : '원어 분석 실패'
        setErrorMsg(message)
        setStatus('error')
      })

    return () => controller.abort()
  }, [verseRef, geminiKey])

  if (!verseRef) {
    return (
      <p className="text-[0.85rem] text-[var(--ink-medium)] leading-relaxed">
        구절을 선택하면 원어 단어를 풀어드립니다.
        <br />
        채팅의 구절 카드에서 <span className="text-[var(--clay)]">원어 보기</span> 를 눌러보세요.
      </p>
    )
  }

  const bookKo = BOOK_NAMES_KO[verseRef.book] ?? verseRef.book

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="verse-label">
          {bookKo} {verseRef.chapter}:{verseRef.verse}
        </span>
        {data?.language && (
          <div className="text-[0.7rem] text-[var(--ink-medium)] italic">
            {data.language === 'Greek' ? '헬라어 (그리스어)' : '히브리어'} 분석
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] opacity-60">분석 중...</div>
      )}

      {status === 'error' && (
        <div className="text-[0.8rem] text-[var(--ink-medium)] italic">{errorMsg}</div>
      )}

      {status === 'ok' && data && (
        <ul className="space-y-3">
          {data.words.map((w, idx) => (
            <li
              key={`${w.korean}-${idx}`}
              className="border-l-2 border-[var(--clay-border)] pl-3 space-y-1"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[0.95rem] text-[var(--ink-dark)] font-medium">
                  {w.korean}
                </span>
                <span className="text-[1rem] text-[var(--clay)]">{w.original}</span>
                <span className="text-[0.7rem] text-[var(--ink-medium)] italic">
                  {w.transliteration}
                </span>
              </div>
              <p className="text-[0.8rem] text-[var(--ink-medium)] leading-relaxed">
                {w.meaning}
              </p>
              {w.context && (
                <p className="text-[0.75rem] text-[var(--ink-medium)] opacity-80 italic">
                  → {w.context}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
