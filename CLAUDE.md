# CLAUDE.md

Repository: `malsseum-ui` (말씀의 길 / VERBUM)
Live: https://malsseum-ui.vercel.app

> **Read first**: `docs/PRD.md` for product definition + architecture + roadmap.

---

## 한 줄 요약

Korean Bible study webapp on Next.js 16 (App Router) + React 19 + Tailwind 4, deployed on Vercel. Core feature: **zero-infra RAG over 31,103 KRV verses** via Gemini embeddings + int8-quantized in-memory cosine.

## Stack

- **Framework**: Next.js 16 App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + CSS variables (한지 design tokens)
- **Fonts**: IBM Plex Sans KR (UI) + Noto Serif KR (verse), both `next/font/google`
- **AI**: `@google/generative-ai` (Gemini 2.5 Flash for chat) + REST direct (`gemini-embedding-001` for RAG)
- **Bible data**: Bolls.life + GetBible v2 (no DB)
- **Tests**: Vitest + Testing Library + jsdom (108 tests, must stay green)
- **Deploy**: Vercel (Hobby), `main` branch auto-deploys

**Intentionally absent**: PostgreSQL, pgvector, Redis, external embedding services, rerankers. RAG runs entirely on Vercel Functions over a static `public/rag/` index.

## Architectural conventions

- **Routes** are Next.js App Router under `src/app/`. API routes are `src/app/api/<name>/route.ts`, all `runtime = 'nodejs'`.
- **Library code** lives in `src/lib/` (no React). Data tables in `src/lib/data/`. Tests next to code in `__tests__/`.
- **Components** in `src/components/`, panel components in `src/components/panels/`.
- **Icons** are inline monoline SVGs in `src/components/icons.tsx` — no emoji as chrome (data-level emoji in `themes.ts` is OK).
- **No DB.** All retrieval is `public/rag/` static assets fetched at runtime (cached in module scope per Function instance).
- **BYO API key** pattern: every Gemini-using API route reads `x-gemini-api-key` header first, falls back to `process.env.GEMINI_API_KEY`. UI: 최초방문 → `AccessGate` 오버레이 → 관리자(비밀번호 입력 → HMAC 토큰 발급)/일반(개인 Gemini API 키 입력) 선택 → `localStorage('malsseum_admin_token')` or `localStorage('malsseum_gemini_key')` + `localStorage('malsseum_access_mode')` 저장 → `ChatInterface`가 모든 Gemini fetch에 `x-admin-token` or `x-gemini-api-key` 헤더 주입. TopBar LockIcon 버튼으로 재진입 가능.
- **Admin auth**: `POST /api/auth` verifies `ADMIN_PASSWORD` env var, returns HMAC-SHA256 signed token (`src/lib/auth.ts`). Signing key = `AUTH_SECRET:ADMIN_PASSWORD` — changing `ADMIN_PASSWORD` alone invalidates all existing tokens. Token TTL is 100 years (effectively permanent). All API routes verify via `verifyAdminToken()`; 401 on failure causes gate re-display client-side.

## Design tokens

Defined in `src/app/globals.css`. Light mode in `:root`, dark mode in `.dark`.

