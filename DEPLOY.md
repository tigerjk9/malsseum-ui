# Vercel 배포 가이드 (Phase 1 MVP)

## 사전 준비

1. **Gemini API 키** — [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급
2. **Vercel 계정** — [vercel.com](https://vercel.com) 가입 (GitHub 로그인 권장)
3. **Vercel CLI** (선택, 대시보드 업로드도 가능):
   ```bash
   npm install -g vercel
   ```

## A. CLI로 배포 (추천)

### 1. 프로젝트 디렉토리에서 인증

```bash
cd "I:\내 드라이브\Github Desktop\malsseum-ui"
vercel login
```

### 2. 첫 배포 (preview)

```bash
vercel
```

프롬프트 응답:
- `Set up and deploy "..."?` → **Y**
- `Which scope?` → 본인 계정 선택
- `Link to existing project?` → **N**
- `Project name?` → `malsseum-ui` (또는 원하는 이름)
- `In which directory is your code?` → `./`
- `Want to modify these settings?` → **N** (Next.js 자동 감지)

### 3. 환경 변수 등록

```bash
vercel env add GEMINI_API_KEY
# Value: <Gemini API 키 붙여넣기>
# Environment: Production, Preview, Development 모두 선택 (Space로 다중 선택)
```

또는 [Vercel 대시보드 → Project → Settings → Environment Variables](https://vercel.com/dashboard)에서 GUI 입력.

### 4. Production 배포

```bash
vercel --prod
```

배포 완료 후 출력되는 URL(예: `https://malsseum-ui.vercel.app`) 접속해 동작 확인.

---

## B. GitHub 연동 자동 배포

### 1. GitHub 레포 생성

```bash
gh repo create malsseum-ui --public --source=. --remote=origin --push
```

또는 [github.com/new](https://github.com/new)에서 수동 생성 후:

```bash
git remote add origin https://github.com/<USER>/malsseum-ui.git
git push -u origin main
```

### 2. Vercel 대시보드에서 Import

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 레포 `malsseum-ui` 선택 → **Import**
3. Framework Preset: **Next.js** (자동)
4. Environment Variables: `GEMINI_API_KEY` 추가
5. **Deploy**

이후 `main` 브랜치 푸시 시 자동 배포, PR마다 preview URL 자동 생성.

---

## 배포 후 동작 확인 체크리스트

- [ ] 첫 화면 로딩 < 2초
- [ ] "용서에 대해 알고 싶어요" 입력 → Gemini 응답 스트리밍 확인
- [ ] 응답에 구절 카드 (요한일서 1:9 등) 정상 표시
- [ ] 제안 칩 클릭 → 자동 입력 동작
- [ ] 번역본 드롭다운 변경 동작
- [ ] 한지 배경 괘선 + 황토 액센트 시각 확인
- [ ] 모바일 뷰포트 (375px) 깨짐 없음

---

## 문제 해결

| 증상 | 원인 / 해결 |
|------|------------|
| `GEMINI_API_KEY 환경 변수가 설정되지 않았습니다` | Vercel 대시보드에 env 추가 후 재배포 |
| 구절 카드가 안 뜸 | `/api/verse?ref=John:3:16` 직접 호출해 Bolls.life 응답 확인 |
| 폰트가 시스템 기본으로 보임 | Vercel 빌드 로그에서 Google Fonts 다운로드 성공 여부 확인 |
| Gemini 응답이 영어로 옴 | 시스템 프롬프트가 잘 안 먹힌 것 — `gemini.ts`의 `SYSTEM_PROMPT` 확인 |

---

## Phase 2 배포 시 추가 검토

- 사용자 BYO API 키 입력 UI 추가 시 → 서버 환경변수 의존도 낮아짐 (rate limit 분산)
- 슬라이드 패널 추가 시 → 모바일에서 BottomNav 동작 확인
- OpenBible.info 교차 참조 정적 JSON 번들 시 → Vercel Edge에 배포 가능 여부 검토
