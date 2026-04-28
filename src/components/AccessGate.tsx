'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { GEMINI_KEY_STORAGE_KEY, ACCESS_MODE_KEY, ADMIN_PW_KEY, DEFAULT_ADMIN_PW } from '@/lib/constants'
import { UserIcon } from './icons'

type Step = 'select' | 'admin-pw' | 'key-input' | 'change-pw'

interface Props {
  onComplete: (mode: 'admin' | 'user', apiKey?: string) => void
  onClose?: () => void
}

function getAdminPw(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PW
  return localStorage.getItem(ADMIN_PW_KEY) ?? DEFAULT_ADMIN_PW
}

export default function AccessGate({ onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [apiKey, setApiKey] = useState('')
  const [pw, setPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [pwChanged, setPwChanged] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAlreadyAdmin =
    typeof window !== 'undefined' &&
    localStorage.getItem(ACCESS_MODE_KEY) === 'admin'

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [step])

  const resetError = () => { setError(''); setPwChanged(false) }

  const goBack = () => {
    setStep('select')
    setPw(''); setApiKey(''); setNewPw(''); setConfirmPw('')
    resetError()
  }

  const handleAdminPwSubmit = () => {
    if (!pw) { setError('비밀번호를 입력해주세요.'); return }
    if (pw !== getAdminPw()) { setError('비밀번호가 올바르지 않습니다.'); return }
    localStorage.setItem(ACCESS_MODE_KEY, 'admin')
    localStorage.removeItem(GEMINI_KEY_STORAGE_KEY)
    onComplete('admin')
  }

  const handleUserContinue = () => {
    const trimmed = apiKey.trim()
    if (!trimmed) { setError('API 키를 입력해주세요.'); return }
    if (!trimmed.startsWith('AIza')) {
      setError('Gemini API 키는 AIzaSy...로 시작합니다. 다시 확인해주세요.')
      return
    }
    localStorage.setItem(ACCESS_MODE_KEY, 'user')
    localStorage.setItem(GEMINI_KEY_STORAGE_KEY, trimmed)
    onComplete('user', trimmed)
  }

  const handleChangePw = () => {
    if (!pw) { setError('현재 비밀번호를 입력해주세요.'); return }
    if (pw !== getAdminPw()) { setError('현재 비밀번호가 올바르지 않습니다.'); return }
    if (!newPw) { setError('새 비밀번호를 입력해주세요.'); return }
    if (newPw.length < 4) { setError('새 비밀번호는 4자 이상이어야 합니다.'); return }
    if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    localStorage.setItem(ADMIN_PW_KEY, newPw)
    setPw(''); setNewPw(''); setConfirmPw(''); setError('')
    setPwChanged(true)
  }

  const inputClass = `w-full text-[0.85rem] bg-[var(--paper-white)]
    border border-[var(--clay-border)] rounded-[var(--radius-control)]
    px-3.5 py-2.5 text-[var(--ink-dark)]
    placeholder:text-[var(--ink-medium)] placeholder:opacity-40
    focus-visible:outline-none focus-visible:border-[var(--clay)]`

  const btnPrimary = `w-full py-2.5 rounded-[var(--radius-control)]
    bg-[var(--ink-dark)] text-[var(--hanji-cream)]
    text-[0.85rem] hover:bg-[var(--clay)] transition-colors
    disabled:opacity-40 disabled:cursor-not-allowed`

  const btnBack = `w-full text-[0.74rem] text-[var(--ink-medium)]/60
    hover:text-[var(--ink-medium)] transition-colors`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center
                    bg-[var(--hanji-warm)]/95 px-4 py-8">
      <div className="w-full max-w-[380px] rounded-[var(--radius-paper)]
                      border border-[var(--clay-border)] overflow-hidden
                      bg-[var(--hanji-cream)] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">

        {/* Hero image */}
        <div className="relative w-full" style={{ aspectRatio: '2848 / 1504' }}>
          <Image src="/og-image.png" alt="말씀의 길 — 하나님께 더 가까이"
            fill className="object-cover" priority />
          <div className="absolute inset-x-0 bottom-0 h-12
                          bg-gradient-to-t from-[var(--hanji-cream)] to-transparent" />
        </div>

        <div className="px-5 pb-7 pt-4">

          {/* Close button */}
          {onClose && (
            <div className="flex justify-end mb-2 -mt-1">
              <button onClick={onClose} aria-label="닫기"
                className="text-[var(--ink-medium)]/50 hover:text-[var(--ink-medium)]
                           transition-colors text-lg leading-none w-8 h-8
                           flex items-center justify-center">
                ✕
              </button>
            </div>
          )}

          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-[0.58rem] tracking-[0.45em] text-[var(--clay)]/70 uppercase mb-1">
              VERBUM
            </p>
            <h1 className="text-[1.05rem] font-[family-name:var(--font-serif)]
                           text-[var(--ink-dark)] tracking-wide mb-1.5">
              말씀의 길
            </h1>
            <p className="text-[0.73rem] text-[var(--ink-medium)] leading-relaxed">
              하나님께 더 가까이 나아가도록 돕는 작은 도구입니다
            </p>
          </div>

          {/* ── select ── */}
          {step === 'select' && (
            <div>
              <p className="text-[0.72rem] text-center text-[var(--ink-medium)]/70 mb-4">
                접속 방식을 선택해주세요
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { resetError(); setStep('admin-pw') }}
                  className="group flex flex-col gap-3 p-4 text-left
                             rounded-[var(--radius-paper)] border border-[var(--clay-border)]
                             bg-[var(--hanji-cream)] hover:bg-[var(--clay-light)]
                             hover:border-[var(--clay)] transition-all">
                  <div className="w-9 h-9 rounded-[var(--radius-pill)] bg-[var(--ink-dark)]
                                  flex items-center justify-center text-[var(--hanji-cream)] text-xs
                                  group-hover:bg-[var(--clay)] transition-colors">✦</div>
                  <div>
                    <div className="text-[0.84rem] font-medium text-[var(--ink-dark)]">관리자</div>
                    <div className="text-[0.7rem] text-[var(--ink-medium)] leading-snug mt-0.5 whitespace-pre-line">
                      {'비밀번호로\n접속'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { resetError(); setStep('key-input') }}
                  className="group flex flex-col gap-3 p-4 text-left
                             rounded-[var(--radius-paper)] border border-[var(--clay-border)]
                             bg-[var(--hanji-cream)] hover:bg-[var(--clay-light)]
                             hover:border-[var(--clay)] transition-all">
                  <div className="w-9 h-9 rounded-[var(--radius-pill)]
                                  border border-[var(--clay-border)] flex items-center justify-center
                                  text-[var(--ink-medium)] group-hover:border-[var(--clay)]
                                  group-hover:text-[var(--clay)] transition-colors">
                    <UserIcon width={18} height={18} />
                  </div>
                  <div>
                    <div className="text-[0.84rem] font-medium text-[var(--ink-dark)]">일반 접속자</div>
                    <div className="text-[0.7rem] text-[var(--ink-medium)] leading-snug mt-0.5 whitespace-pre-line">
                      {'Gemini API 키\n직접 입력'}
                    </div>
                  </div>
                </button>
              </div>

              {/* 비밀번호 변경 — 이미 관리자 접속 중일 때만 표시 */}
              {isAlreadyAdmin && (
                <button
                  onClick={() => { resetError(); setStep('change-pw') }}
                  className="mt-4 w-full text-[0.71rem] text-[var(--ink-medium)]/50
                             hover:text-[var(--clay)] transition-colors text-center">
                  관리자 비밀번호 변경
                </button>
              )}
            </div>
          )}

          {/* ── admin-pw ── */}
          {step === 'admin-pw' && (
            <div className="space-y-4">
              <div>
                <p className="text-[0.78rem] font-medium text-[var(--ink-dark)] mb-3">
                  관리자 비밀번호
                </p>
                <input
                  ref={inputRef}
                  type="password"
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); resetError() }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdminPwSubmit() }}
                  placeholder="비밀번호 입력"
                  className={inputClass}
                />
                {error && <p className="text-[0.71rem] text-red-500/80 mt-1.5">{error}</p>}
              </div>
              <button onClick={handleAdminPwSubmit} disabled={!pw} className={btnPrimary}>
                접속
              </button>
              <button onClick={goBack} className={btnBack}>← 돌아가기</button>
            </div>
          )}

          {/* ── key-input ── */}
          {step === 'key-input' && (
            <div className="space-y-4">
              <div>
                <p className="text-[0.78rem] font-medium text-[var(--ink-dark)] mb-1">
                  Gemini API 키 입력
                </p>
                <p className="text-[0.72rem] text-[var(--ink-medium)] mb-3 leading-relaxed">
                  키는 브라우저에만 저장되며 서버로 전송되지 않습니다.
                  본인의 Gemini 무료 한도 안에서 사용됩니다.
                </p>
                <input
                  ref={inputRef}
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); resetError() }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUserContinue() }}
                  placeholder="AIzaSy..."
                  className={inputClass}
                />
                {error && <p className="text-[0.71rem] text-red-500/80 mt-1.5">{error}</p>}
              </div>

              <div className="rounded-[var(--radius-paper)] border border-[var(--clay-border)]/60
                              bg-[var(--clay-light)]/40 px-3.5 py-3 space-y-1.5">
                <p className="text-[0.73rem] font-medium text-[var(--ink-dark)]">키가 없으신가요?</p>
                <p className="text-[0.7rem] text-[var(--ink-medium)] leading-relaxed">
                  Google AI Studio에서 무료로 발급받으실 수 있습니다.
                  가입 후 1분 이내 발급됩니다. Gemini 무료 한도로 충분합니다.
                </p>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.73rem]
                             text-[var(--clay)] hover:opacity-70 transition-opacity">
                  Google AI Studio 바로가기
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
                       strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </div>

              <button onClick={handleUserContinue} disabled={!apiKey.trim()} className={btnPrimary}>
                시작하기
              </button>
              <button onClick={goBack} className={btnBack}>← 돌아가기</button>
            </div>
          )}

          {/* ── change-pw ── */}
          {step === 'change-pw' && (
            <div className="space-y-3">
              <p className="text-[0.78rem] font-medium text-[var(--ink-dark)]">
                관리자 비밀번호 변경
              </p>

              {pwChanged ? (
                <div className="rounded-[var(--radius-paper)] border border-[var(--clay-border)]/60
                                bg-[var(--clay-light)]/40 px-3.5 py-4 text-center space-y-1">
                  <p className="text-[0.78rem] text-[var(--clay)] font-medium">
                    비밀번호가 변경되었습니다.
                  </p>
                  <p className="text-[0.7rem] text-[var(--ink-medium)]">
                    다음 접속부터 새 비밀번호가 적용됩니다.
                  </p>
                </div>
              ) : (
                <>
                  <input
                    ref={inputRef}
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); resetError() }}
                    placeholder="현재 비밀번호"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); resetError() }}
                    placeholder="새 비밀번호"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); resetError() }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangePw() }}
                    placeholder="새 비밀번호 확인"
                    className={inputClass}
                  />
                  {error && <p className="text-[0.71rem] text-red-500/80">{error}</p>}
                  <button
                    onClick={handleChangePw}
                    disabled={!pw || !newPw || !confirmPw}
                    className={btnPrimary}>
                    변경하기
                  </button>
                </>
              )}

              <button onClick={goBack} className={btnBack}>← 돌아가기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
