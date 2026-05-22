import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await admin().auth.getUser(token)
    if (user) return user
  }
  return null
}

// GET — list user's bookmarks (with post data), or check if a specific post is bookmarked
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('post_id')
  const page = parseInt(searchParams.get('page') || '0')
  const limit = 12
  const db = admin()

  // Check single post
  if (postId) {
    const { data } = await db.from('bookmarks').select('id').eq('user_id', user.id).eq('post_id', postId).maybeSingle()
    return NextResponse.json({ bookmarked: !!data })
  }

  // List all bookmarks with post + user data
  const { data, error } = await db
    .from('bookmarks')
    .select(`
      id, created_at, post_id,
      post:posts!bookmarks_post_id_fkey(
        id, caption, prompt_text, media_type, image_url, video_url,
        ai_tool, tags, likes_count, comments_count, created_at, user_id,
        user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten: return posts with bookmark metadata
  const posts = (data || []).map((b: any) => ({
    ...b.post,
    bookmarked_at: b.created_at,
    bookmark_id: b.id,
  })).filter(Boolean)

  // Also get liked posts for this user to set is_liked
  const postIds = posts.map((p: any) => p.id)
  if (postIds.length > 0) {
    const { data: likes } = await db.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
    const likedSet = new Set((likes || []).map((l: any) => l.post_id))
    posts.forEach((p: any) => { p.is_liked = likedSet.has(p.id) })
  }

  return NextResponse.json({ posts, hasMore: posts.length === limit })
}

// POST — toggle bookmark (add if not bookmarked, remove if bookmarked)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { post_id } = await req.json()
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const db = admin()

  // Check if already bookmarked
  const { data: existing } = await db.from('bookmarks').select('id').eq('user_id', user.id).eq('post_id', post_id).maybeSingle()

  if (existing) {
    // Remove bookmark
    await db.from('bookmarks').delete().eq('id', existing.id)
    return NextResponse.json({ bookmarked: false })
  } else {
    // Add bookmark
    await db.from('bookmarks').insert({ user_id: user.id, post_id })
    return NextResponse.json({ bookmarked: true })
  }
}