- **Colors (semantic)**: `--hanji-cream` (TopBar / sidebar surface), `--hanji-warm` (body), `--paper-white` (cards), `--ink-dark` (primary text), `--ink-medium` (secondary text), `--clay` (accent / verse-label / focus ring), `--clay-light` (filled chip / hover bg), `--clay-border`, `--suggestion-bg`.
- **Dark mode**: every accent (`--clay`, `--clay-light`, `--clay-border`, `--suggestion-bg`) is overridden — naive surface flip is not enough. The light-mode brown clay (`#8b6343`) drops to ~2.3:1 on dark bg; dark mode uses a brighter clay (`#d6a87d`, ~6.7:1 AA).
- **Radius scale**: `--radius-paper` (8px, surfaces), `--radius-control` (10px, inputs/buttons), `--radius-pill` (9999px, chips). Apply via `rounded-[var(--radius-*)]` (Tailwind arbitrary value, not the named utility — v4 utility generation for token names is unreliable here).
- **Background**: `body::before` carries an SVG `feTurbulence` hanji fiber overlay (multiply blend in light, screen in dark). `ChatInterface` 루트 div는 배경 없음(투명) → body background + body::before 텍스처가 메시지 스크롤 영역에 자연히 노출. TopBar/IconSidebar/ChatInput은 각자 `bg-[var(--hanji-cream)]` 보유로 텍스처 없이 유지.
- **Motion**: only `transform` and `opacity` are animated. `transition-[margin]` is banned. Panel slide uses `panel-enter` class: on desktop `translateX(100%→0)`, on mobile `translateY(100%→0)` — `globals.css` splits the animation via `@media (max-width: 767px)`. `prefers-reduced-motion` collapses all animation/transition durations to ~0ms globally.
- **Focus**: global `*:focus-visible { outline: 2px solid var(--clay); outline-offset: 2px }`. Don't add `focus:outline-none` on form controls — it overrides the global ring. ChatInput textarea is the one exception (parent uses `focus-within:border-[var(--clay)]` instead).

## Key files

