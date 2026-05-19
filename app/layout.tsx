import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','900'] })

export const metadata: Metadata = {
  title: 'AiCreatorFeed — Where AI Creators Connect',
  description: 'Follow AI creators, share image & video prompts, explore the latest AI news and tutorials.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#222222', color: '#FAF3E1', minHeight: '100vh', margin: 0, padding: 0 }}>
        <Navbar />
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 80px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
