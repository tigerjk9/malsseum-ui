import type { Metadata } from 'next'
import { Inter, Noto_Serif_KR } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '말씀의 길',
  description: '성경 속 진리를 대화로 탐구합니다',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSerifKR.variable}`}>
      <body>{children}</body>
    </html>
  )
}
