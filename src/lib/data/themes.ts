export interface ThemeVerse {
  ref: string
  display: string
  hint?: string
}

export interface Theme {
  id: string
  title: string
  emoji: string
  description: string
  verses: ThemeVerse[]
}

export const THEMES: Theme[] = [
  {
    id: 'love', title: '사랑', emoji: '💗',
    description: '하나님과 이웃을 향한 사랑',
    verses: [
      { ref: '1John:4:8', display: '요한일서 4:8', hint: '사랑하지 아니하는 자는 하나님을 알지 못하나니' },
      { ref: '1Corinthians:13:4', display: '고린도전서 13:4' },
      { ref: 'John:13:34', display: '요한복음 13:34' },
      { ref: 'Romans:5:8', display: '로마서 5:8' },
    ],
  },
  {
    id: 'hope', title: '소망', emoji: '🌅',
    description: '약속에 대한 흔들림 없는 기다림',
    verses: [
      { ref: 'Romans:15:13', display: '로마서 15:13' },
      { ref: 'Jeremiah:29:11', display: '예레미야 29:11' },
      { ref: 'Hebrews:11:1', display: '히브리서 11:1' },
      { ref: 'Lamentations:3:22', display: '예레미야애가 3:22' },
    ],
  },
  {
    id: 'forgiveness', title: '용서', emoji: '🕊️',
    description: '받은 용서, 베푸는 용서',
    verses: [
      { ref: 'Matthew:6:14', display: '마태복음 6:14' },
      { ref: 'Ephesians:4:32', display: '에베소서 4:32' },
      { ref: 'Colossians:3:13', display: '골로새서 3:13' },
      { ref: '1John:1:9', display: '요한일서 1:9' },
    ],
  },
  {
    id: 'peace', title: '평안', emoji: '🌿',
    description: '세상이 줄 수 없는 평안',
    verses: [
      { ref: 'John:14:27', display: '요한복음 14:27' },
      { ref: 'Philippians:4:7', display: '빌립보서 4:7' },
      { ref: 'Isaiah:26:3', display: '이사야 26:3' },
      { ref: 'Psalms:23:1', display: '시편 23:1' },
    ],
  },
  {
    id: 'patience', title: '인내', emoji: '⏳',
    description: '기다림 가운데 자라는 성품',
    verses: [
      { ref: 'James:1:2', display: '야고보서 1:2' },
      { ref: 'Romans:5:3', display: '로마서 5:3' },
      { ref: 'Hebrews:12:1', display: '히브리서 12:1' },
      { ref: 'Galatians:6:9', display: '갈라디아서 6:9' },
    ],
  },
  {
    id: 'wisdom', title: '지혜', emoji: '🦉',
    description: '여호와를 경외하는 지식',
    verses: [
      { ref: 'Proverbs:1:7', display: '잠언 1:7' },
      { ref: 'James:1:5', display: '야고보서 1:5' },
      { ref: 'Proverbs:3:5', display: '잠언 3:5' },
      { ref: 'Ecclesiastes:7:12', display: '전도서 7:12' },
    ],
  },
  {
    id: 'thanks', title: '감사', emoji: '🙏',
    description: '범사에 감사하라',
    verses: [
      { ref: '1Thessalonians:5:18', display: '데살로니가전서 5:18' },
      { ref: 'Psalms:100:4', display: '시편 100:4' },
      { ref: 'Colossians:3:15', display: '골로새서 3:15' },
      { ref: 'Philippians:4:6', display: '빌립보서 4:6' },
    ],
  },
  {
    id: 'prayer', title: '기도', emoji: '✨',
    description: '쉬지 말고 기도하라',
    verses: [
      { ref: 'Matthew:6:9', display: '마태복음 6:9' },
      { ref: '1Thessalonians:5:17', display: '데살로니가전서 5:17' },
      { ref: 'James:5:16', display: '야고보서 5:16' },
      { ref: 'Philippians:4:6', display: '빌립보서 4:6' },
    ],
  },
  {
    id: 'repentance', title: '회개', emoji: '🌧️',
    description: '돌이켜 새로워지는 마음',
    verses: [
      { ref: 'Acts:3:19', display: '사도행전 3:19' },
      { ref: '2Chronicles:7:14', display: '역대하 7:14' },
      { ref: '1John:1:9', display: '요한일서 1:9' },
      { ref: 'Psalms:51:10', display: '시편 51:10' },
    ],
  },
  {
    id: 'faith', title: '믿음', emoji: '⛰️',
    description: '바라는 것들의 실상',
    verses: [
      { ref: 'Hebrews:11:1', display: '히브리서 11:1' },
      { ref: 'Romans:10:17', display: '로마서 10:17' },
      { ref: 'Mark:11:24', display: '마가복음 11:24' },
      { ref: 'James:2:17', display: '야고보서 2:17' },
    ],
  },
  {
    id: 'comfort', title: '위로', emoji: '🤝',
    description: '슬픔 가운데 임하는 위로',
    verses: [
      { ref: 'Matthew:5:4', display: '마태복음 5:4' },
      { ref: '2Corinthians:1:3', display: '고린도후서 1:3' },
      { ref: 'Psalms:34:18', display: '시편 34:18' },
      { ref: 'Isaiah:41:10', display: '이사야 41:10' },
    ],
  },
  {
    id: 'obedience', title: '순종', emoji: '🛤️',
    description: '말씀 따라 걷는 길',
    verses: [
      { ref: '1Samuel:15:22', display: '사무엘상 15:22' },
      { ref: 'John:14:15', display: '요한복음 14:15' },
      { ref: 'James:1:22', display: '야고보서 1:22' },
      { ref: 'Romans:12:1', display: '로마서 12:1' },
    ],
  },
]

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id)
}

export function searchThemes(query: string): Theme[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return THEMES.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
  )
}
