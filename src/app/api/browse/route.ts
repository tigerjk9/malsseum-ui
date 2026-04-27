import { NextRequest, NextResponse } from 'next/server'
import { fetchChapter } from '@/lib/bible-api'
import { BOOK_IDS } from '@/lib/constants'
import type { TranslationCode } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const book = searchParams.get('book')
  const chapterStr = searchParams.get('chapter')
  const translation = (searchParams.get('translation') ?? 'KRV') as TranslationCode

  if (!book || !chapterStr) {
    return NextResponse.json(
      { error: 'book, chapter 파라미터 필요' },
      { status: 400 }
    )
  }

  const chapter = parseInt(chapterStr, 10)
  if (isNaN(chapter) || chapter < 1) {
    return NextResponse.json({ error: 'chapter는 양의 정수' }, { status: 400 })
  }

  if (!BOOK_IDS[book]) {
    return NextResponse.json({ error: `알 수 없는 책: ${book}` }, { status: 400 })
  }

  try {
    const data = await fetchChapter({ book, chapter, translation })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : '챕터 조회 실패'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
