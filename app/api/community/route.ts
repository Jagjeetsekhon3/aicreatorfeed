import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUser(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''))
    if (user) return user
  }
  const { data: { session } } = await createClient().auth.getSession()
  return session?.user ?? null
}

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const db = admin()

  if (type === 'spaces') {
    const { data } = await db.from('spaces').select('*').order('is_official', { ascending: false }).order('member_count', { ascending: false })
    return NextResponse.json({ spaces: data || [] })
  }

  if (type === 'space') {
    const name = searchParams.get('name')
    const { data } = await db.from('spaces').select('*, creator:profiles!spaces_created_by_fkey(username, full_name, avatar_url)').eq('name', name).single()
    return NextResponse.json({ space: data })
  }

  if (type === 'posts') {
    const space_id = searchParams.get('space_id')
    const sort = searchParams.get('sort') || 'new' // new | top
    const page = parseInt(searchParams.get('page') || '0')
    const limit = 20
    let q = db.from('space_posts')
      .select('*, user:profiles!space_posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)')
      .eq('space_id', space_id)
      .range(page * limit, (page + 1) * limit - 1)
    if (sort === 'top') q = q.order('upvotes', { ascending: false })
    else q = q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    const { data } = await q
    return NextResponse.json({ posts: data || [] })
  }

  if (type === 'post') {
    const post_id = searchParams.get('post_id')
    const { data: post } = await db.from('space_posts')
      .select('*, user:profiles!space_posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official), space:spaces(name, display_name, icon)')
      .eq('id', post_id).single()
    const { data: replies } = await db.from('space_replies')
      .select('*, user:profiles!space_replies_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)')
      .eq('post_id', post_id).is('parent_id', null).order('upvotes', { ascending: false })
    return NextResponse.json({ post, replies: replies || [] })
  }

  if (type === 'membership') {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ joined: [] })
    const { data } = await db.from('space_members').select('space_id, role').eq('user_id', user.id)
    return NextResponse.json({ joined: data || [] })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const db = admin()
  const body = await req.json()

  if (action === 'create_space') {
    const { name, display_name, description, icon, cover_color } = body
    if (!name || !display_name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    const { data, error } = await db.from('spaces').insert({ name: slug, display_name, description, icon: icon || '💬', cover_color: cover_color || 'var(--color-primary)', created_by: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-join as owner
    await db.from('space_members').insert({ space_id: data.id, user_id: user.id, role: 'owner' })
    await db.from('spaces').update({ member_count: 1 }).eq('id', data.id)
    return NextResponse.json({ space: data })
  }

  if (action === 'join') {
    const { space_id } = body
    await db.from('space_members').upsert({ space_id, user_id: user.id, role: 'member' }, { onConflict: 'space_id,user_id' })
    const { count } = await db.from('space_members').select('*', { count: 'exact', head: true }).eq('space_id', space_id)
    await db.from('spaces').update({ member_count: count || 0 }).eq('id', space_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'leave') {
    const { space_id } = body
    await db.from('space_members').delete().eq('space_id', space_id).eq('user_id', user.id)
    const { count } = await db.from('space_members').select('*', { count: 'exact', head: true }).eq('space_id', space_id)
    await db.from('spaces').update({ member_count: count || 0 }).eq('id', space_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'create_post') {
    const { space_id, title, content } = body
    if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    const { data, error } = await db.from('space_posts').insert({ space_id, user_id: user.id, title: title.trim(), content: content.trim() })
      .select('*, user:profiles!space_posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { count } = await db.from('space_posts').select('*', { count: 'exact', head: true }).eq('space_id', space_id)
    await db.from('spaces').update({ post_count: count || 0 }).eq('id', space_id)
    return NextResponse.json({ post: data })
  }

  if (action === 'reply') {
    const { post_id, content, parent_id } = body
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    const { data, error } = await db.from('space_replies').insert({ post_id, user_id: user.id, content: content.trim(), parent_id: parent_id || null })
      .select('*, user:profiles!space_replies_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { count } = await db.from('space_replies').select('*', { count: 'exact', head: true }).eq('post_id', post_id)
    await db.from('space_posts').update({ reply_count: count || 0 }).eq('id', post_id)
    return NextResponse.json({ reply: data })
  }

  if (action === 'vote_post') {
    const { post_id } = body
    const { data: existing } = await db.from('space_post_votes').select('post_id').eq('post_id', post_id).eq('user_id', user.id).maybeSingle()
    if (existing) {
      await db.from('space_post_votes').delete().eq('post_id', post_id).eq('user_id', user.id)
    } else {
      await db.from('space_post_votes').insert({ post_id, user_id: user.id })
    }
    const { count } = await db.from('space_post_votes').select('*', { count: 'exact', head: true }).eq('post_id', post_id)
    await db.from('space_posts').update({ upvotes: count || 0 }).eq('id', post_id)
    return NextResponse.json({ voted: !existing, count: count || 0 })
  }

  if (action === 'vote_reply') {
    const { reply_id } = body
    const { data: existing } = await db.from('space_reply_votes').select('reply_id').eq('reply_id', reply_id).eq('user_id', user.id).maybeSingle()
    if (existing) {
      await db.from('space_reply_votes').delete().eq('reply_id', reply_id).eq('user_id', user.id)
    } else {
      await db.from('space_reply_votes').insert({ reply_id, user_id: user.id })
    }
    const { count } = await db.from('space_reply_votes').select('*', { count: 'exact', head: true }).eq('reply_id', reply_id)
    await db.from('space_replies').update({ upvotes: count || 0 }).eq('id', reply_id)
    return NextResponse.json({ voted: !existing, count: count || 0 })
  }

  if (action === 'delete_post') {
    const { post_id } = body
    const { data: post } = await db.from('space_posts').select('user_id, space_id').eq('id', post_id).single()
    if (!post || post.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await db.from('space_posts').delete().eq('id', post_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
