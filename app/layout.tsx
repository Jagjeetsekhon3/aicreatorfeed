import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','900'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aicreatorfeed.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AiCreatorFeed — Where AI Creators Connect',
    template: '%s | AiCreatorFeed',
  },
  description: 'Follow AI creators, share image & video prompts, discover AI tools, news, and tutorials. The community for AI artists and creators.',
  keywords: ['AI creators', 'AI prompts', 'Midjourney', 'Stable Diffusion', 'AI art', 'AI community', 'AI tutorials', 'prompt engineering'],
  authors: [{ name: 'AiCreatorFeed' }],
  creator: 'AiCreatorFeed',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'AiCreatorFeed',
    title: 'AiCreatorFeed — Where AI Creators Connect',
    description: 'Follow AI creators, share image & video prompts, discover AI tools, news, and tutorials.',
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: 'AiCreatorFeed — Where AI Creators Connect',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AiCreatorFeed — Where AI Creators Connect',
    description: 'Follow AI creators, share image & video prompts, discover AI tools, news, and tutorials.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#222222', color: '#FAF3E1', minHeight: '100vh', margin: 0, padding: 0 }}>
        <AuthProvider>
          <Navbar />
          <main className="main-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 80px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
