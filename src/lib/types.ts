export type TranslationCode = 'KRV' | 'RNKSV' | 'NIV' | 'ESV' | 'KJV' | 'WEB'

export interface VerseRef {
  book: string
  chapter: number
  verse: number
  translation: TranslationCode
}

export interface VerseData {
  ref: VerseRef
  text: string
  bookNameKo: string
}

export type MessageRole = 'user' | 'assistant'

export interface SuggestionChip {
  label: string
  prompt: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  rawContent?: string
  verses: VerseData[]
  suggestions: SuggestionChip[]
  isStreaming?: boolean
}

export type PanelType = 'none' | 'search' | 'browse' | 'themes' | 'compare' | 'original' | 'history'

export interface SavedConversation {
  id: string
  title: string
  messages: ChatMessage[]
  savedAt: number
  dialogueMode: DialogueMode | null
}

export type DialogueMode = 'inductive' | 'free'

export interface AppState {
  messages: ChatMessage[]
  activePanel: PanelType
  activePanelVerse: VerseRef | null
  translation: TranslationCode
  isLoading: boolean
  error: string | null
  dialogueMode: DialogueMode
}

export interface VerseApiResponse {
  text: string
  bookNameKo: string
  ref: VerseRef
}

export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'verse_ref'; ref: string }
  | { type: 'suggestions'; chips: SuggestionChip[] }
  | { type: 'done' }
  | { type: 'error'; message: string }
