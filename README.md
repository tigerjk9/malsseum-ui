# 말씀의 길 (VERBUM)

> 한지(韓紙) 미감의 한국어 성경 대화형 웹앱. Gemini 2.5 Flash + Bolls.life Bible API.

**🌐 Live**: <https://malsseum-ui.vercel.app>

성경에 깊이 정통한 따뜻한 영적 동반자 "말씀 길잡이"와 소크라테스식 대화로 진리에 다가갑니다. 채팅 응답에 인용된 구절은 자동으로 카드 형태로 변환되고, 다음 묵상 방향이 제안 칩으로 제시되며, 헬라어/히브리어 원어 분석과 한자 병기로 본문을 깊이 들여다봅니다.

---

## 기능

### Phase 1 — 대화형 코어
- **Gemini 기반 대화** — `gemini-2.5-flash`, SSE 스트리밍, 소크라테스식 시스템 프롬프트
- **인라인 구절 카드** — `[[VERSE:책:장:절:번역]]` 태그를 자동 파싱해 Bolls.life에서 본문 조회
- **다국어 번역본** — KRV · RNKSV · NIV · ESV · KJV
- **제안 칩** — 응답 끝의 `SUGGESTIONS:` 라인을 다음 단계 버튼으로 표시
- **한지 디자인 시스템** — Noto Serif KR + 미세 괘선 텍스처 + 황토 액센트 (`#8b6343`)

### Phase 2 — 탐독 패널
- **SlidePanel 프레임워크** — 우측에서 슬라이드되는 컨텍스트 패널
- **번역 비교** — 5개 번역본 동시 표시
- **검색·탐독** — Gemini 키워드 모드 ↔ 로컬 12개 테마 카탈로그 모드 토글

### Phase 3 — 깊이 도구
- **원어 분석** — 구절을 선택하면 Gemini가 헬라어/히브리어 핵심 단어 3~5개를 BDAG/HALOT 사전 기준으로 분석 (음역·의미·본문 뉘앙스 포함)
- **교차 참조** — 관련 구절 자동 연결
- **한자 토글** — 30개 핵심 신학 용어에 한자 ruby 주석 (예: 은혜<small>(恩惠)</small>, 속죄<small>(贖罪)</small>)
- **다크모드** — 시스템 + 토글, FOUC 방지
- **모바일 BottomNav** — 반응형 하단 네비게이션
- **테마 카탈로그** — 12개 핵심 테마 × 큐레이션 구절 모음
- **검색 모드 토글** — 키워드(Gemini) / 테마(로컬)

