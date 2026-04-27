import { BOOK_IDS, BOOK_NAMES_KO, BOLLS_TRANSLATIONS } from './constants'
import type { VerseRef, VerseData, TranslationCode } from './types'

export function buildBollsUrl(ref: VerseRef): string {
  const bookId = BOOK_IDS[ref.book]
  if (!bookId) throw new Error(`Unknown book: ${ref.book}`)
  return `https://bolls.life/get-verse/${ref.translation}/${bookId}/${ref.chapter}/${ref.verse}/`
}

function buildGetBibleUrl(ref: VerseRef): string {
  const bookId = BOOK_IDS[ref.book]
  if (!bookId) throw new Error(`Unknown book: ${ref.book}`)
  const trans = ref.translation.toLowerCase()
  return `https://api.getbible.net/v2/${trans}/${bookId}/${ref.chapter}.json`
}

export async function fetchVerse(ref: VerseRef): Promise<VerseData> {
  const url = BOLLS_TRANSLATIONS.includes(ref.translation as TranslationCode)
    ? buildBollsUrl(ref)
    : buildGetBibleUrl(ref)

  const res = await fetch(url, { next: { revalidate: 86400 } } as RequestInit)
  if (!res.ok) throw new Error(`Bible API ${res.status}`)

  const data = await res.json()
  return {
    ref,
    text: data.text ?? data.verse ?? '',
    bookNameKo: BOOK_NAMES_KO[ref.book] ?? ref.book,
  }
}

export async function fetchVerseGetBible(ref: VerseRef): Promise<VerseData> {
  const url = buildGetBibleUrl(ref)
  const res = await fetch(url, { next: { revalidate: 86400 } } as RequestInit)
  if (!res.ok) throw new Error(`GetBible API ${res.status}`)
  const data = await res.json()
  const verseText = data.verses?.[String(ref.verse)]?.verse ?? ''
  return {
    ref,
    text: verseText,
    bookNameKo: BOOK_NAMES_KO[ref.book] ?? ref.book,
  }
}

export interface ChapterData {
  book: string
  chapter: number
  bookNameKo: string
  translation: TranslationCode
  verses: { verse: number; text: string }[]
}

interface BollsVerseRow {
  pk?: number
  verse: number
  text: string
}

export async function fetchChapter(params: {
  book: string
  chapter: number
  translation: TranslationCode
}): Promise<ChapterData> {
  const { book, chapter, translation } = params
  const bookId = BOOK_IDS[book]
  if (!bookId) throw new Error(`Unknown book: ${book}`)

  const useBolls = BOLLS_TRANSLATIONS.includes(translation)
  const url = useBolls
    ? `https://bolls.life/get-text/${translation}/${bookId}/${chapter}/`
    : `https://api.getbible.net/v2/${translation.toLowerCase()}/${bookId}/${chapter}.json`

  const res = await fetch(url, { next: { revalidate: 86400 } } as RequestInit)
  if (!res.ok) throw new Error(`Bible API ${res.status}`)

  const data = await res.json()

  let verses: { verse: number; text: string }[] = []
  if (useBolls) {
    verses = (data as BollsVerseRow[]).map((row) => ({ verse: row.verse, text: row.text }))
  } else {
    const versesObj = (data?.verses ?? {}) as Record<string, { verse: string }>
    verses = Object.entries(versesObj)
      .map(([k, v]) => ({ verse: parseInt(k, 10), text: v.verse }))
      .filter((v) => !isNaN(v.verse))
      .sort((a, b) => a.verse - b.verse)
  }

  return {
    book,
    chapter,
    translation,
    bookNameKo: BOOK_NAMES_KO[book] ?? book,
    verses,
  }
}
