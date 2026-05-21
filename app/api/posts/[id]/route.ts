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

// DELETE post
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Verify ownership
  const { data: post } = await admin.from('posts').select('user_id').eq('id', params.id).single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.user_id !== user.id) return NextResponse.json({ error: 'Not your post' }, { status: 403 })

  await admin.from('posts').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}

// PATCH update post
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: post } = await admin.from('posts').select('user_id').eq('id', params.id).single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.user_id !== user.id) return NextResponse.json({ error: 'Not your post' }, { status: 403 })

  const { caption, prompt_text, ai_tool, tags } = await req.json()
  const { data, error } = await admin.from('posts').update({
    caption, prompt_text: prompt_text || null, ai_tool: ai_tool || null, tags: tags || [],
  }).eq('id', params.id).select('*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
