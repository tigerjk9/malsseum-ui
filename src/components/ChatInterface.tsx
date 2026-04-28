'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage, AppState, PanelType, VerseRef, VerseData, SavedConversation, DialogueMode } from '@/lib/types'
import { DEFAULT_TRANSLATION, GEMINI_KEY_STORAGE_KEY, ACCESS_MODE_KEY, ADMIN_TOKEN_KEY } from '@/lib/constants'
import { parseVerseRefString } from '@/lib/verse-parser'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import TopBar from './TopBar'
import IconSidebar from './IconSidebar'
import BottomNav from './BottomNav'
import SlidePanel from './SlidePanel'
import TranslationComparePanel from './panels/TranslationComparePanel'
import SearchPanel from './panels/SearchPanel'
import BrowsePanel from './panels/BrowsePanel'
import ThemesPanel from './panels/ThemesPanel'
import OriginalLanguagePanel from './panels/OriginalLanguagePanel'
import HistoryPanel from './panels/HistoryPanel'
import HelpPanel from './panels/HelpPanel'
import AccessGate from './AccessGate'

const HISTORY_KEY = 'malsseum_history'
const CURRENT_KEY = 'malsseum_current'
const PANEL_WIDTH_KEY = 'malsseum_panel_width'
const MAX_HISTORY = 10
const DEFAULT_PANEL_WIDTH = 280

function isTokenExpired(token: string): boolean {
  try {
    const data = token.split('.')[0]
    const payload = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp < Math.floor(Date.now() / 1000)
  } catch { return true }
}

function loadHistory(): SavedConversation[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch { return [] }
}

