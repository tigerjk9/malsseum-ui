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
