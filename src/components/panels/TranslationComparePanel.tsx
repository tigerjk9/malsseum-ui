'use client'
import { useEffect, useState } from 'react'
import type { VerseRef, TranslationCode, VerseData } from '@/lib/types'
import { TRANSLATION_LABELS, BOOK_NAMES_KO } from '@/lib/constants'

interface Props {
  verseRef: VerseRef | null
}

const COMPARE_TRANSLATIONS: TranslationCode[] = ['KRV', 'RNKSV', 'NIV', 'ESV', 'KJV']

type Row =
  | { translation: TranslationCode; status: 'loading' }
  | { translation: TranslationCode; status: 'ok'; text: string }
  | { translation: TranslationCode; status: 'error'; message: string }

export default function TranslationComparePanel({ verseRef }: Props) {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    if (!verseRef) {
      setRows([])
      return
    }

    setRows(COMPARE_TRANSLATIONS.map((t) => ({ translation: t, status: 'loading' })))

    const controller = new AbortController()
    const refStr = `${verseRef.book}:${verseRef.chapter}:${verseRef.verse}`

    Promise.allSettled(
      COMPARE_TRANSLATIONS.map(async (t) => {
        const res = await fetch(`/api/verse?ref=${refStr}&translation=${t}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const data: VerseData = await res.json()
        return { translation: t, text: data.text }
      })
    ).then((results) => {
      if (controller.signal.aborted) return
      setRows(
        results.map((r, i) => {
          const t = COMPARE_TRANSLATIONS[i]
          if (r.status === 'fulfilled') {
            return { translation: t, status: 'ok' as const, text: r.value.text }
          }
          return { translation: t, status: 'error' as const, message: '조회 실패' }
        })
      )
    })

    return () => controller.abort()
  }, [verseRef])

  if (!verseRef) {
    return (
      <p className="text-[0.85rem] text-[var(--ink-medium)] leading-relaxed">
        구절을 선택하면 다섯 번역본을 나란히 보여드립니다.
        <br />
        채팅의 구절 카드에서 <span className="text-[var(--clay)]">번역 비교</span> 를 눌러보세요.
      </p>
    )
  }

  const bookKo = BOOK_NAMES_KO[verseRef.book] ?? verseRef.book

  return (
    <div className="space-y-4">
      <div>
        <span className="verse-label">
          {bookKo} {verseRef.chapter}:{verseRef.verse}
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.translation}
            className="border-l-2 border-[var(--clay-border)] pl-3"
          >
            <div className="verse-label mb-1">{TRANSLATION_LABELS[row.translation]}</div>
            {row.status === 'loading' && (
              <div className="text-[0.8rem] text-[var(--ink-medium)] opacity-60">조회 중...</div>
            )}
            {row.status === 'ok' && <p className="verse-text text-[0.95rem]">{row.text}</p>}
            {row.status === 'error' && (
              <div className="text-[0.75rem] text-[var(--ink-medium)] italic">조회 실패</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
