'use client'
import type { SavedConversation } from '@/lib/types'

interface Props {
  history: SavedConversation[]
  onRestore: (conv: SavedConversation) => void
  onDelete: (id: string) => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return '오늘 ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function HistoryPanel({ history, onRestore, onDelete }: Props) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
        <p className="text-[0.85rem] text-[var(--ink-medium)]/70">저장된 대화가 없습니다</p>
        <p className="text-[0.75rem] text-[var(--ink-medium)]/50">새 대화를 시작하면 이전 대화가 여기에 저장됩니다</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--clay-border)]/40">
      {history.map((conv) => {
        const msgCount = conv.messages.filter(m => m.role === 'user').length
        return (
          <div key={conv.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-[var(--clay-light)] transition-colors">
            <button
              onClick={() => onRestore(conv)}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-[0.85rem] text-[var(--ink-dark)] truncate leading-snug">
                {conv.title}
              </p>
              <p className="text-[0.7rem] text-[var(--ink-medium)]/70 mt-0.5">
                {formatDate(conv.savedAt)} · {msgCount}개 질문
                {conv.dialogueMode === 'free' && ' · 자유 대화'}
              </p>
            </button>
            <button
              onClick={() => onDelete(conv.id)}
              aria-label="삭제"
              className="opacity-0 group-hover:opacity-100 transition-opacity
                         text-[var(--ink-medium)]/50 hover:text-[var(--clay)]
                         text-[0.75rem] flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
