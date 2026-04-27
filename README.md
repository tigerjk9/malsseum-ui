# 말씀의 길 (VERBUM)

> 한지(韓紙) 미감의 한국어 성경 대화형 웹앱. Gemini 2.5 Flash + Bolls.life Bible API.

성경에 깊이 정통한 따뜻한 영적 동반자 "말씀 길잡이"와 소크라테스식 대화로 진리에 다가갑니다. 채팅 응답에 인용된 구절은 자동으로 카드 형태로 변환되며, 다음 묵상 방향이 제안 칩으로 제시됩니다.

## 핵심 기능 (Phase 1)

- **Gemini 기반 대화** — `gemini-2.5-flash`, SSE 스트리밍, 시스템 프롬프트로 소크라테스식 응답 유도
- **인라인 구절 카드** — 응답의 `[[VERSE:책:장:절:번역]]` 태그를 자동 파싱해 Bolls.life에서 본문 조회
- **다국어 번역본** — KRV(개역한글) · RNKSV(새번역) · NIV · ESV · KJV
- **제안 칩** — 응답 끝의 `SUGGESTIONS:` 라인을 다음 단계 버튼으로 표시
- **한지 디자인 시스템** — Noto Serif KR 본문 + 미세 괘선 텍스처 + 황토 액센트 (`#8b6343`)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Gemini API 키 설정

[Google AI Studio](https://aistudio.google.com/apikey)에서 무료 API 키를 발급받은 후, `.env.local` 생성:

```bash
cp .env.example .env.local
# .env.local 열고 GEMINI_API_KEY 입력
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 접속.

### 4. 테스트

```bash
npm test            # vitest 단발 실행
npm run test:watch  # 변경 감지 모드
```

## 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript 5.7 |
| 스타일 | Tailwind CSS 4 + CSS 변수 |
| AI | `@google/generative-ai` (Gemini 2.5 Flash) |
| 성경 데이터 | [Bolls.life](https://bolls.life) + [GetBible v2](https://getbible.net) |
| 폰트 | Noto Serif KR (본문) + Inter (UI) |
| 테스트 | Vitest + Testing Library + jsdom |
| 배포 | Vercel |

**의존성 미사용**: PostgreSQL, pgvector, Redis, 임베딩 모델, 리랭커 — 모두 Gemini가 대체.

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 폰트 로드, html 베이스
│   ├── page.tsx            # ChatInterface 마운트
│   ├── globals.css         # 한지 디자인 토큰 + 괘선
│   └── api/
│       ├── chat/route.ts   # POST: Gemini SSE
│       └── verse/route.ts  # GET: Bolls.life 프록시
├── components/
│   ├── ChatInterface.tsx   # 상태·스트리밍·스크롤 조율
│   ├── MessageBubble.tsx   # 사용자/AI 버블
│   ├── VerseCard.tsx       # 구절 본문 + 액션 버튼
│   ├── SuggestionChips.tsx # 제안 칩 그룹
│   ├── ChatInput.tsx       # 자동 리사이즈 textarea
│   ├── IconSidebar.tsx     # 데스크탑 좌측 아이콘
│   └── TopBar.tsx          # 앱 이름 + 번역본 선택
└── lib/
    ├── types.ts            # 공유 타입
    ├── constants.ts        # 책 ID 맵, 번역본 코드
    ├── verse-parser.ts     # [[VERSE:...]] 파서
    ├── bible-api.ts        # Bolls.life + GetBible 클라이언트
    └── gemini.ts           # 시스템 프롬프트 + 메시지 변환
```

## 사용자 BYO API 키

설정 패널을 통한 BYO 키 입력은 **Phase 2** 예정. 현재는 서버사이드 환경변수만 사용합니다. API 라우트는 이미 `x-gemini-api-key` 헤더를 우선 처리하므로 Phase 2에서 UI만 붙이면 됩니다.

## Vercel 배포

```bash
npm install -g vercel
vercel login
vercel               # 첫 배포 (프로젝트 생성)
```

Vercel 대시보드 → Project Settings → Environment Variables → `GEMINI_API_KEY` 추가 후:

```bash
vercel --prod
```

## 로드맵

- **Phase 2** — SlidePanel 프레임워크, 번역 비교 패널, 검색·탐독 패널
- **Phase 3** — 원어 분석, 교차 참조, 한자 토글, 다크모드, 반응형 BottomNav

## 라이선스

MIT
