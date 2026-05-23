import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

// GET comments for a post (threaded: top-level + replies)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const post_id = searchParams.get('post_id')
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const db = admin()
  const { data, error } = await db
    .from('comments')
    .select('*, user:profiles!comments_user_id_fkey(id, username, full_name, avatar_url, is_verified)')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build threaded structure: top-level comments with replies nested
  const all = data || []
  const top = all.filter(c => !c.parent_id)
  const replies = all.filter(c => !!c.parent_id)

  const threaded = top.map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_id === c.id),
  }))

  return NextResponse.json({ comments: threaded })
}

// POST new comment or reply
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { post_id, content, parent_id } = await req.json()
  if (!post_id || !content?.trim()) return NextResponse.json({ error: 'post_id and content required' }, { status: 400 })

  const db = admin()
  const { data, error } = await db
    .from('comments')
    .insert({ post_id, user_id: user.id, content: content.trim(), parent_id: parent_id || null })
    .select('*, user:profiles!comments_user_id_fkey(id, username, full_name, avatar_url, is_verified)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify post owner (only for top-level comments)
  if (!parent_id) {
    const { data: post } = await db.from('posts').select('user_id').eq('id', post_id).single()
    if (post?.user_id && post.user_id !== user.id) {
      try {
        const { createNotification } = await import('@/lib/notifications')
        await createNotification({ user_id: post.user_id, actor_id: user.id, type: 'comment', post_id, comment_id: data.id, message: content.trim().slice(0, 100) })
      } catch {}
    }
  }

  // Notify parent comment owner on reply
  if (parent_id) {
    const { data: parent } = await db.from('comments').select('user_id').eq('id', parent_id).single()
    if (parent?.user_id && parent.user_id !== user.id) {
      try {
        const { createNotification } = await import('@/lib/notifications')
        await createNotification({ user_id: parent.user_id, actor_id: user.id, type: 'comment', post_id, comment_id: data.id, message: content.trim().slice(0, 100) })
      } catch {}
    }
  }

  return NextResponse.json({ comment: { ...data, replies: [] } })
}

// DELETE comment
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { comment_id } = await req.json()
  await admin().from('comments').delete().eq('id', comment_id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
