import { NextRequest, NextResponse } from 'next/server'
import { fetchVerse } from '@/lib/bible-api'
import { BOOK_IDS } from '@/lib/constants'
import type { TranslationCode, VerseRef } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ref = searchParams.get('ref')
  const translation = (searchParams.get('translation') ?? 'KRV') as TranslationCode

  if (!ref) {
    return NextResponse.json({ error: 'ref 파라미터 필요' }, { status: 400 })
  }

  const parts = ref.split(':')
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'ref 형식: 책명:장:절 (예: 1John:1:9)' }, { status: 400 })
  }

  const [book, chStr, vsStr] = parts
  const chapter = parseInt(chStr, 10)
  const verse = parseInt(vsStr, 10)

  if (!BOOK_IDS[book] || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json({ error: '알 수 없는 책명 또는 잘못된 장/절' }, { status: 400 })
  }

  const verseRef: VerseRef = { book, chapter, verse, translation }

  try {
    const data = await fetchVerse(verseRef)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : '구절 조회 실패'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