function persistHistory(history: SavedConversation[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

function loadCurrentSession(): { messages: ChatMessage[]; dialogueMode: DialogueMode } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CURRENT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveCurrentSession(messages: ChatMessage[], dialogueMode: DialogueMode) {
  if (!messages.some(m => m.role === 'user')) return
  localStorage.setItem(CURRENT_KEY, JSON.stringify({ messages, dialogueMode }))
}

function makeTitle(messages: ChatMessage[]): string {
  const first = messages.find(m => m.role === 'user')
  return first ? first.content.slice(0, 28) + (first.content.length > 28 ? '…' : '') : '대화'
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '안녕하세요. 저는 말씀 길잡이입니다.\n\n이 앱은 하나님께 더 가까이 나아가도록 돕는 작은 도구입니다. 한글 성경 31,103구절에서 의미 검색으로 질문에 가장 가까운 말씀을 찾습니다.\n\n✦ 귀납 모드 — 질문으로 이끄는 깊은 묵상\n✦ 자유 모드 — 편하게 나누는 대화\n✦ 검색 · 탐독 · 테마 · 원어 · 번역 비교\n✦ 도움말 — 기능별 상세 안내',
  verses: [],
  suggestions: [
    {
      label: '위로가 필요해요',
      prompt: '오늘 마음이 많이 힘들어요. 하나님의 위로의 말씀이 필요합니다',
    },
    {
      label: '용서가 왜 이렇게 어려울까요',
      prompt: '용서해야 한다는 걸 알면서도 마음이 잘 안 움직여요. 성경이 용서에 대해 뭐라고 하나요?',
    },
    {
      label: '하나님이 정말 나를 사랑하실까요',
      prompt: '가끔 하나님이 정말 나를 사랑하시는지 의심이 들어요. 성경은 뭐라고 말하나요?',
    },
  ],
}

const PANEL_TITLES: Record<Exclude<PanelType, 'none'>, string> = {
  search: '검색',
  browse: '탐독',
  themes: '묵상',
  compare: '번역 비교',
  original: '원어',
  history: '대화 기록',
  help: '도움말',
}

export default function ChatInterface() {
  const [state, setState] = useState<AppState>({
    messages: [WELCOME_MESSAGE],
    activePanel: 'none',
    activePanelVerse: null,
    translation: DEFAULT_TRANSLATION,
    isLoading: false,
    error: null,
    dialogueMode: 'inductive',
  })
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
  const [hanjaEnabled, setHanjaEnabled] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [accessMode, setAccessMode] = useState<'admin' | 'user'>('user')
  const [gateOpen, setGateOpen] = useState(false)
  const [gateForceSelect, setGateForceSelect] = useState(false)
  const [history, setHistory] = useState<SavedConversation[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

  useEffect(() => {
    const loadedHistory = loadHistory()
    const session = loadCurrentSession()
    // 새로고침/재방문 시 직전 대화는 history로 자동 아카이브하고 welcome 상태로 시작.
    // 사용자는 "대화 기록" 패널에서 복원할 수 있다.
    if (session?.messages.some(m => m.role === 'user')) {
      const archived: SavedConversation = {
        id: nanoid(),
        title: makeTitle(session.messages.filter(m => m.id !== 'welcome')),
        messages: session.messages,
        savedAt: Date.now(),
        dialogueMode: session.dialogueMode ?? 'inductive',
      }
      const updated = [archived, ...loadedHistory].slice(0, MAX_HISTORY)
      persistHistory(updated)
      setHistory(updated)
      localStorage.removeItem(CURRENT_KEY)
    } else {
      setHistory(loadedHistory)
    }
    const savedPanelWidth = parseInt(localStorage.getItem(PANEL_WIDTH_KEY) ?? '', 10)
    if (savedPanelWidth >= 240 && savedPanelWidth <= 600) setPanelWidth(savedPanelWidth)

    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
    const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE_KEY) ?? ''
    const savedMode = localStorage.getItem(ACCESS_MODE_KEY) as 'admin' | 'user' | null

    if (savedToken && !isTokenExpired(savedToken)) {
      setAdminToken(savedToken)
      setAccessMode('admin')
    } else if (savedToken) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ACCESS_MODE_KEY)
    }
    if (savedMode === 'user' && savedKey) {
      setGeminiKey(savedKey)
      setAccessMode('user')
    }
    // 자격 증명 유무와 관계없이 매 방문마다 게이트(welcome 또는 select)를 노출.
    // welcome 스텝은 저장된 자격 증명을 그대로 사용해 "들어가기" 한 번으로 진입.
    setGateOpen(true)
    setIsCheckingAccess(false)
  }, [])

  const handleAccessComplete = (mode: 'admin' | 'user', apiKey?: string, token?: string) => {
    setAccessMode(mode)
    setGateOpen(false)
    setGateForceSelect(false)
    if (mode === 'admin' && token) {
      setAdminToken(token)
      setGeminiKey('')
    } else if (mode === 'user' && apiKey) {
      setAdminToken('')
      setGeminiKey(apiKey)
    }
  }

  const closeGate = () => {
    setGateOpen(false)
    setGateForceSelect(false)
  }

  const openGateForChange = () => {
    setGateForceSelect(true)
    setGateOpen(true)
  }

  useEffect(() => {
    localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth))
  }, [panelWidth])

  useEffect(() => {
    if (state.isLoading) return
    saveCurrentSession(state.messages, state.dialogueMode)
  }, [state.messages, state.dialogueMode, state.isLoading])

  useEffect(() => {
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages])

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: nanoid(), role: 'user', content: text, verses: [], suggestions: [],
    }
    const assistantId = nanoid()
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '',
      verses: [], suggestions: [], isStreaming: true,
    }

    setState(s => ({
      ...s,
      messages: [...s.messages, userMsg, assistantMsg],
      isLoading: true, error: null,
    }))

    try {
      const chatHeaders: HeadersInit = { 'Content-Type': 'application/json' }
      if (adminToken) chatHeaders['x-admin-token'] = adminToken
      else if (geminiKey) chatHeaders['x-gemini-api-key'] = geminiKey

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: chatHeaders,
        body: JSON.stringify({
          messages: [...state.messages, userMsg]
            .filter(m => m.id !== 'welcome')
            .map(m => ({
              id: m.id, role: m.role, content: m.rawContent ?? m.content,
              verses: [], suggestions: [],
            })),
          mode: state.dialogueMode,
        }),
      })

      // 토큰 만료 또는 미인증 → 오류 메시지 대신 게이트 재표시
      if (res.status === 401) {
        if (adminToken) {
          localStorage.removeItem(ADMIN_TOKEN_KEY)
          localStorage.removeItem(ACCESS_MODE_KEY)
          setAdminToken('')
        }
        setState(s => ({
          ...s,
          messages: s.messages.filter(m => m.id !== assistantId),
          isLoading: false,
        }))
        setGateOpen(true)
        return
      }

      if (!res.body) throw new Error('스트림 없음')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = JSON.parse(line.slice(6))

          if (json.type === 'text') {
            setState(s => ({
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantId ? { ...m, content: m.content + json.content } : m
              ),
            }))
          } else if (json.type === 'verse_ref') {
            const parsed = parseVerseRefString(json.ref)
            if (!parsed) continue
            const verseRef: VerseRef = {
              book: parsed.book, chapter: parsed.chapter,
              verse: parsed.verse, translation: parsed.translation as VerseRef['translation'],
            }
            const verseRes = await fetch(
              `/api/verse?ref=${verseRef.book}:${verseRef.chapter}:${verseRef.verse}&translation=${verseRef.translation}`
            )
            if (verseRes.ok) {
              const verseData: VerseData = await verseRes.json()
              setState(s => ({
                ...s,
                messages: s.messages.map(m =>
                  m.id === assistantId ? { ...m, verses: [...m.verses, verseData] } : m
                ),
              }))
            }
          } else if (json.type === 'suggestions') {
            setState(s => ({
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantId
                  ? { ...m, suggestions: json.chips, isStreaming: false }
                  : m
              ),
            }))
          } else if (json.type === 'done') {
            setState(s => ({
              ...s,
              messages: s.messages.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ),
              isLoading: false,
            }))
          } else if (json.type === 'error') {
            throw new Error(json.message)
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다'
      setState(s => ({
        ...s,
        messages: s.messages.map(m =>
          m.id === assistantId
            ? { ...m, content: `오류: ${message}`, isStreaming: false }
            : m
        ),
        isLoading: false,
        error: message,
      }))
    }
  }, [state.messages, state.dialogueMode, adminToken, geminiKey])

  const handlePanelToggle = (panel: PanelType) => {
    setState(s => ({ ...s, activePanel: s.activePanel === panel ? 'none' : panel }))
  }

  const handleAction = (panel: PanelType, ref: VerseRef) => {
    setState(s => ({ ...s, activePanel: panel, activePanelVerse: ref }))
  }

  const handleNewChat = () => {
    const realMessages = state.messages.filter(m => m.id !== 'welcome')
    if (realMessages.some(m => m.role === 'user')) {
      const saved: SavedConversation = {
        id: nanoid(),
        title: makeTitle(realMessages),
        messages: state.messages,
        savedAt: Date.now(),
        dialogueMode: state.dialogueMode,
      }
      const updated = [saved, ...history].slice(0, MAX_HISTORY)
      setHistory(updated)
      persistHistory(updated)
    }
    localStorage.removeItem(CURRENT_KEY)
    setState(s => ({
      ...s,
      messages: [WELCOME_MESSAGE],
      activePanel: 'none',
      activePanelVerse: null,
      error: null,
      dialogueMode: 'inductive',
    }))
  }

  const handleClearChat = () => {
    const realMessages = state.messages.filter(m => m.id !== 'welcome')
    if (!realMessages.some(m => m.role === 'user')) return
    if (typeof window !== 'undefined' &&
        !window.confirm('현재 대화 내역을 모두 지우시겠습니까?\n저장되지 않으며 복구할 수 없습니다.')) {
      return
    }
    localStorage.removeItem(CURRENT_KEY)
    setState(s => ({
      ...s,
      messages: [WELCOME_MESSAGE],
      activePanel: 'none',
      activePanelVerse: null,
      error: null,
    }))
  }

  const handleRestore = (conv: SavedConversation) => {
    setState(s => ({
      ...s,
      messages: conv.messages,
      activePanel: 'none',
      dialogueMode: conv.dialogueMode ?? 'inductive',
    }))
  }

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(c => c.id !== id)
    setHistory(updated)
    persistHistory(updated)
  }

  const handleClosePanel = () => {
    setState(s => ({ ...s, activePanel: 'none' }))
  }

  const handlePickVerse = (verse: VerseData) => {
    const ref = `${verse.bookNameKo} ${verse.ref.chapter}:${verse.ref.verse}`
    const quoted = `📖 ${ref} 에 대해 더 깊이 묵상하고 싶어요.\n"${verse.text}"`
    setState(s => ({ ...s, activePanel: 'none' }))
    handleSend(quoted)
  }

  const renderPanelBody = () => {
    switch (state.activePanel) {
      case 'compare':
        return <TranslationComparePanel verseRef={state.activePanelVerse} />
      case 'search':
        return <SearchPanel onPickVerse={handlePickVerse} adminToken={adminToken} geminiKey={geminiKey} />
      case 'browse':
        return <BrowsePanel onPickVerse={handlePickVerse} translation={state.translation} />
      case 'themes':
        return (
          <ThemesPanel
            adminToken={adminToken}
            geminiKey={geminiKey}
            onPickTheme={(prompt) => {
              setState(s => ({ ...s, activePanel: 'none' }))
              handleSend(prompt)
            }}
          />
        )
      case 'original':
        return <OriginalLanguagePanel verseRef={state.activePanelVerse} adminToken={adminToken} geminiKey={geminiKey} />
      case 'history':
        return (
          <HistoryPanel
            history={history}
            onRestore={(conv) => { handleRestore(conv); handleClosePanel() }}
            onDelete={handleDeleteHistory}
          />
        )
      case 'help':
        return <HelpPanel />
      default:
        return null
    }
  }

  const panelOpen = state.activePanel !== 'none'
  const panelTitle =
    state.activePanel !== 'none' ? PANEL_TITLES[state.activePanel] : ''

  if (isCheckingAccess) return <div className="flex flex-col h-dvh" />

  return (
    <div className="flex flex-col h-dvh">
      <TopBar
        translation={state.translation}
        onTranslationChange={(t) => setState(s => ({ ...s, translation: t }))}
        onNewChat={handleNewChat}
        onClearChat={handleClearChat}
        canClearChat={state.messages.some(m => m.role === 'user')}
        hanjaEnabled={hanjaEnabled}
        onHanjaToggle={setHanjaEnabled}
        accessMode={accessMode}
        hasKey={!!adminToken || !!geminiKey}
        onOpenAccessGate={openGateForChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar activePanel={state.activePanel} onToggle={handlePanelToggle} />
        <main
          className={`flex flex-col flex-1 overflow-hidden pb-14 md:pb-0 ${panelOpen ? 'md-panel-shift' : ''}`}
          style={{ '--panel-width': `${panelWidth}px` } as React.CSSProperties}
        >
          <div
            className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:pb-4 space-y-4"
            onScroll={(e) => {
              const el = e.currentTarget
              userScrolledUp.current = el.scrollTop < el.scrollHeight - el.clientHeight - 100
            }}
          >
            {state.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onAction={handleAction}
                onSuggestion={handleSend}
                hanjaEnabled={hanjaEnabled}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput
            onSend={handleSend}
            disabled={state.isLoading}
            mode={state.dialogueMode}
            onModeChange={(m) => setState(s => ({ ...s, dialogueMode: m }))}
          />
        </main>
      </div>
      <BottomNav
        activePanel={state.activePanel}
        onToggle={handlePanelToggle}
        onHome={handleClosePanel}
      />
      <SlidePanel
        open={panelOpen}
        title={panelTitle}
        onClose={handleClosePanel}
        width={panelWidth}
        onWidthChange={setPanelWidth}
      >
        {renderPanelBody()}
      </SlidePanel>

      {gateOpen && (
        <AccessGate
          onComplete={handleAccessComplete}
          onClose={!!(adminToken || geminiKey) ? closeGate : undefined}
          savedAccess={
            !gateForceSelect && (adminToken || geminiKey)
              ? { mode: accessMode }
              : null
          }
        />
      )}
    </div>
  )
}
