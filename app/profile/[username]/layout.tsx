import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

type Props = { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, bio, avatar_url, followers_count, posts_count')
    .eq('username', params.username)
    .single()

  if (!profile) {
    return { title: 'Profile not found' }
  }

  const title = `${profile.full_name} (@${profile.username})`
  const description = profile.bio
    ? `${profile.bio} — ${profile.followers_count || 0} followers on AiCreatorFeed`
    : `Check out ${profile.full_name}'s AI prompts and posts on AiCreatorFeed`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url, width: 400, height: 400 }] : ['/og-image.png'],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
    },
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
