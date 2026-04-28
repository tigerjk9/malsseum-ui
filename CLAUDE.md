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
- **BYO API key** pattern: every Gemini-using API route reads `x-gemini-api-key` header first, falls back to `process.env.GEMINI_API_KEY`. UI: TopBar의 KeyIcon 버튼 → 팝오버에서 입력 → `localStorage('malsseum_gemini_key')` 저장 → `ChatInterface`가 모든 Gemini fetch에 헤더 주입.

## Design tokens

Defined in `src/app/globals.css`. Light mode in `:root`, dark mode in `.dark`.

- **Colors (semantic)**: `--hanji-cream` (TopBar / sidebar surface), `--hanji-warm` (body), `--paper-white` (cards), `--ink-dark` (primary text), `--ink-medium` (secondary text), `--clay` (accent / verse-label / focus ring), `--clay-light` (filled chip / hover bg), `--clay-border`, `--suggestion-bg`.
- **Dark mode**: every accent (`--clay`, `--clay-light`, `--clay-border`, `--suggestion-bg`) is overridden — naive surface flip is not enough. The light-mode brown clay (`#8b6343`) drops to ~2.3:1 on dark bg; dark mode uses a brighter clay (`#d6a87d`, ~6.7:1 AA).
- **Radius scale**: `--radius-paper` (8px, surfaces), `--radius-control` (10px, inputs/buttons), `--radius-pill` (9999px, chips). Apply via `rounded-[var(--radius-*)]` (Tailwind arbitrary value, not the named utility — v4 utility generation for token names is unreliable here).
- **Background**: `body::before` carries an SVG `feTurbulence` hanji fiber overlay (multiply blend in light, screen in dark). `ChatInterface` 루트 div는 배경 없음(투명) → body background + body::before 텍스처가 메시지 스크롤 영역에 자연히 노출. TopBar/IconSidebar/ChatInput은 각자 `bg-[var(--hanji-cream)]` 보유로 텍스처 없이 유지.
- **Motion**: only `transform` and `opacity` are animated. `transition-[margin]` is banned. Panel slide uses `panel-enter` keyframes (`translateX 100%→0`, 220ms). `prefers-reduced-motion` collapses all animation/transition durations to ~0ms globally.
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
| `src/components/icons.tsx` | 12 inline monoline SVG icons (KeyIcon, QuestionIcon 추가). Add new icons here, not as emoji. |
| `src/components/panels/HelpPanel.tsx` | 8개 섹션 기능 안내 패널. 정적 컨텐츠, props 없음. |
| `scripts/build-rag-index.mjs` | One-time RAG index builder (`npm run build:rag`). |
| `scripts/smoke-rag.mjs` | Local RAG quality smoke test. |
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

## Don'ts

- **Don't use `text-embedding-004`**. It's not exposed on `v1beta` for current API keys. Use `gemini-embedding-001` with `outputDimensionality: 768`.
- **Don't use `batchEmbedContents`**. Not supported by current embedding models. Use parallel `embedContent` calls (we use waves of 30 with 1.5s delay = ~1200 RPM, under the 1500 RPM limit).
- **Don't fetch internal assets via `VERCEL_URL`** in server-side code. Use `VERCEL_PROJECT_PRODUCTION_URL`.
- **Don't add Redis/pgvector/external embedding services** without an explicit reason. The "0원 인프라" constraint is a feature, not a limitation. See PRD §1 차별점.
- **Don't introduce auth or user accounts**. Project is intentionally session-less. BYO API key is the only personalization vector.
- **Don't add `focus:outline-none` on new form controls**. It silently kills keyboard focus rings (it overrides the global `*:focus-visible`). Either omit it, or pair with an explicit `focus-within` indicator on a parent.
- **Don't animate layout properties** (`margin`, `width`, `height`, `top`, `left`, `padding`, `grid-template-*`). Use `transform` / `opacity`. The hanji aesthetic doesn't ask for elaborate motion anyway.
- **Don't reach for emoji** for new chrome icons. Add an SVG to `icons.tsx`. Color emoji clash with the muted palette.
- **Don't add a new accent color without dark-mode override**. A brown/clay tone that reads on light cream often falls below AA on dark surfaces. Verify `--clay` pattern: brighten the accent in `.dark`, don't just flip surfaces.
- **Don't duplicate the typewriter effect**. `MessageBubble` already implements one via `displayedLen` state + `cleanRef` + `setInterval`. Adding another layer will double-stutter. See `src/components/MessageBubble.tsx`.
- **Don't write to `malsseum_current` directly**. Active session persistence is managed by a `useEffect` in `ChatInterface` (saves on message/mode change, skips during `isLoading`). `malsseum_history` stores completed conversations (max 10). Both keys must stay in sync — see `CURRENT_KEY` / `HISTORY_KEY` constants.
- **Don't add solid background to ChatInterface root**. The root `div` in `ChatInterface.tsx` is intentionally background-less (transparent) so `body::before` hanji texture shows through the message scroll area. If you need a surface color, apply it to a specific child element (TopBar, sidebar, input bar) not the root.
- **Don't call `/api/search` without score filtering**. `SCORE_THRESHOLD = 0.45` in `search/route.ts` gates results. Below this threshold, return `{ results: [], message: '...' }`. Don't lower it without testing against the §4.1 benchmark queries.
- **Don't lower `RAG_SCORE_THRESHOLD` below 0.55 in `/api/chat`**. Chat threshold (0.55) is higher than search (0.45) because low-quality RAG candidates injected into the LLM context cause hallucinated verse citations. Free mode skips RAG entirely — don't add it back.
- **Don't run RAG in free mode**. `mode !== 'free'` guard in `chat/route.ts` is intentional. Free mode is LLM-context-first conversation; RAG only adds latency and can push the model toward citations the user didn't ask for.

## Related projects (separate repos)

- **`tigerjk9/bible-rag`** (forked from `calebyhan/bible-rag`): full RAG with FastAPI + pgvector + Redis + bge-reranker + Strong's 442k words. Has its own frontend at `bible-rag-two.vercel.app`. Backend currently down (Koyeb). malsseum-ui is a **separate** project with hanji aesthetic — see `bible-rag/docs/superpowers/specs/2026-04-27-malsseum-ui-design.md`. Future integration option in PRD §6.3.

## Deployment

- Production branch: `main`
- Auto-deploys on every push
- Required env var: `GEMINI_API_KEY` (set on Vercel for Production + Preview + Development)
- Static assets (`public/rag/`) served by Vercel CDN, cached at edge.

To roll out an index update:
```bash
npm run build:rag                          # ~50 min
ls -lh public/rag/                         # verify ~22 MB embed + ~1.5 MB meta
node scripts/smoke-rag.mjs                 # verify retrieval quality locally
git add public/rag/ && git commit -m "..." && git push origin main
```
