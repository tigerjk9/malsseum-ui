'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage, AppState, PanelType, VerseRef, VerseData } from '@/lib/types'
import { DEFAULT_TRANSLATION } from '@/lib/constants'
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

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '안녕하세요. 저는 말씀 길잡이입니다.\n어떤 말씀이나 주제에 대해 함께 나눠보고 싶으신가요?',
  verses: [],
  suggestions: [
    { label: '용서에 대해', prompt: '용서에 대해 알고 싶어요' },
    { label: '소망의 말씀', prompt: '소망에 대한 말씀을 찾고 싶어요' },
    { label: '오늘의 위로', prompt: '오늘 마음이 힘드네요. 위로의 말씀이 필요해요' },
  ],
}

const PANEL_TITLES: Record<Exclude<PanelType, 'none'>, string> = {
  search: '검색',
  browse: '탐독',
  themes: '묵상',
  compare: '번역 비교',
  original: '원어',
}

export default function ChatInterface() {
  const [state, setState] = useState<AppState>({
    messages: [WELCOME_MESSAGE],
    activePanel: 'none',
    activePanelVerse: null,
    translation: DEFAULT_TRANSLATION,
    isLoading: false,
    error: null,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...state.messages, userMsg].map(m => ({
            id: m.id, role: m.role, content: m.rawContent ?? m.content,
            verses: [], suggestions: [],
          })),
        }),
      })

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
  }, [state.messages])

  const handlePanelToggle = (panel: PanelType) => {
    setState(s => ({ ...s, activePanel: s.activePanel === panel ? 'none' : panel }))
  }

  const handleAction = (panel: PanelType, ref: VerseRef) => {
    setState(s => ({ ...s, activePanel: panel, activePanelVerse: ref }))
  }

  const handleNewChat = () => {
    setState(s => ({
      ...s,
      messages: [WELCOME_MESSAGE],
      activePanel: 'none',
      activePanelVerse: null,
      error: null,
    }))
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
        return <SearchPanel onPickVerse={handlePickVerse} />
      case 'browse':
        return <BrowsePanel onPickVerse={handlePickVerse} translation={state.translation} />
      case 'themes':
        return (
          <ThemesPanel
            onPickTheme={(prompt) => {
              setState(s => ({ ...s, activePanel: 'none' }))
              handleSend(prompt)
            }}
          />
        )
      case 'original':
        return (
          <p className="text-[0.85rem] text-[var(--ink-medium)] italic">
            원어 분석은 다음 단계에서 준비됩니다.
          </p>
        )
      default:
        return null
    }
  }

  const panelOpen = state.activePanel !== 'none'
  const panelTitle =
    state.activePanel !== 'none' ? PANEL_TITLES[state.activePanel] : ''

  return (
    <div className="flex flex-col h-screen bg-[var(--hanji-warm)]">
      <TopBar
        translation={state.translation}
        onTranslationChange={(t) => setState(s => ({ ...s, translation: t }))}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-1 overflow-hidden">
        <IconSidebar activePanel={state.activePanel} onToggle={handlePanelToggle} />
        <main
          className={`flex flex-col flex-1 overflow-hidden transition-[margin] duration-200 ${
            panelOpen ? 'md:mr-[280px]' : ''
          }`}
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
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <ChatInput onSend={handleSend} disabled={state.isLoading} />
        </main>
      </div>
      <BottomNav
        activePanel={state.activePanel}
        onToggle={handlePanelToggle}
        onHome={handleClosePanel}
      />
      <SlidePanel open={panelOpen} title={panelTitle} onClose={handleClosePanel}>
        {renderPanelBody()}
      </SlidePanel>
    </div>
  )
}
