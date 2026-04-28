# 말씀의 길 (VERBUM) — PRD

> Korean Bible study webapp. Hanji aesthetic. Zero-infra RAG over 31,103 KRV verses on Vercel.

**Live**: https://malsseum-ui.vercel.app
**Repo**: https://github.com/tigerjk9/malsseum-ui (default branch: `main`)
**Status**: Phase 4 (RAG) + Phase 4.5 (design polish) shipped (2026-04-27); Phase 5 (UX polish) + Phase 6 (search quality + BYO key UI + hanji texture) + Phase 7 (RAG quality hardening + HelpPanel + mobile + philosophy) shipped (2026-04-28)

---

## 1. 제품 정의

### 한 문장
사용자가 영적 질문을 던지면, **31,103개 한글 성경 구절 전체에서 의미적으로 가장 가까운 후보를 RAG로 검색**하고, **Gemini가 그 후보 안에서만 인용**하며 소크라테스식으로 대화한다. 한지(韓紙) 미감 UI로 묵상 분위기를 유지한다.

### 페르소나
- **개역한글 본문에 익숙한 한국 신자** — 본문을 깊이 들여다보고 싶지만 검색·교차참조 도구가 어렵거나 무겁다.
- **신학 입문자** — 영어 자료가 많지만 한국어로, 구절 인용 + 해설 + 원어 의미를 한 화면에서 보고 싶다.

### 차별점 (vs 일반 성경 앱)
1. **대화형 + RAG** — 키워드 검색이 아닌 "용서가 어려워요" 같은 자연어 질문에 의미 검색.
2. **할루시네이션 차단** — Gemini가 임의 구절을 "떠올리는" 게 아니라 검색된 후보에서만 인용.
3. **한지 미감** — Noto Serif KR + 괘선 텍스처 + 황토 액센트. 묵상 친화적.
4. **0원 인프라** — Vercel Hobby + Gemini 무료 티어로 운영 비용 0.

---

## 2. 시스템 아키텍처

### 2.1 컴포넌트

```
┌─────────────────────────────────────────────────────────────┐
│  사용자 (브라우저, 데스크탑/모바일)                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────┴──────────────────────────────┐
│  Vercel CDN + Functions (Fluid Compute, Node 24)            │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Next.js App   │  │  API Routes    │  │ public/rag/  │  │
│  │  (App Router)  │  │  /api/chat     │  │  *.bin       │  │
│  │                │  │  /api/search   │  │  *.json.gz   │  │
│  │                │  │  /api/verse    │  │   (~24 MB)   │  │
│  │                │  │  /api/original │  │              │  │
│  │                │  │  /api/browse   │  │              │  │
│  └────────────────┘  └───────┬────────┘  └──────┬───────┘  │
│                              │                  │          │
│                              │   fetch          │          │
│                              ├──────────────────┤          │
│                              │   (cold start    │          │
│                              │    cached in     │          │
│                              │    module scope) │          │
└──────────────────────────────┼──────────────────┼──────────┘
                               │                  │
                               ▼                  │
                    ┌──────────────────┐          │
                    │   Gemini API     │          │
                    │  - chat (2.5 Flash)         │
                    │  - embed-001 (768d)         │
                    └──────────────────┘          │
                                                  │
                    ┌──────────────────┐          │
                    │  Bolls.life API  │◄─────────┘
                    │  - chapter fetch │
                    │  - verse fallback│
                    └──────────────────┘
```

### 2.2 RAG 파이프라인

**빌드 타임** (`npm run build:rag`, 1회 약 50분):
1. Bolls.life에서 1,189개 KRV 챕터 fetch → 31,103 구절
2. Gemini `gemini-embedding-001` (REST, `taskType=RETRIEVAL_DOCUMENT`, `outputDimensionality=768`)로 각 구절 임베딩 (concurrency=30, ~12 RPS)
3. L2 unit normalize → int8 양자화
4. `public/rag/verses-embed.bin` (22.78 MB) + `public/rag/verses-meta.json.gz` (1.42 MB) 작성
5. 결과를 git에 커밋 (Vercel CDN 자동 캐시)

**런타임**:
1. 사용자 쿼리 → Gemini embed (`RETRIEVAL_QUERY`, 768d)
2. Function 메모리에 인덱스 로드 (cold start 1회, 모듈 스코프 캐시)
3. Float32 query × Int8 vectors 코사인 (in-memory) — 31k × 768 dim ≈ 40ms
4. Top-K 구절 + 본문 + 점수 반환

