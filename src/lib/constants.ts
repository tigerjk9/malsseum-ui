import type { TranslationCode } from './types'

export const BOOK_IDS: Record<string, number> = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5,
  Joshua: 6, Judges: 7, Ruth: 8, '1Samuel': 9, '2Samuel': 10,
  '1Kings': 11, '2Kings': 12, '1Chronicles': 13, '2Chronicles': 14,
  Ezra: 15, Nehemiah: 16, Esther: 17, Job: 18, Psalms: 19,
  Proverbs: 20, Ecclesiastes: 21, SongOfSolomon: 22, Isaiah: 23,
  Jeremiah: 24, Lamentations: 25, Ezekiel: 26, Daniel: 27,
  Hosea: 28, Joel: 29, Amos: 30, Obadiah: 31, Jonah: 32,
  Micah: 33, Nahum: 34, Habakkuk: 35, Zephaniah: 36, Haggai: 37,
  Zechariah: 38, Malachi: 39, Matthew: 40, Mark: 41, Luke: 42,
  John: 43, Acts: 44, Romans: 45, '1Corinthians': 46, '2Corinthians': 47,
  Galatians: 48, Ephesians: 49, Philippians: 50, Colossians: 51,
  '1Thessalonians': 52, '2Thessalonians': 53, '1Timothy': 54, '2Timothy': 55,
  Titus: 56, Philemon: 57, Hebrews: 58, James: 59, '1Peter': 60,
  '2Peter': 61, '1John': 62, '2John': 63, '3John': 64, Jude: 65,
  Revelation: 66,
}

export const BOOK_NAMES_KO: Record<string, string> = {
  Genesis: '창세기', Exodus: '출애굽기', Leviticus: '레위기',
  Numbers: '민수기', Deuteronomy: '신명기', Joshua: '여호수아',
  Judges: '사사기', Ruth: '룻기', '1Samuel': '사무엘상', '2Samuel': '사무엘하',
  '1Kings': '열왕기상', '2Kings': '열왕기하', '1Chronicles': '역대상',
  '2Chronicles': '역대하', Ezra: '에스라', Nehemiah: '느헤미야',
  Esther: '에스더', Job: '욥기', Psalms: '시편', Proverbs: '잠언',
  Ecclesiastes: '전도서', SongOfSolomon: '아가', Isaiah: '이사야',
  Jeremiah: '예레미야', Lamentations: '예레미야애가', Ezekiel: '에스겔',
  Daniel: '다니엘', Hosea: '호세아', Joel: '요엘', Amos: '아모스',
  Obadiah: '오바댜', Jonah: '요나', Micah: '미가', Nahum: '나훔',
  Habakkuk: '하박국', Zephaniah: '스바냐', Haggai: '학개',
  Zechariah: '스가랴', Malachi: '말라기', Matthew: '마태복음',
  Mark: '마가복음', Luke: '누가복음', John: '요한복음', Acts: '사도행전',
  Romans: '로마서', '1Corinthians': '고린도전서', '2Corinthians': '고린도후서',
  Galatians: '갈라디아서', Ephesians: '에베소서', Philippians: '빌립보서',
  Colossians: '골로새서', '1Thessalonians': '데살로니가전서',
  '2Thessalonians': '데살로니가후서', '1Timothy': '디모데전서',
  '2Timothy': '디모데후서', Titus: '디도서', Philemon: '빌레몬서',
  Hebrews: '히브리서', James: '야고보서', '1Peter': '베드로전서',
  '2Peter': '베드로후서', '1John': '요한일서', '2John': '요한이서',
  '3John': '요한삼서', Jude: '유다서', Revelation: '요한계시록',
}

export const TRANSLATION_LABELS: Record<TranslationCode, string> = {
  KRV: '개역한글',
  RNKSV: '새번역',
  NIV: 'NIV',
  ESV: 'ESV',
  KJV: 'KJV',
  WEB: 'WEB',
}

export const BOLLS_TRANSLATIONS: TranslationCode[] = ['KRV', 'RNKSV', 'NIV', 'ESV']
export const GETBIBLE_TRANSLATIONS: TranslationCode[] = ['KJV', 'WEB']

export const DEFAULT_TRANSLATION: TranslationCode = 'KRV'

export const GEMINI_KEY_STORAGE_KEY = 'malsseum_gemini_key'
export const ACCESS_MODE_KEY = 'malsseum_access_mode'
