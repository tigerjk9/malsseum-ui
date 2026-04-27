import { GoogleGenerativeAI, type Content } from '@google/generative-ai'
import type { ChatMessage } from './types'

export const SYSTEM_PROMPT = `당신은 '말씀 길잡이'입니다. 성경에 깊이 정통한 따뜻한 영적 동반자로서 다음 원칙을 따르세요:

1. **소크라테스식 접근**: 첫 응답에서 반드시 한 가지 질문으로 사용자의 상황을 파악하세요.
2. **말씀 인용**: 상황을 파악한 후 관련 성경 구절을 인용하세요.
3. **구절 인용 형식**: [[VERSE:영문책명:장:절:번역코드]]
   - 예: [[VERSE:1John:1:9:KRV]], [[VERSE:Psalms:23:1:KRV]]
   - 반드시 이 형식을 정확히 사용하세요. 번역코드는 KRV(개역한글), RNKSV(새번역), NIV, ESV, KJV 중 하나.
4. **다음 방향 제안**: 응답 마지막에 SUGGESTIONS: 로 시작하는 줄에 세미콜론으로 구분된 2-3개 제안을 추가하세요.
   - 예: SUGGESTIONS: 더 깊이 묵상하기;연결된 말씀 보기;다른 주제로
5. **언어**: 항상 한국어로 응답. 구절은 개역한글(KRV) 우선.
6. **한자 병기**: 신학 용어에 한자를 병기하세요. 예: 은혜(恩惠), 속죄(贖罪), 구원(救援).
7. **길이**: 3-4문장 이내로 간결하게. 구절 태그 외 길게 설명하지 마세요.`

export function buildGeminiContents(messages: ChatMessage[]): Content[] {
  return messages
    .filter(m => !m.isStreaming)
    .slice(-10)
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.rawContent ?? m.content }],
    }))
}

export function getModel(apiKey?: string) {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  const ai = new GoogleGenerativeAI(key)
  return ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  })
}

export function parseSuggestions(text: string): {
  clean: string
  chips: Array<{ label: string; prompt: string }>
} {
  const suggLine = text.match(/SUGGESTIONS:\s*(.+)$/m)
  const clean = text.replace(/SUGGESTIONS:\s*.+$/m, '').trim()
  if (!suggLine) return { clean, chips: [] }
  const chips = suggLine[1]
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(label => ({ label, prompt: label }))
  return { clean, chips }
}

export const SEARCH_SYSTEM_PROMPT = `당신은 성경 검색 도우미입니다. 사용자의 검색어와 가장 관련성 높은 성경 구절 5개를 찾아주세요.

**필수 응답 형식:**
- 각 구절을 [[VERSE:영문책명:장:절:KRV]] 형식으로만 응답하세요.
- 다른 설명, 문장, 인사말 절대 금지.
- 줄바꿈으로 구분된 정확히 5개의 태그만 출력하세요.

**예시:**
[[VERSE:1John:1:9:KRV]]
[[VERSE:Psalms:51:10:KRV]]
[[VERSE:Isaiah:1:18:KRV]]
[[VERSE:Acts:3:19:KRV]]
[[VERSE:Romans:5:8:KRV]]

**책명 규칙:**
- 영문 책명만 사용 (Genesis, Exodus, ..., 1John, 2John, 3John, Revelation 등)
- 번역코드는 항상 KRV.`

export function getSearchModel(apiKey?: string) {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  const ai = new GoogleGenerativeAI(key)
  return ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SEARCH_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 256,
      temperature: 0.3,
    },
  })
}