### 2.3 데이터 형식

**`verses-embed.bin`** (binary, big-endian X, **little-endian uint32**):
```
[0..3]   magic: "MAL1" (ASCII)
[4..7]   count: uint32 LE (= 31103)
[8..11]  dim: uint32 LE (= 768)
[12..15] reserved: 0
[16..]   vectors: count × dim Int8 (unit-normalized × 127, clipped [-128,127])
```

**`verses-meta.json.gz`** (gzipped JSON):
```json
{
  "version": 1,
  "model": "gemini-embedding-001",
  "dim": 768,
  "count": 31103,
  "books": { "Genesis": "창세기", ... },
  "verses": [
    { "i": 0, "b": "Genesis", "c": 1, "v": 1, "t": "태초에 하나님이..." },
    ...
  ]
}
```

### 2.4 통합 지점

| 라우트 | 변경 (Phase 4) |
|--------|---------------|
| `/api/chat` | RAG 후보 top-10을 마지막 user 메시지에 system 블록으로 첨부. 시스템 프롬프트가 "후보 안에서만 인용" 강제. RAG 실패 시 bare LLM으로 fallback. |
| `/api/search?mode=keyword` | Gemini 채팅 호출 0회 → RAG 직접 반환 (top-5 + cosine score). |
| `/api/search?mode=theme` | 변경 없음 (로컬 12개 테마 카탈로그). |
| `/api/verse` | 변경 없음 (Bolls.life 단일 구절 조회). |
| `/api/original` | 변경 없음 (Gemini 헬라어/히브리어 원어 분석). |
| `/api/browse` | 변경 없음 (책/장/절 탐색). |

---

## 3. 출시 단계

| 태그 | 단계 | 핵심 |
|------|------|------|
| `v0.1.0-phase1` | 대화형 코어 | Gemini 채팅, 구절 카드, 5개 번역본 |
| `v0.2.0-phase2` | 탐독 패널 | SlidePanel, 번역 비교, 검색 |
| `v0.3.0-phase3` | 깊이 도구 | 원어 분석, 한자 토글, 다크모드, BottomNav, 12 테마 |
| (미태그) | Phase 4 | **RAG** (`gemini-embedding-001` + int8 quantized index + in-memory cosine) |
| (미태그) | Phase 4.5 | **디자인 폴리시** — Inter→IBM Plex Sans KR, 반경 토큰 위계, 9개 SVG 아이콘 (emoji 제거), 한지 노이즈 텍스처, 다크 모드 클레이 액센트 AA 충족, 40px 터치 타깃, `prefers-reduced-motion` 가드, transform-only 패널 슬라이드, 12 atomic 커밋 |
| (미태그) | Phase 6 | **검색 품질·UX 개선** — `/api/search` query expansion + score 게이팅(0.45), BYO Gemini API 키 UI (TopBar KeyIcon + localStorage), 한지 텍스처 가시성 복구 (ChatInterface 루트 bg 제거) |
| (미태그) | Phase 7 | **RAG 품질 하드닝 + UX** — chat RAG 임계값 0.35→0.55, 자유 모드 RAG 스킵, expandQuery 타임아웃 3s→1.5s, 멀티턴 단문 컨텍스트 합산, 서버 사이드 환각 ref 드랍. HelpPanel 신규(8섹션), ThemesPanel RAG 동적화, BottomNav 도움말 탭 추가, iOS h-dvh 수정. 앱 전체에 "하나님께 더 가까이" 철학 반영 (환영 메시지·도움말·시스템 프롬프트). |

---

## 4. 검증 결과 (2026-04-27)

### 4.1 의미 검색 품질 (live)

```
Q: 사랑
  0.716  SongOfSolomon 7:6  사랑아 네가 어찌 그리 아름다운지...
  0.715  1Corinthians 13:4  사랑은 오래 참고 사랑은 온유하며...    ← "사랑장"
  0.710  1John 4:19         우리가 사랑함은 그가 먼저 우리를...
  0.710  1John 4:7          사랑하는 자들아 우리가 서로 사랑하자...
  0.702  Hebrews 13:1       형제 사랑하기를 계속하고

Q: 용서
  0.744  Matthew 6:12       우리가 우리에게 죄 지은 자를 사하여...  ← 주기도문
  0.744  Matthew 6:14       너희가 사람의 과실을 용서하면...
  0.725  John 20:23, Luke 17:4, Ephesians 4:32

Q: 부활
  0.739  1Corinthians 6:14  하나님이 주를 다시 살리셨고...
  0.728  Philippians 3:11   어찌하든지 죽은 자 가운데서 부활에...
  0.726  John 11:25         예수께서 가라사대 나는 부활이요 생명이니
  0.723  1Peter 1:3, Acts 10:40

Q: 믿음
  0.745  Hebrews 11:1       믿음은 바라는 것들의 실상이요...     ← 믿음의 정의
  0.732  1Peter 1:9, Hebrews 11:3
  0.729  Romans 10:17       그러므로 믿음은 들음에서 나며...
```