| Path | Purpose |
|------|---------|
| `src/lib/rag.ts` | RAG library: load index, embed query, top-K cosine. Used by `/api/chat` and `/api/search`. |
| `src/lib/gemini.ts` | Chat system prompts (note: prompt #8 is the RAG citation guard). |
| `src/lib/bible-api.ts` | Bolls.life + GetBible HTTP clients. |
| `src/lib/verse-parser.ts` | `[[VERSE:Book:Ch:Vs:Trans]]` tag extraction. |
| `src/lib/data/chapter-counts.ts` | 66 books × chapter counts. |
| `src/lib/data/themes.ts` | 12 curated themes (search `mode=theme`). |
| `src/lib/data/hanja-glossary.ts` | 30 theological terms with hanja. |
| `src/app/globals.css` | Design tokens (light + dark), hanji noise overlay, motion guards. Single source of truth for color/radius/animation tokens. |
| `src/components/icons.tsx` | 12 inline monoline SVG icons (LockIcon, UserIcon 포함). Add new icons here, not as emoji. |
| `src/lib/auth.ts` | HMAC-SHA256 토큰 서명/검증. `signAdminToken()` · `verifyAdminToken()`. 서명 키 = `AUTH_SECRET:ADMIN_PASSWORD`. |
| `src/app/api/auth/route.ts` | `POST /api/auth` — 비밀번호 검증 → 토큰 반환. Vercel 환경변수 `ADMIN_PASSWORD` · `AUTH_SECRET` 필요. |
| `src/components/AccessGate.tsx` | 최초방문 접근 게이트 — 관리자(비밀번호 → 토큰)/일반(Gemini API 키) 선택, hero 이미지 포함. |
| `src/components/SlidePanel.tsx` | 오른쪽 슬라이드 패널. 데스크톱: 드래그 리사이즈(240~600px), 모바일: 75vh 바텀 시트 + 스와이프 다운 닫기. |
| `src/components/panels/HelpPanel.tsx` | 8개 섹션 기능 안내 패널. 정적 컨텐츠, props 없음. |
| `scripts/build-rag-index.mjs` | One-time RAG index builder (`npm run build:rag`). |
| `scripts/smoke-rag.mjs` | Local RAG quality smoke test. |
| `public/og-image.png` | OG/SNS 공유 이미지 (2848×1504, 세피아 성경/앱 마케팅). AccessGate hero + layout.tsx openGraph 사용. |
| `public/rag/verses-embed.bin` | int8 embedding index (22.78 MB, committed to git). |
| `public/rag/verses-meta.json.gz` | gzipped verse metadata (1.42 MB). |

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build (catches type/build regressions)
npm run lint         # eslint
npm test             # vitest run
npm run build:rag    # rebuild RAG index (~50min, needs GEMINI_API_KEY)
```

## Things that look weird but are intentional

- **`VERCEL_PROJECT_PRODUCTION_URL` over `VERCEL_URL`** in `src/lib/rag.ts:getBaseUrl()`. Reason: Vercel Deployment Protection (default-on for Hobby preview/deployment URLs) returns 401 to internal asset fetches via `VERCEL_URL`. The production alias is unprotected.
- **REST API for embeddings, SDK for chat**. The SDK `@google/generative-ai@^0.24` does not expose `outputDimensionality` for `embedContent`, and `batchEmbedContents` is not supported by the current `gemini-embedding-001` model. We call REST directly for embeddings.
- **24 MB binary in git**. `public/rag/verses-embed.bin` is committed. This bloats clone but keeps deploy a single push and avoids Vercel Blob/Storage setup. Re-evaluate if size > 50 MB.
- **`runtime = 'nodejs'` on all API routes**. We need `node:zlib` for gunzip and `Buffer` for binary parsing. Edge runtime can't load the 24MB index efficiently anyway.
- **`temperature: 0.2-0.7` varies per route**. 0.2 for original-word JSON (deterministic), 0.3 for search (low-creativity), 0.7 for chat (warmer).
- **`isCheckingAccess` initial state is `true`** in `ChatInterface`. Before the mount-time `useEffect` reads localStorage, the component returns a blank `<div className="flex flex-col h-dvh" />`. This prevents a one-frame flash of the chat UI when a first-time visitor hard-refreshes (gateOpen starts false, useEffect sets it true — but there's a render in between).
- **`modeHint` injected into the last user message** in `chat/route.ts`, not just in the system prompt. Gemini prioritises in-context patterns over system instructions when recent history demonstrates a different style. The hint (`[응답 형식 지침: ...]`) appears right before the model generates, overriding history drift every turn.
- **TopBar has both `PlusIcon` and `TrashIcon`, and they do different things.** Plus = "새 대화" (`handleNewChat`) archives the current session to `malsseum_history` then resets to welcome. Trash = "현재 대화 내역 초기화" (`handleClearChat`) shows a `confirm()` and discards the current session *without* archiving (`localStorage.removeItem(CURRENT_KEY)` only). Trash is disabled when there is no user message. Don't collapse them — the auto-archive on reload + Plus already covers "save and continue", Trash exists specifically for "drop without keeping".
- **Panel width via CSS custom property, not inline `style={{ width }}`**. `position: fixed; left: 0; right: 0;` with an explicit `width` on the same element causes the left/right constraints to win on mobile (full-width), breaking the 280px desktop value. Instead, `--panel-w` is set via inline style and `.panel-desktop-w` applies `width: var(--panel-w)` only at `min-width: 768px`. Similarly `.md-panel-shift` drives the main content `margin-right` via `--panel-width`.

## Don'ts

- **Don't use `text-embedding-004`**. It's not exposed on `v1beta` for current API keys. Use `gemini-embedding-001` with `outputDimensionality: 768`.
- **Don't use `batchEmbedContents`**. Not supported by current embedding models. Use parallel `embedContent` calls (we use waves of 30 with 1.5s delay = ~1200 RPM, under the 1500 RPM limit).
- **Don't fetch internal assets via `VERCEL_URL`** in server-side code. Use `VERCEL_PROJECT_PRODUCTION_URL`.
- **Don't add Redis/pgvector/external embedding services** without an explicit reason. The "0원 인프라" constraint is a feature, not a limitation. See PRD §1 차별점.
- **Don't introduce user accounts or per-user state**. Admin auth exists for server-key access only. BYO API key is the only personalization vector for general users. No signup, no sessions, no DB.
- **Don't change `AUTH_SECRET` to invalidate tokens**. Changing `ADMIN_PASSWORD` alone is sufficient — `AUTH_SECRET` is combined in the signing key, so a password change auto-invalidates all tokens. Changing `AUTH_SECRET` is only needed if the secret itself is compromised.
- **Don't revert 401 handling to SSE**. `/api/chat` returns `Response.json({ error: 'unauthorized' }, { status: 401 })` (not a stream) so `ChatInterface` can detect mid-session auth failure and show the gate cleanly.
- **Don't add `focus:outline-none` on new form controls**. It silently kills keyboard focus rings (it overrides the global `*:focus-visible`). Either omit it, or pair with an explicit `focus-within` indicator on a parent.
- **Don't animate layout properties** (`margin`, `width`, `height`, `top`, `left`, `padding`, `grid-template-*`). Use `transform` / `opacity`. The hanji aesthetic doesn't ask for elaborate motion anyway.
- **Don't reach for emoji** for new chrome icons. Add an SVG to `icons.tsx`. Color emoji clash with the muted palette.
- **Don't add a new accent color without dark-mode override**. A brown/clay tone that reads on light cream often falls below AA on dark surfaces. Verify `--clay` pattern: brighten the accent in `.dark`, don't just flip surfaces.
- **Don't duplicate the typewriter effect**. `MessageBubble` already implements one via `displayedLen` state + `cleanRef` + `setInterval`. Adding another layer will double-stutter. See `src/components/MessageBubble.tsx`.
- **Don't write to `malsseum_current` directly**. Active session persistence is managed by a `useEffect` in `ChatInterface` (saves on message/mode change, skips during `isLoading`). `malsseum_history` stores completed conversations (max 10). Both keys must stay in sync — see `CURRENT_KEY` / `HISTORY_KEY` constants. The mount `useEffect` auto-archives any persisted current session into history and removes `CURRENT_KEY` so each reload starts at the welcome screen — don't restore the active session into state on mount.
- **Don't add solid background to ChatInterface root**. The root `div` in `ChatInterface.tsx` is intentionally background-less (transparent) so `body::before` hanji texture shows through the message scroll area. If you need a surface color, apply it to a specific child element (TopBar, sidebar, input bar) not the root.
- **Don't call `/api/search` without score filtering**. `SCORE_THRESHOLD = 0.45` in `search/route.ts` gates results. Below this threshold, return `{ results: [], message: '...' }`. Don't lower it without testing against the §4.1 benchmark queries.
- **Don't lower `RAG_SCORE_THRESHOLD` below 0.55 in `/api/chat`**. Chat threshold (0.55) is higher than search (0.45) because low-quality RAG candidates injected into the LLM context cause hallucinated verse citations. Free mode skips RAG entirely — don't add it back.
- **Don't run RAG in free mode**. `mode !== 'free'` guard in `chat/route.ts` is intentional. Free mode is LLM-context-first conversation; RAG only adds latency and can push the model toward citations the user didn't ask for.
- **Don't remove the `modeHint` injection** in `chat/route.ts`. Without it, switching from free → inductive mid-conversation causes the model to continue the free-mode style (in-context pattern beats system prompt). The hint must come after the RAG block as the last text before the model generates.
- **Don't set `isCheckingAccess` initial value to `false`** in `ChatInterface`. It must be `true` so the blank placeholder renders during the synchronous localStorage read, preventing the one-frame chat UI flash on hard refresh.

## Related projects (separate repos)

- **`tigerjk9/bible-rag`** (forked from `calebyhan/bible-rag`): full RAG with FastAPI + pgvector + Redis + bge-reranker + Strong's 442k words. Has its own frontend at `bible-rag-two.vercel.app`. Backend currently down (Koyeb). malsseum-ui is a **separate** project with hanji aesthetic — see `bible-rag/docs/superpowers/specs/2026-04-27-malsseum-ui-design.md`. Future integration option in PRD §6.3.

## Deployment

- Production branch: `main`
- Auto-deploys on every push
- Required env vars: `GEMINI_API_KEY` + `ADMIN_PASSWORD` + `AUTH_SECRET` (set on Vercel for Production + Preview + Development)
- Static assets (`public/rag/`) served by Vercel CDN, cached at edge.

To roll out an index update:
```bash
npm run build:rag                          # ~50 min
ls -lh public/rag/                         # verify ~22 MB embed + ~1.5 MB meta
node scripts/smoke-rag.mjs                 # verify retrieval quality locally
git add public/rag/ && git commit -m "..." && git push origin main
```
