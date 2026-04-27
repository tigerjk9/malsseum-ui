const VERSE_TAG_RE = /\[\[VERSE:([^\]]+)\]\]/g

export function extractVerseRefs(text: string): string[] {
  const matches = new Set<string>()
  for (const match of text.matchAll(VERSE_TAG_RE)) {
    matches.add(match[1])
  }
  return Array.from(matches)
}

export function stripVerseTags(text: string): string {
  return text.replace(VERSE_TAG_RE, '')
}

export function parseVerseRefString(ref: string): {
  book: string
  chapter: number
  verse: number
  translation: string
} | null {
  const parts = ref.split(':')
  if (parts.length !== 4) return null
  const [book, chStr, vsStr, translation] = parts
  const chapter = parseInt(chStr, 10)
  const verse = parseInt(vsStr, 10)
  if (isNaN(chapter) || isNaN(verse)) return null
  return { book, chapter, verse, translation }
}