### 4.2 성능

| 항목 | 측정값 |
|------|--------|
| 코사인 검색 (31,103 × 768) | ~40ms (in-memory, V8 JIT) |
| Gemini 쿼리 임베딩 (768d) | ~200-400ms (REST round-trip) |
| Cold start (인덱스 fetch + parse) | 추정 500-800ms (1회만, Fluid Compute amortize) |
| `/api/search` 총 (warm) | ~250-450ms |
| `/api/search` 총 (cold) | ~1s |

### 4.3 테스트

- 단위 테스트 6개 (cosine 정확성, 양자화 round-trip, top-K 정렬, dim 미스매치)
- 회귀: 108/108 통과 (기존 102 + 신규 6)
- ESLint: 0 위반
- TypeScript: 0 에러
- Next.js production build: 성공

---

## 5. 알려진 제약 / 트레이드오프

### 5.1 의도적
- **하이브리드 검색 미지원**: BM25/full-text fallback 없음. 인명/지명·동음이의어 등 lexical 매칭이 강한 쿼리에는 불리.
- **리랭커 없음**: cross-encoder (e.g. `bge-reranker-v2-m3`) 미사용. top-K=10 정도면 dense만으로도 충분 가설.
- **KRV 단일 번역**: 임베딩은 KRV만. NIV/ESV/KJV 검색은 미지원 (Gemini 채팅이 영어 인용 가능하지만 retrieval은 KRV).
- **단일 구절 임베딩**: 컨텍스트 윈도우(전후 구절 결합) 미사용. 단독 구절만으로 의미를 잡지 못하는 경우 있음 (예: "예수께서 대답하여 가라사대").

### 5.2 의도하지 않은 / 운영 리스크
- **인덱스 재빌드 비용**: 31k 임베딩에 약 50분 소요. 데이터 모델 변경(e.g. 768→1536 dim) 시 전량 재처리.
- **Cold start latency**: 24MB 정적 자산 fetch + parse가 추가됨. Vercel CDN edge cache로 완화되지만, 인스턴스 폐기 시마다 재로드.
- **메모리**: Function 인스턴스에 ~25MB 상주. 무료 티어 동시 인스턴스 수에 영향 없음.
- **Repo 크기**: `public/rag/verses-embed.bin` 24MB가 git에 들어감. clone 시간/스토리지 약간 부담. 향후 Vercel Blob 이전 검토 가능.

---

## 6. 로드맵 (Phase 5+)

### 6.0 Phase 7 완료 항목 (2026-04-28)
- ✅ **chat RAG 임계값 0.55** — 낮은 임계값(0.35) 환각 유발 → 0.55로 상향
- ✅ **자유 모드 RAG 스킵** — `mode !== 'free'` 조건 추가, 자유 모드 응답 지연 제거
- ✅ **expandQuery 타임아웃 단축** — 3000ms → 1500ms
- ✅ **멀티턴 단문 쿼리 보완** — 30자 미만 메시지 시 최근 3개 사용자 메시지 합산 RAG 쿼리
- ✅ **서버 사이드 환각 필터** — RAG 후보 Set 외 verse ref 드랍
- ✅ **HelpPanel 신규** — 8개 섹션(대화 방식·검색·테마·탐독·원어·번역 비교·대화 기록·BYO 키)
- ✅ **ThemesPanel 동적 RAG** — 정적 4구절 → `/api/search` 동적 검색 + 정적 fallback
- ✅ **BottomNav 도움말 탭** + IconSidebar 도움말 아이콘
- ✅ **iOS h-dvh 수정** — `h-screen` → `h-dvh` (iOS Safari 채팅창 BottomNav 가림 해결)
- ✅ **철학 반영** — 환영 메시지, 도움말 패널, AI 시스템 프롬프트에 "하나님께 더 가까이 나아가도록 돕는 작은 도구" 삽입

