'use client'
import { TRANSLATION_LABELS } from '@/lib/constants'
import type { TranslationCode } from '@/lib/types'
import ThemeToggle from './ThemeToggle'
import HanjaToggle from './HanjaToggle'
import { PlusIcon, LockIcon, TrashIcon } from './icons'

interface Props {
  translation: TranslationCode
  onTranslationChange: (t: TranslationCode) => void
  onNewChat: () => void
  onClearChat: () => void
  canClearChat: boolean
  hanjaEnabled: boolean
  onHanjaToggle: (enabled: boolean) => void
  accessMode: 'admin' | 'user'
  hasKey: boolean
  onOpenAccessGate: () => void
}

const TRANSLATIONS: TranslationCode[] = ['KRV', 'RNKSV', 'NIV', 'ESV', 'KJV']

export default function TopBar({
  translation, onTranslationChange, onNewChat,
  onClearChat, canClearChat,
  hanjaEnabled, onHanjaToggle,
  accessMode, hasKey, onOpenAccessGate,
}: Props) {
  const keyActive = accessMode === 'admin' || hasKey

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

        <button
          onClick={onClearChat}
          disabled={!canClearChat}
          aria-label="현재 대화 내역 초기화"
          title="현재 대화 내역 초기화 (저장 없이 지움)"
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-control)]
                     text-[var(--ink-medium)]/70 hover:text-[var(--clay)] hover:bg-[var(--clay-light)]
                     transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                     disabled:hover:bg-transparent disabled:hover:text-[var(--ink-medium)]/70"
        >
          <TrashIcon width={16} height={16} />
        </button>

        {/* 접속 모드 / API 키 상태 (LockIcon이 접속 전환 진입점도 겸함) */}
        <button
          onClick={onOpenAccessGate}
          aria-label={accessMode === 'admin' ? '관리자 모드' : (hasKey ? 'API 키 설정됨' : 'API 키 미설정')}
          title={accessMode === 'admin' ? '관리자 모드 · 변경하려면 클릭' : (hasKey ? 'API 키 설정됨 · 변경' : 'API 키 설정 필요')}
          className={`w-8 h-8 flex items-center justify-center rounded-[var(--radius-control)]
                     transition-colors relative
                     ${keyActive
                       ? 'text-[var(--clay)] bg-[var(--clay-light)]'
                       : 'text-[var(--ink-medium)]/70 hover:text-[var(--clay)] hover:bg-[var(--clay-light)]'
                     }`}
        >
          <LockIcon width={16} height={16} />
          {/* Warning dot when user mode but no key */}
          {accessMode === 'user' && !hasKey && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full
                             bg-amber-400 ring-1 ring-[var(--hanji-cream)]" />
          )}
        </button>

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
