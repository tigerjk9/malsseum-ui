'use client'
import { useState, useRef, useEffect } from 'react'
import { TRANSLATION_LABELS } from '@/lib/constants'
import type { TranslationCode } from '@/lib/types'
import ThemeToggle from './ThemeToggle'
import HanjaToggle from './HanjaToggle'
import { PlusIcon, KeyIcon } from './icons'

interface Props {
  translation: TranslationCode
  onTranslationChange: (t: TranslationCode) => void
  onNewChat: () => void
  hanjaEnabled: boolean
  onHanjaToggle: (enabled: boolean) => void
  geminiKey: string
  onGeminiKeyChange: (key: string) => void
}

const TRANSLATIONS: TranslationCode[] = ['KRV', 'RNKSV', 'NIV', 'ESV', 'KJV']

export default function TopBar({
  translation, onTranslationChange, onNewChat,
  hanjaEnabled, onHanjaToggle,
  geminiKey, onGeminiKeyChange,
}: Props) {
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [inputValue, setInputValue] = useState(geminiKey)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(geminiKey)
  }, [geminiKey])

  useEffect(() => {
    if (!showKeyInput) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowKeyInput(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showKeyInput])

  const saveKey = () => {
    onGeminiKeyChange(inputValue.trim())
    setShowKeyInput(false)
  }

  return (
    <header className="flex items-center justify-between px-4 py-2
                       border-b border-[var(--clay-border)]/50 bg-[var(--hanji-cream)]
                       sticky top-0 z-10">
      <button
        onClick={onNewChat}
        className="text-left hover:opacity-60 transition-opacity active:opacity-40"
        aria-label="새 대화 시작"
      >
        <div className="text-[0.7rem] tracking-[0.3em] text-[var(--ink-medium)]/70 uppercase">
          말씀의 길
        </div>
        <div className="text-[0.55rem] tracking-[0.4em] text-[var(--clay)]/60 uppercase mt-px">
          VERBUM
        </div>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onNewChat}
          aria-label="새 대화"
          title="새 대화"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-control)]
                     text-[var(--ink-medium)]/70 hover:text-[var(--clay)] hover:bg-[var(--clay-light)]
                     transition-colors"
        >
          <PlusIcon width={16} height={16} />
        </button>

        {/* API 키 설정 버튼 */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowKeyInput((v) => !v)}
            aria-label="Gemini API 키 설정"
            title={geminiKey ? 'API 키 설정됨' : 'API 키 설정'}
            className={`w-8 h-8 flex items-center justify-center rounded-[var(--radius-control)]
                       transition-colors
                       ${geminiKey
                         ? 'text-[var(--clay)] bg-[var(--clay-light)]'
                         : 'text-[var(--ink-medium)]/70 hover:text-[var(--clay)] hover:bg-[var(--clay-light)]'
                       }`}
          >
            <KeyIcon width={16} height={16} />
          </button>

          {showKeyInput && (
            <div className="absolute top-full right-0 mt-1.5 w-72
                            bg-[var(--hanji-cream)] border border-[var(--clay-border)]
                            rounded-[var(--radius-paper)] p-3 shadow-lg z-50 space-y-2.5">
              <p className="text-[0.7rem] text-[var(--ink-medium)] font-medium">
                Gemini API 키
              </p>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveKey()
                    if (e.key === 'Escape') setShowKeyInput(false)
                  }}
                  placeholder="AIza..."
                  autoFocus
                  className="flex-1 text-[0.8rem] bg-[var(--paper-white)]
                             border border-[var(--clay-border)]
                             rounded-[var(--radius-control)] px-2.5 py-1.5
                             text-[var(--ink-dark)] placeholder:text-[var(--ink-medium)] placeholder:opacity-50
                             focus-within:border-[var(--clay)]"
                />
                {inputValue && (
                  <button
                    onClick={() => { setInputValue(''); onGeminiKeyChange('') }}
                    className="text-[0.7rem] px-2 py-1 rounded-[var(--radius-control)]
                               text-[var(--ink-medium)]/70 hover:text-[var(--clay)]
                               hover:bg-[var(--clay-light)] transition-colors"
                  >
                    지우기
                  </button>
                )}
              </div>
              <button
                onClick={saveKey}
                className="w-full py-1.5 rounded-[var(--radius-control)]
                           bg-[var(--ink-dark)] text-[var(--hanji-cream)]
                           text-[0.75rem] hover:bg-[var(--clay)] transition-colors"
              >
                저장
              </button>
              <p className="text-[0.65rem] text-[var(--ink-medium)] opacity-70 leading-snug">
                입력 시 서버 환경 변수 대신 사용됩니다. 브라우저 로컬 스토리지에만 저장됩니다.
              </p>
            </div>
          )}
        </div>

        <span className="hidden md:inline-flex">
          <HanjaToggle enabled={hanjaEnabled} onChange={onHanjaToggle} />
        </span>
        <ThemeToggle />
        <select
          value={translation}
          onChange={(e) => onTranslationChange(e.target.value as TranslationCode)}
          className="text-[0.7rem] bg-transparent text-[var(--ink-medium)]/70
                     border border-[var(--clay-border)]/50 hover:border-[var(--clay-border)]
                     rounded-[var(--radius-control)] px-2.5 py-1 cursor-pointer
                     transition-colors focus:outline-none focus-visible:outline-none
                     focus-within:border-[var(--clay)]"
        >
          {TRANSLATIONS.map((t) => (
            <option key={t} value={t}>{TRANSLATION_LABELS[t]}</option>
          ))}
        </select>
      </div>
    </header>
  )
}
