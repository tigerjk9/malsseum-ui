'use client'
import { useEffect, useRef, type ReactNode } from 'react'

const MIN_WIDTH = 240
const MAX_WIDTH = 600

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
  onWidthChange?: (w: number) => void
}

export default function SlidePanel({
  open, title, onClose, children,
  width = 280, onWidthChange = () => {},
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)
  const touchStartY = useRef(0)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  // 데스크톱 리사이즈 드래그
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: width }
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startX - ev.clientX
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragRef.current.startW + delta))
      onWidthChange(next)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // 모바일 스와이프 다운 → 닫기 (드래그 필에서만)
  const handlePillTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handlePillTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 60) onClose()
  }

  if (!open) return null

  return (
    <>
      {/* 모바일 전용 백드롭 */}
      <div
        data-testid="slide-panel-overlay"
        onClick={onClose}
        className="md:hidden fixed inset-0 z-30 bg-[rgba(61,43,31,0.4)] panel-backdrop-enter"
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label={title}
        aria-modal="true"
        style={{ '--panel-w': `${width}px` } as React.CSSProperties}
        className="fixed z-40 bg-[var(--hanji-cream)] flex flex-col panel-enter panel-desktop-w
                   shadow-[-4px_0_16px_rgba(61,43,31,0.06)]
                   border-t border-[var(--clay-border)]
                   inset-x-0 bottom-0 h-[75vh] rounded-t-[var(--radius-paper)]
                   md:border-t-0 md:border-l md:rounded-none
                   md:inset-auto md:top-0 md:right-0 md:bottom-auto md:h-screen"
      >
        {/* 모바일: 스와이프 다운 핸들 (드래그 필) */}
        <div
          className="md:hidden flex justify-center pt-3 pb-1.5 touch-none cursor-grab shrink-0"
          onTouchStart={handlePillTouchStart}
          onTouchEnd={handlePillTouchEnd}
          aria-hidden="true"
        >
          <div className="w-9 h-1 rounded-full bg-[var(--clay-border)]" />
        </div>

        {/* 데스크톱: 왼쪽 가장자리 리사이즈 핸들 */}
        <div
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 z-10
                     cursor-ew-resize hover:bg-[var(--clay)]/20 transition-colors"
          onMouseDown={handleResizeStart}
          aria-hidden="true"
          title="드래그하여 너비 조절"
        />

        <header className="flex items-center justify-between px-4 py-3 shrink-0
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
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">{children}</div>
      </aside>
    </>
  )
}
