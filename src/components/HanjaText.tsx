'use client'
import { Fragment } from 'react'
import { annotateHanja } from '@/lib/data/hanja-glossary'

interface Props {
  text: string
  enabled: boolean
}

export default function HanjaText({ text, enabled }: Props) {
  if (!enabled) return <>{text}</>
  const segments = annotateHanja(text)
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'hanja' ? (
          <ruby key={i}>
            {seg.text}
            <rt className="text-[0.55em] text-[var(--clay)]">{seg.hanja}</rt>
          </ruby>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        )
      )}
    </>
  )
}
