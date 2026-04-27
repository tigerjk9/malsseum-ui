import { NextRequest, NextResponse } from 'next/server'
import { getSearchModel } from '@/lib/gemini'
import { extractVerseRefs, parseVerseRefString } from '@/lib/verse-parser'
import { fetchVerse } from '@/lib/bible-api'
import { BOOK_IDS } from '@/lib/constants'
import type { TranslationCode, VerseData, VerseRef } from '@/lib/types'

export const runtime = 'nodejs'

interface SearchResult {
  ref: VerseRef
  text: string
  bookNameKo: string
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'q 파라미터 필요' }, { status: 400 })
  }
  if (q.length > 200) {
    return NextResponse.json({ error: '검색어는 200자 이내' }, { status: 400 })
  }

  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined

  try {
    const model = getSearchModel(userApiKey)
    const result = await model.generateContent(`검색어: ${q}`)
    const text = result.response.text()

    const refs = extractVerseRefs(text)
      .map(parseVerseRefString)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => BOOK_IDS[r.book])
      .slice(0, 5)

    if (refs.length === 0) {
      return NextResponse.json({ query: q, results: [] })
    }

    const settled = await Promise.allSettled(
      refs.map(async (r): Promise<SearchResult> => {
        const verseRef: VerseRef = {
          book: r.book,
          chapter: r.chapter,
          verse: r.verse,
          translation: (r.translation as TranslationCode) ?? 'KRV',
        }
        const data: VerseData = await fetchVerse(verseRef)
        return { ref: verseRef, text: data.text, bookNameKo: data.bookNameKo }
      })
    )

    const results = settled
      .filter((s): s is PromiseFulfilledResult<SearchResult> => s.status === 'fulfilled')
      .map((s) => s.value)

    return NextResponse.json({ query: q, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : '검색 실패'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