### 6.1 즉시 가치 / 낮은 노력 (2026-04-28 완료)
- ✅ **검색 점수 확신도 게이팅**: `/api/search`에 `SCORE_THRESHOLD=0.45` 적용. 미달 시 `{ results: [], message: '관련 구절을 찾지 못했습니다.' }` 반환.
- ✅ **Query expansion**: `/api/search`에 `expandQuery()` 추가 — chat과 동일한 신학적 키워드 확장 파이프라인 적용.
- ✅ **BYO API 키 UI**: TopBar KeyIcon 버튼 → 팝오버 입력 → `localStorage('malsseum_gemini_key')` → `/api/chat`, `/api/search`, `/api/original` 헤더 주입.
- ✅ **한지 노이즈 가시성 복구**: `ChatInterface` 루트 div `bg-[var(--hanji-warm)]` 제거 → `body::before` 텍스처 메시지 스크롤 영역에 투과.
- **Per-verse context window**: 임베딩 시 전후 1-2 구절을 합쳐 인덱싱 (인덱스 크기 동일, 의미 더 풍부). — 미완료, 인덱스 재빌드 필요.

### 6.2 중간 노력 / 중간 가치
- **하이브리드 (BM25 + dense)**: KRV 본문에 대해 inverted index (Lunr/MiniSearch 류) + RRF 융합.
- **Cross-encoder reranking**: top-30 dense 후보를 Gemini로 한 번에 re-scoring (단일 LLM 호출). bible-rag의 `bge-reranker-v2-m3` 흉내.
- **다국어 임베딩**: KRV + NIV + ESV 각각 인덱싱, 사용자 번역본 선택에 따라 라우팅.
- **사용자 BYO Gemini 키 UI**: 헤더 `x-gemini-api-key`는 이미 받지만, 설정 패널에서 입력하는 UI 미완성.
- **CHANGELOG.md + VERSION 정식 도입**: 현재 git 태그만 있음.

### 6.3 큰 노력 / 큰 가치
- **bible-rag 백엔드 통합 옵션**: bible-rag 백엔드(FastAPI + pgvector + 리랭커 + Strong's 442k 단어)가 다시 가동되면, malsseum-ui가 그쪽으로 라우팅하는 모드 추가. UI는 한지 미감 그대로 유지하면서 retrieval 품질 한 단계 상승.
- **Strong's Concordance 통합**: `/api/original` 결과에 Strong's 번호 + Blue Letter Bible 링크 추가.
- **Cross-references 정적 번들**: OpenBible.info 63,779개 연결을 정적 JSON으로 번들링 → 실시간 fetch 없이 "관련 구절" 표시.
- **사용자 노트/하이라이트**: 로컬 IndexedDB 저장. 인증 불필요.
- **PWA + 오프라인 모드**: 인덱스 + 자주 본 구절을 IndexedDB에 캐시.

---

## 7. 운영 노트

### 7.1 배포
- GitHub `main` push → Vercel 자동 배포 (production branch: `main`)
- Vercel 환경변수: `GEMINI_API_KEY` (production/preview/development)
- Vercel Project Production URL: `malsseum-ui.vercel.app`
- 정적 자산은 동일 origin에서 fetch (Deployment Protection 우회 위해 `VERCEL_PROJECT_PRODUCTION_URL` 사용)

### 7.2 인덱스 갱신 절차
```bash
# 1. 빌드 (약 50분)
npm run build:rag

# 2. 결과 확인
ls -lh public/rag/

# 3. 로컬 sanity test
node scripts/smoke-rag.mjs

# 4. 커밋 + 푸시 → Vercel 자동 배포
git add public/rag/
git commit -m "chore(rag): refresh embedding index"
git push origin main
```

### 7.3 모니터링
- 현재: 수동 (라이브 URL 직접 호출). 자동 모니터링 미설정.
- 권장: Vercel Functions 로그 + 정기 cron으로 `/api/search?q=사랑` 응답 시간/정확성 체크.

---

## 8. 참고 / 관련 프로젝트

- **bible-rag** (`tigerjk9/bible-rag`, calebyhan 포크): full RAG (FastAPI + pgvector + Redis + multilingual-e5-large + bge-reranker + Strong's 442k 단어). 현재 백엔드 다운 (Koyeb 404). malsseum-ui와 별도 프로젝트로 spec 명시. 향후 통합 옵션은 §6.3.
- **Bolls.life** — 성경 본문 무료 API (https://bolls.life). KRV/RNKSV/NIV/ESV 지원.
- **Gemini API** — 채팅(`gemini-2.5-flash`) + 임베딩(`gemini-embedding-001`).
