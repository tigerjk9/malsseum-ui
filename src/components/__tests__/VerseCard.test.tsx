import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VerseCard from '../VerseCard'
import type { VerseData } from '@/lib/types'

const verse: VerseData = {
  ref: { book: '1John', chapter: 1, verse: 9, translation: 'KRV' },
  text: '만일 우리가 우리 죄를 자백하면 저는 미쁘시고 의로우사...',
  bookNameKo: '요한일서',
}

describe('VerseCard', () => {
  it('구절 텍스트와 참조 렌더링', () => {
    render(<VerseCard verse={verse} onAction={vi.fn()} />)
    expect(screen.getByText(/만일 우리가 우리 죄를/)).toBeInTheDocument()
    expect(screen.getByText(/요한일서 1:9/)).toBeInTheDocument()
  })

  it('번역 비교 버튼 클릭', () => {
    const onAction = vi.fn()
    render(<VerseCard verse={verse} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: /번역 비교/ }))
    expect(onAction).toHaveBeenCalledWith('compare', verse.ref)
  })
})
