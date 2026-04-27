'use client'
import type { DialogueMode } from '@/lib/types'

interface Props {
  onSelect: (mode: DialogueMode) => void
}

export default function DialogueModeSelector({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2.5 px-1 mt-1 animate-fade-in">
      <p className="text-[0.7rem] text-[var(--ink-medium)]/80 tracking-wide">
        이제 어떻게 이어가시겠어요?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onSelect('inductive')}
          className="flex-1 text-left px-3 py-2.5 rounded-[var(--radius-paper)]
                     border border-[var(--clay-border)] hover:border-[var(--clay)]
                     hover:bg-[var(--clay-light)] transition-all duration-150"
        >
          <div className="text-[0.75rem] font-medium text-[var(--ink-dark)] mb-0.5">
            귀납 구조로 계속
          </div>
          <div className="text-[0.65rem] text-[var(--ink-medium)]/80 leading-relaxed">
            관찰 → 해석 → 적용으로 깊이 파고들기
          </div>
        </button>
        <button
          onClick={() => onSelect('free')}
          className="flex-1 text-left px-3 py-2.5 rounded-[var(--radius-paper)]
                     border border-[var(--clay-border)] hover:border-[var(--clay)]
                     hover:bg-[var(--clay-light)] transition-all duration-150"
        >
          <div className="text-[0.75rem] font-medium text-[var(--ink-dark)] mb-0.5">
            자유롭게 대화
          </div>
          <div className="text-[0.65rem] text-[var(--ink-medium)]/80 leading-relaxed">
            형식 없이 편하게 이야기 나누기
          </div>
        </button>
      </div>
    </div>
  )
}
