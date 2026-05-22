import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { AuthProvider } from '@/lib/auth-context'
import { createClient } from '@supabase/supabase-js'

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','900'] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aicreatorfeed.com'

async function getSiteSettings() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase.from('site_settings').select('key, value')
    if (!data) return {}
    return data.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc }, {})
  } catch { return {} }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  const title = s.meta_title || 'AiCreatorFeed — Where AI Creators Connect'
  const description = s.meta_description || 'Follow AI creators, share image & video prompts, discover AI tools, news, and tutorials. The community for AI artists and creators.'
  const keywords = s.meta_keywords ? s.meta_keywords.split(',').map((k: string) => k.trim()) : ['AI creators', 'AI prompts', 'Midjourney', 'Stable Diffusion', 'AI art', 'AI community', 'AI tutorials', 'prompt engineering']
  const ogTitle = s.og_title || title
  const ogDesc = s.og_description || description
  const faviconUrl = s.favicon_url || null

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: title,
      template: '%s | AiCreatorFeed',
    },
    description,
    keywords,
    authors: [{ name: 'AiCreatorFeed' }],
    creator: 'AiCreatorFeed',
    icons: faviconUrl ? {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    } : {
      icon: '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: APP_URL,
      siteName: 'AiCreatorFeed',
      title: ogTitle,
      description: ogDesc,
      images: [{ url: '/api/og', width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDesc,
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
