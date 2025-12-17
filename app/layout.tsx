import type { Metadata, Viewport } from 'next'
import './globals.css'

const APP_URL = 'https://milady-rugpull-simulator.vercel.app'

export const metadata: Metadata = {
  title: 'MILADY RUGPULL SIMULATOR',
  description: 'Deterministic safety decision simulator - 実例ベースのラグプル/ハック教育シミュレーター',
  icons: {
    icon: '/icon.png',
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_URL}/og.png`,
      button: {
        title: 'Launch RUGPULL SIM',
        action: {
          type: 'launch_miniapp',
          name: 'MILADY RUGPULL SIMULATOR',
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: '#000000',
        },
      },
    }),
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <main className="min-h-screen bg-black">
          {children}
        </main>
      </body>
    </html>
  )
}
