import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MILADY RUGPULL SIMULATOR',
  description: 'Deterministic safety decision simulator - 実例ベースのラグプル/ハック教育シミュレーター',
  icons: {
    icon: '/icon.png',
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
