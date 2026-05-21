import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await admin.auth.getUser(token)
    if (user) return user
  }
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

// GET comments for a post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const post_id = searchParams.get('post_id')
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await admin
    .from('comments')
    .select('*, user:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data || [] })
}

// POST new comment
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { post_id, content } = await req.json()
  if (!post_id || !content?.trim()) return NextResponse.json({ error: 'post_id and content required' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await admin
    .from('comments')
    .insert({ post_id, user_id: user.id, content: content.trim() })
    .select('*, user:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify post owner
  const { data: post } = await admin.from('posts').select('user_id, caption').eq('id', post_id).single()
  if (post?.user_id && post.user_id !== user.id) {
    const { createNotification } = await import('@/lib/notifications')
    await createNotification({ user_id: post.user_id, actor_id: user.id, type: 'comment', post_id, comment_id: data.id, message: content.trim().slice(0, 100) })
  }

  return NextResponse.json({ comment: data })
}

// DELETE comment
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { comment_id } = await req.json()
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await admin.from('comments').delete().eq('id', comment_id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
