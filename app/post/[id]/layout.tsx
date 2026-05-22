import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: post } = await supabase
    .from('posts')
    .select('caption, prompt_text, ai_tool, image_url, user:profiles!posts_user_id_fkey(full_name, username)')
    .eq('id', params.id)
    .single()

  if (!post) return { title: 'Post not found' }

  const user = post.user as any
  const title = post.caption
    ? `${post.caption.slice(0, 60)}${post.caption.length > 60 ? '...' : ''} — ${user?.full_name}`
    : `${user?.full_name}'s post on AiCreatorFeed`

  const description = post.prompt_text
    ? `AI Prompt${post.ai_tool ? ` (${post.ai_tool})` : ''}: "${post.prompt_text.slice(0, 120)}..."`
    : post.caption || `View this post by ${user?.full_name} on AiCreatorFeed`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.image_url ? [{ url: post.image_url, width: 1200, height: 630 }] : ['/og-image.png'],
    },
    twitter: {
      card: post.image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      images: post.image_url ? [post.image_url] : ['/og-image.png'],
    },
  }
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
