import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function db() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const type = searchParams.get('type') || 'all' // all | users | posts | spaces | news | tutorials | tags
  const page = parseInt(searchParams.get('page') || '0')
  const limit = 10

  if (!q || q.length < 1) return NextResponse.json({ results: { users: [], posts: [], spaces: [], news: [], tutorials: [], tags: [] } })

  const supabase = db()
  const results: Record<string, any[]> = { users: [], posts: [], spaces: [], news: [], tutorials: [], tags: [] }

  await Promise.all([
    // Users
    (type === 'all' || type === 'users') && supabase
      .from('profiles').select('id, username, full_name, avatar_url, bio, followers_count, is_verified, is_official')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,bio.ilike.%${q}%`)
      .order('followers_count', { ascending: false })
      .limit(type === 'all' ? 4 : limit)
      .then(({ data }) => { if (data) results.users = data }),

    // Posts
    (type === 'all' || type === 'posts') && supabase
      .from('posts')
      .select('id, caption, prompt_text, media_type, image_url, ai_tool, tags, likes_count, created_at, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)')
      .or(`caption.ilike.%${q}%,prompt_text.ilike.%${q}%,ai_tool.ilike.%${q}%`)
      .order('likes_count', { ascending: false })
      .limit(type === 'all' ? 4 : limit)
      .then(({ data }) => { if (data) results.posts = data }),

    // Spaces
    (type === 'all' || type === 'spaces') && supabase
      .from('spaces').select('id, name, display_name, description, icon, cover_color, member_count, is_official')
      .or(`display_name.ilike.%${q}%,description.ilike.%${q}%,name.ilike.%${q}%`)
      .order('member_count', { ascending: false })
      .limit(type === 'all' ? 3 : limit)
      .then(({ data }) => { if (data) results.spaces = data }),

    // News
    (type === 'all' || type === 'news') && supabase
      .from('news_items').select('id, title, summary, source_name, source_url, published_at, tags')
      .or(`title.ilike.%${q}%,summary.ilike.%${q}%,source_name.ilike.%${q}%`)
      .order('published_at', { ascending: false })
      .limit(type === 'all' ? 3 : limit)
      .then(({ data }) => { if (data) results.news = data }),

    // Tutorials
    (type === 'all' || type === 'tutorials') && supabase
      .from('tutorials').select('id, title, description, youtube_video_id, duration_minutes, views_count, tags')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order('views_count', { ascending: false })
      .limit(type === 'all' ? 3 : limit)
      .then(({ data }) => { if (data) results.tutorials = data }),

    // Tag search (posts with matching tags)
    (type === 'all' || type === 'tags') && supabase
      .from('posts')
      .select('id, caption, image_url, media_type, tags, likes_count, user:profiles!posts_user_id_fkey(username, full_name, avatar_url)')
      .contains('tags', [q.toLowerCase().replace(/^#/, '')])
      .order('likes_count', { ascending: false })
      .limit(type === 'all' ? 3 : limit)
      .then(({ data }) => { if (data) results.tags = data }),
  ].filter(Boolean))

  const total = Object.values(results).flat().length
  return NextResponse.json({ results, total, query: q })
}
