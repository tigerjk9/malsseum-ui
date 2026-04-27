'use client'
import { useState, useRef, type KeyboardEvent } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--clay-border)] bg-[var(--hanji-cream)]">
      <div className="flex items-end gap-3 bg-[var(--paper-white)] border border-[var(--clay-border)]
                      rounded-[var(--radius-control)] px-4 py-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder="말씀을 찾거나, 마음의 질문을 나눠보세요..."
          rows={1}
          className="flex-1 bg-transparent resize-none text-[0.9rem] text-[var(--ink-dark)]
                     placeholder:text-[var(--ink-medium)] placeholder:opacity-60
                     focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-[var(--radius-pill)] bg-[var(--ink-dark)] text-[var(--hanji-cream)]
                     flex items-center justify-center text-sm flex-shrink-0 mb-0.5
                     hover:bg-[var(--clay)] transition-colors disabled:opacity-40"
        >
          ↑
        </button>
      </div>
      <p className="text-[0.6rem] text-center text-[var(--ink-medium)] opacity-50 mt-1">
        Enter로 전송 · Shift+Enter 줄바꿈
      </p>
    </div>
  )
}
