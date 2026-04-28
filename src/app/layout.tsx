import type { Metadata } from 'next'
import { IBM_Plex_Sans_KR, Noto_Serif_KR } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const plexSansKR = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex-kr',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
})

const BASE_URL = 'https://malsseum-ui.vercel.app'

export const metadata: Metadata = {
  title: '말씀의 길 (VERBUM)',
  description: '하나님께 더 가까이 나아가도록 돕는 작은 도구입니다. 한글 성경 31,103구절에서 질문에 가장 가까운 말씀을 찾습니다.',
  openGraph: {
    title: '말씀의 길 (VERBUM)',
    description: '하나님께 더 가까이 나아가도록 돕는 작은 도구입니다. 한글 성경 31,103구절에서 질문에 가장 가까운 말씀을 찾습니다.',
    url: BASE_URL,
    siteName: '말씀의 길',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 2848,
        height: 1504,
        alt: '말씀의 길 (VERBUM) — 한지 미감의 성경 대화형 웹앱',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '말씀의 길 (VERBUM)',
    description: '하나님께 더 가까이 나아가도록 돕는 작은 도구입니다.',
    images: [`${BASE_URL}/og-image.png`],
  },
}

const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('verbum-theme')||'system';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${plexSansKR.variable} ${notoSerifKR.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
