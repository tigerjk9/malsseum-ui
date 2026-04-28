import { NextRequest, NextResponse } from 'next/server'
import { retrieve, expandQuery } from '@/lib/rag'
import { verifyAdminToken } from '@/lib/auth'
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
const SCORE_THRESHOLD = 0.45

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'q 파라미터 필요' }, { status: 400 })
  }
  if (q.length > 200) {
    return NextResponse.json({ error: '검색어는 200자 이내' }, { status: 400 })
  }

  const adminToken = req.headers.get('x-admin-token') ?? ''
  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined
  const isAdmin = verifyAdminToken(adminToken)

  if (!isAdmin && !userApiKey) {
    return NextResponse.json({ error: 'API 키 또는 관리자 인증이 필요합니다.' }, { status: 401 })
  }

  const apiKey = isAdmin ? (process.env.GEMINI_API_KEY ?? '') : (userApiKey ?? '')

  try {
    const expanded = await expandQuery(q, apiKey)
    const allHits = await retrieve(expanded, TOP_K, apiKey)
    const hits = allHits.filter((h) => h.score >= SCORE_THRESHOLD)
    console.log(`[search] query="${q}" expanded="${expanded.slice(0, 80)}" hits=${allHits.length} above_threshold=${hits.length}`)

    if (hits.length === 0) {
      return NextResponse.json({ query: q, results: [], message: '관련 구절을 찾지 못했습니다. 다른 표현으로 검색해 보세요.' })
    }

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
