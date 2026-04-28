import type { SVGProps } from 'react'

const baseProps: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3.5 9.2c0-2.6 2.1-4.7 4.7-4.7h3.6c2.6 0 4.7 2.1 4.7 4.7v0c0 2.6-2.1 4.7-4.7 4.7H8.2l-3 2.6v-2.6h-.7" />
    </svg>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3.5 3.5" />
    </svg>
  )
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3.5 4.5h5.5a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 0-1.5-1.5H3.5z" />
      <path d="M16.5 4.5H11a1.5 1.5 0 0 0-1.5 1.5v10a1.5 1.5 0 0 1 1.5-1.5h5.5z" />
    </svg>
  )
}

export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16 4c0 6-3 11-9 12 0-6 3-11 9-12z" />
      <path d="M7 16C9 12 12 9 15 7" />
    </svg>
  )
}

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h11l-2.5-2.5M16 13H5l2.5 2.5" />
    </svg>
  )
}

export function GlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6.5 14c1.2-3.5 2.3-6.7 3.5-9.2.4-.8 1.6-.8 2 0 1.2 2.5 2.3 5.7 3.5 9.2" />
      <path d="M7.7 11.2h6.6" />
    </svg>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v1.5M10 16v1.5M3.5 10h1.5M15 10h1.5M5.4 5.4l1 1M13.6 13.6l1 1M5.4 14.6l1-1M13.6 6.4l1-1" />
    </svg>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16.5 12.3A6.5 6.5 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8z" />
    </svg>
  )
}

export function MonitorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 14v3" />
    </svg>
  )
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 7v3.5l2.5 2" />
    </svg>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7.5 9V6.5a2.5 2.5 0 0 1 5 0V9" />
    </svg>
  )
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="7.5" r="3" />
      <path d="M4 17.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    </svg>
  )
}

export function QuestionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M8.2 8a2 2 0 1 1 2.5 1.9c-.4.2-.7.6-.7 1.1v.5" />
      <circle cx="10" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}