---

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. Gemini API 키 설정
[Google AI Studio](https://aistudio.google.com/apikey)에서 무료 키를 발급받고:
```bash
cp .env.example .env.local
# .env.local 에 GEMINI_API_KEY 입력
```

### 3. 개발 서버
```bash
npm run dev      # http://localhost:3000
```

### 4. 검증
```bash
npm run lint
npm test         # vitest 단발 실행
npm run build    # 프로덕션 빌드 확인
```

---

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

### 아키텍처 노트: 0원 RAG (Phase 4)

이 앱은 **31,103개 KRV 구절 전체에 대한 의미 기반 RAG**를 PostgreSQL/pgvector/Redis 없이 Vercel Functions만으로 구현합니다.

**파이프라인**:

```
[빌드 타임 / 1회]
  Bolls.life KRV 31,103 구절 → Gemini gemini-embedding-001 (768d)
       ↓
  L2 unit normalize → int8 양자화
       ↓
  public/rag/verses-embed.bin   (~22 MB, 헤더 + Int8Array)
  public/rag/verses-meta.json.gz (~5-8 MB gzip, 책 매핑 + 구절 메타)

[런타임 / 매 요청]
  사용자 쿼리 → Gemini embed (RETRIEVAL_QUERY, 768d)
       ↓
  Vercel Function 메모리에 인덱스 로드 (cold start 1회, 모듈 스코프 캐시)
       ↓
  Float32 query × Int8 vectors 코사인 (in-memory)
       ↓
  Top-K 구절 + 본문 + 점수
       ↓
  /api/chat: Gemini 채팅에 후보로 주입 → Gemini가 후보 안에서만 인용
  /api/search?mode=keyword: 후보 그대로 반환 (Gemini 채팅 호출 0회)
```

**역할 분담**:
- **어떤 구절이 의미상 가까운가** = `gemini-embedding-001` 임베딩 + 인메모리 코사인
- **답변 생성** = Gemini 2.5 Flash가 검색된 후보에서만 인용 (할루시네이션 차단)
- **본문 텍스트 fallback** = Bolls.life (구절 카드 표시용)

**트레이드오프**:
- ✅ **인프라 0원** — DB·외부 임베딩 서비스·벡터 인덱스·리랭커·Redis 전부 미사용. Vercel Hobby 무료 티어 안에서 완결.
- ✅ **의미 검색 정확도 확보** — Gemini 학습 지식에만 의존하지 않고, 31k 구절 전체에서 코사인 검색으로 후보 결정.
- ✅ **할루시네이션 차단** — Gemini가 임의 구절을 "떠올리는" 게 아니라 검색된 후보 안에서만 인용.
- ⚠️ 단순 dense 검색만 — 하이브리드(BM25), cross-encoder 리랭커 없음. Phase 5 후보.

**인덱스 빌드**: `npm run build:rag` (1회, 약 30-40분, `GEMINI_API_KEY` 필요)

---

## API 라우트

| 라우트 | 메서드 | 용도 |
|--------|--------|------|
| `/api/chat` | POST | Gemini 대화 SSE 스트리밍 |
| `/api/verse?ref=John:3:16` | GET | 단일 구절 조회 |
| `/api/search?q=...&mode=keyword\|theme` | GET | 검색 (Gemini 키워드 / 로컬 테마) |
| `/api/original?ref=John:3:16` | GET | 헬라어/히브리어 원어 분석 |
| `/api/browse` | GET | 책/장/절 탐색 |

모든 Gemini 의존 라우트는 `x-gemini-api-key` 헤더로 BYO 키도 받습니다 (서버 환경변수 우선순위 fallback).

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx           # 폰트 로드, 다크모드 스크립트
│   ├── page.tsx             # ChatInterface 마운트
│   ├── globals.css          # 디자인 토큰 + 괘선 + 다크모드
│   └── api/
│       ├── chat/            # Gemini SSE
│       ├── verse/           # 단일 구절
│       ├── search/          # 키워드/테마 검색
│       ├── original/        # 헬라어/히브리어 분석
│       └── browse/          # 탐독
├── components/
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   ├── VerseCard.tsx
│   ├── SuggestionChips.tsx
│   ├── SlidePanel.tsx       # Phase 2 패널 프레임
│   ├── OriginalPanel.tsx    # Phase 3 원어 분석
│   ├── HanjaToggle.tsx      # Phase 3 한자 ruby
│   ├── BottomNav.tsx        # Phase 3 모바일
│   └── ...
└── lib/
    ├── gemini.ts            # 시스템 프롬프트 3종 + 모델 팩토리
    ├── bible-api.ts         # Bolls.life + GetBible 클라이언트
    ├── verse-parser.ts      # [[VERSE:...]] 파서
    ├── hanja.ts             # 30개 신학 용어 한자 매핑
    ├── themes.ts            # 12개 테마 카탈로그
    └── constants.ts
```

---

## 배포

### Vercel (현재 운영)
1. https://vercel.com/new 에서 GitHub repo import
2. **Environment Variables** → `GEMINI_API_KEY` 추가 (Production · Preview · Development 모두)
3. Deploy → 자동으로 `master` 브랜치 push 감지하여 빌드

### 로컬 → Vercel CLI (선택)
```bash
npm i -g vercel
vercel login
vercel --prod
```

> ⚠️ Windows 호스트명이 비-ASCII(한글 등)면 Vercel CLI v52 로그인이 실패합니다. 웹 대시보드 사용 권장.

---

## 릴리즈

| 태그 | 단계 | 핵심 |
|------|------|------|
| `v0.1.0-phase1` | 대화형 코어 | Gemini 채팅, 구절 카드, 5개 번역본 |
| `v0.2.0-phase2` | 탐독 패널 | SlidePanel, 번역 비교, 검색 |
| `v0.3.0-phase3` | 깊이 도구 | 원어 분석, 한자 토글, 다크모드, BottomNav, 12 테마 |

---

## 라이선스

MIT
