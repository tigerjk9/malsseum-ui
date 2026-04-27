'use client'
import { useState, useRef, type KeyboardEvent } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  mode: 'inductive' | 'free'
  onModeChange: (mode: 'inductive' | 'free') => void
}

export default function ChatInput({ onSend, disabled, mode, onModeChange }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <div className="bg-[var(--hanji-cream)] px-4 pt-3 pb-3
                    border-t border-[var(--clay-border)]/50">
      <div className="flex items-end gap-3 max-w-2xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder="말씀을 찾거나, 마음의 질문을 나눠보세요…"
          rows={1}
          className="flex-1 bg-transparent resize-none
                     text-[0.9rem] leading-relaxed text-[var(--ink-dark)]
                     placeholder:text-[var(--ink-medium)]/60
                     disabled:opacity-40 focus:outline-none
                     py-1 min-h-[1.5rem]"
          style={{ maxHeight: '160px' }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="전송"
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                     transition-all duration-200
                     disabled:opacity-25
                     bg-[var(--clay)] text-[var(--hanji-cream)]
                     hover:opacity-80 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between max-w-2xl mx-auto mt-1.5 px-0.5">
        <p className="text-[0.6rem] text-[var(--ink-medium)]/50 tracking-wider">
          Enter 전송 &middot; Shift+Enter 줄바꿈
        </p>
        <div className="flex items-center gap-0.5 rounded-[var(--radius-pill)]
                        border border-[var(--clay-border)] overflow-hidden">
          {(['inductive', 'free'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              disabled={disabled}
              className={`text-[0.6rem] tracking-wide px-2 py-0.5 transition-colors
                ${mode === m
                  ? 'bg-[var(--clay)] text-[var(--hanji-cream)]'
                  : 'text-[var(--ink-medium)]/60 hover:text-[var(--ink-medium)]'
                }`}
            >
              {m === 'inductive' ? '귀납' : '자유'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
