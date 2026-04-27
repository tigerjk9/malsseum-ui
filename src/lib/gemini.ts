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
7. **길이**: 3-4문장 이내로 간결하게. 구절 태그 외 길게 설명하지 마세요.

8. **RAG 인용 규칙 (중요)**: 사용자 메시지 끝에 "관련 후보 구절(KRV RAG 검색):" 블록이 첨부되면, 인용은 **반드시 그 후보 안에서만** 하세요. 후보 밖 구절을 [[VERSE:...]]로 출력하지 마세요. 후보가 부적합하면 인용 없이 질문만 던지세요. 후보 블록 자체는 사용자에게 노출하지 마세요 — 내부 컨텍스트입니다.`

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

export const SEARCH_SYSTEM_PROMPT = `당신은 성경 검색 도우미입니다. 사용자의 검색어(한글/영어 모두 가능)와 가장 관련성 높은 성경 구절 5개를 찾아주세요.

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
- 한글 책명(요한복음, 시편 등) 절대 금지 — 영문만.
- 번역코드는 항상 KRV.`

export function getSearchModel(apiKey?: string) {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  const ai = new GoogleGenerativeAI(key)
  return ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SEARCH_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.3,
    },
  })
}

export const ORIGINAL_SYSTEM_PROMPT = `당신은 성경 원어(헬라어/히브리어) 분석 도우미입니다.
사용자가 제공한 구절(Bible reference + KRV 본문)에 대해, 핵심 단어 3-5개를 골라
순수 JSON으로만 응답하세요. 마크다운 코드 블록(\`\`\`) 절대 금지, 모든 키와 문자열은 큰따옴표 필수.

**완전한 응답 예시 (이 구조 그대로 따르세요):**
{
  "language": "Greek",
  "words": [
    {
      "korean": "사랑",
      "original": "ἀγάπη",
      "transliteration": "agapē",
      "meaning": "조건 없는 헌신적 사랑. 하나님의 본성을 나타내는 신약의 핵심 어휘.",
      "context": "요한복음 3:16에서 하나님의 자기희생적 사랑을 가리킨다."
    },
    {
      "korean": "세상",
      "original": "κόσμος",
      "transliteration": "kosmos",
      "meaning": "질서 있는 우주, 또는 인류 전체.",
      "context": "여기서는 죄에 빠진 인류 전체를 의미한다."
    }
  ]
}

규칙:
- 신약(마태~계시록) → "Greek", 구약(창세기~말라기) → "Hebrew"
- 확실하지 않은 단어는 절대 포함하지 말 것 (환각 금지).
- 단어 의미는 표준 사전(BDAG/HALOT) 기반 일반 설명에 한정.
- 신학적 해석/주석은 제외 — 단어 의미만.
- "context" 필드는 선택이지만 포함 권장.
- 응답은 JSON 객체 하나만, 앞뒤에 어떤 텍스트도 추가하지 말 것.`

export function getOriginalModel(apiKey?: string) {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  const ai = new GoogleGenerativeAI(key)
  return ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: ORIGINAL_SYSTEM_PROMPT,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })
}
