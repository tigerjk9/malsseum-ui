import { NextRequest, NextResponse } from 'next/server'
import { fetchVerse } from '@/lib/bible-api'
import { getOriginalModel } from '@/lib/gemini'
import { BOOK_IDS } from '@/lib/constants'
import type { TranslationCode, VerseRef } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) {
    return NextResponse.json({ error: 'ref 파라미터 필요 (예: John:3:16)' }, { status: 400 })
  }

  const parts = ref.split(':')
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'ref 형식: 책명:장:절' }, { status: 400 })
  }

  const [book, chStr, vsStr] = parts
  const chapter = parseInt(chStr, 10)
  const verse = parseInt(vsStr, 10)

  if (!BOOK_IDS[book] || isNaN(chapter) || isNaN(verse)) {
    return NextResponse.json({ error: '알 수 없는 책명 또는 잘못된 장/절' }, { status: 400 })
  }

  const verseRef: VerseRef = { book, chapter, verse, translation: 'KRV' as TranslationCode }
  const userApiKey = req.headers.get('x-gemini-api-key') ?? undefined

  try {
    const verseData = await fetchVerse(verseRef)
    const model = getOriginalModel(userApiKey)
    const result = await model.generateContent(
      `구절: ${book} ${chapter}:${verse}\n본문(KRV): ${verseData.text}`
    )
    const text = result.response.text()
    const cleaned = text
      .replace(/^\s*```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    let data: { language: string; words: unknown[] }
    try {
      data = JSON.parse(cleaned)
    } catch {
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start === -1 || end === -1 || end <= start) {
        throw new Error('Gemini가 유효한 JSON을 반환하지 않았습니다.')
      }
      data = JSON.parse(cleaned.slice(start, end + 1))
    }
    return NextResponse.json({
      ref: `${book}:${chapter}:${verse}`,
      bookNameKo: verseData.bookNameKo,
      verse: verseData.text,
      language: data.language,
      words: data.words,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '원어 분석 실패'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
