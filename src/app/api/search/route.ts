import { NextRequest, NextResponse } from 'next/server'
import { retrieve } from '@/lib/rag'
import type { TranslationCode, VerseRef } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

interface SearchResult {
  ref: VerseRef
  text: string
  bookNameKo: string
  score?: number
}

const TOP_K = 5

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'q 파라미터 필요' }, { status: 400 })
  }
  if (q.length > 200) {
    return NextResponse.json({ error: '검색어는 200자 이내' }, { status: 400 })
  }

  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined
  const apiKey = userApiKey ?? process.env.GEMINI_API_KEY ?? ''
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  try {
    const hits = await retrieve(q, TOP_K, apiKey)
    const results: SearchResult[] = hits.map((h) => ({
      ref: {
        book: h.ref.book,
        chapter: h.ref.chapter,
        verse: h.ref.verse,
        translation: 'KRV' as TranslationCode,
      },
      text: h.text,
      bookNameKo: h.bookNameKo,
      score: Number(h.score.toFixed(4)),
    }))
    return NextResponse.json({ query: q, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : '검색 실패'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
