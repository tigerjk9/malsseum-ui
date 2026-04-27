'use client'
import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export default function SlidePanel({ open, title, onClose, children }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <>
      <div
        data-testid="slide-panel-overlay"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-30 bg-[rgba(61,43,31,0.4)]"
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className="fixed z-40 bg-[var(--hanji-cream)] border-l border-[var(--clay-border)]
                   flex flex-col
                   inset-0 md:inset-auto md:top-0 md:right-0 md:h-screen md:w-[280px]
                   shadow-[-4px_0_16px_rgba(61,43,31,0.06)]"
      >
        <header className="flex items-center justify-between px-4 py-3
                           border-b border-[var(--clay-border)] bg-[var(--hanji-cream)]">
          <h2 className="verse-label text-[0.7rem]">{title}</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 rounded-[var(--radius-pill)] flex items-center justify-center
                       text-[var(--ink-medium)] hover:bg-[var(--clay-light)]
                       hover:text-[var(--clay)] transition-colors"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </>
  )
}
