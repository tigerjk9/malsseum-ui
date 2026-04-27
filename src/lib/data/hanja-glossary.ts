export interface HanjaEntry {
  korean: string
  hanja: string
  meaning: string
}

export const HANJA_GLOSSARY: HanjaEntry[] = [
  { korean: '사랑', hanja: '愛', meaning: '아낄 애' },
  { korean: '믿음', hanja: '信', meaning: '믿을 신' },
  { korean: '소망', hanja: '所望', meaning: '바라는 바' },
  { korean: '은혜', hanja: '恩惠', meaning: '베풀 은, 은혜 혜' },
  { korean: '진리', hanja: '眞理', meaning: '참 진, 다스릴 리' },
  { korean: '의', hanja: '義', meaning: '옳을 의' },
  { korean: '죄', hanja: '罪', meaning: '허물 죄' },
  { korean: '구원', hanja: '救援', meaning: '건질 구, 도울 원' },
  { korean: '하나님', hanja: '神', meaning: '귀신 신' },
  { korean: '예수', hanja: '耶穌', meaning: '음역' },
  { korean: '그리스도', hanja: '基督', meaning: '음역, 기름 부음 받은 자' },
  { korean: '성령', hanja: '聖靈', meaning: '거룩할 성, 신령 령' },
  { korean: '말씀', hanja: '言', meaning: '말씀 언' },
  { korean: '천국', hanja: '天國', meaning: '하늘 천, 나라 국' },
  { korean: '영원', hanja: '永遠', meaning: '길 영, 멀 원' },
  { korean: '생명', hanja: '生命', meaning: '날 생, 목숨 명' },
  { korean: '평안', hanja: '平安', meaning: '평평할 평, 편안할 안' },
  { korean: '기도', hanja: '祈禱', meaning: '빌 기, 빌 도' },
  { korean: '회개', hanja: '悔改', meaning: '뉘우칠 회, 고칠 개' },
  { korean: '용서', hanja: '容恕', meaning: '용납할 용, 용서할 서' },
  { korean: '교회', hanja: '敎會', meaning: '가르칠 교, 모일 회' },
  { korean: '복음', hanja: '福音', meaning: '복 복, 소리 음' },
  { korean: '계명', hanja: '誡命', meaning: '경계할 계, 목숨 명' },
  { korean: '율법', hanja: '律法', meaning: '법칙 율, 법 법' },
  { korean: '선지자', hanja: '先知者', meaning: '먼저 선, 알 지, 사람 자' },
  { korean: '제자', hanja: '弟子', meaning: '아우 제, 아들 자' },
  { korean: '부활', hanja: '復活', meaning: '회복할 부, 살 활' },
  { korean: '심판', hanja: '審判', meaning: '살필 심, 판단할 판' },
  { korean: '경배', hanja: '敬拜', meaning: '공경할 경, 절 배' },
  { korean: '찬양', hanja: '讚揚', meaning: '기릴 찬, 날릴 양' },
]

export type HanjaSegment =
  | { type: 'plain'; text: string }
  | { type: 'hanja'; text: string; hanja: string }

export function annotateHanja(text: string): HanjaSegment[] {
  const sorted = [...HANJA_GLOSSARY].sort((a, b) => b.korean.length - a.korean.length)
  const segments: HanjaSegment[] = []
  let i = 0
  while (i < text.length) {
    let matched = false
    for (const entry of sorted) {
      if (text.startsWith(entry.korean, i)) {
        segments.push({ type: 'hanja', text: entry.korean, hanja: entry.hanja })
        i += entry.korean.length
        matched = true
        break
      }
    }
    if (!matched) {
      const last = segments[segments.length - 1]
      if (last && last.type === 'plain') last.text += text[i]
      else segments.push({ type: 'plain', text: text[i] })
      i++
    }
  }
  return segments
}
