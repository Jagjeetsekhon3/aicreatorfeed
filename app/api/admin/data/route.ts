import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function checkAdmin() {
  const cookieStore = cookies()
  const token = cookieStore.get('acf_admin_token')?.value
  return token === `admin_${process.env.ADMIN_PASSWORD}`
}

function getAdmin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const admin = getAdmin()

  if (type === 'stats') {
    const [users, posts, comments, tickets] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('posts').select('id', { count: 'exact', head: true }),
      admin.from('comments').select('id', { count: 'exact', head: true }),
      admin.from('support_tickets').select('id', { count: 'exact', head: true }),
    ])
    const { data: recentUsers } = await admin.from('profiles').select('id').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    const { data: recentPosts } = await admin.from('posts').select('id').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    return NextResponse.json({
      totalUsers: users.count || 0,
      totalPosts: posts.count || 0,
      totalComments: comments.count || 0,
      totalTickets: tickets.count || 0,
      newUsersThisWeek: recentUsers?.length || 0,
      newPostsThisWeek: recentPosts?.length || 0,
    })
  }

  if (type === 'users') {
    const page = parseInt(searchParams.get('page') || '0')
    const search = searchParams.get('search') || ''
    let q = admin.from('profiles').select('*').order('created_at', { ascending: false }).range(page * 20, (page + 1) * 20 - 1)
    if (search) q = q.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
    const { data } = await q
    return NextResponse.json({ users: data || [] })
  }

  if (type === 'posts') {
    const page = parseInt(searchParams.get('page') || '0')
    const { data } = await admin.from('posts')
      .select('*, user:profiles!posts_user_id_fkey(username, full_name)')
      .order('created_at', { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1)
    return NextResponse.json({ posts: data || [] })
  }

  if (type === 'tickets') {
    const status = searchParams.get('status') || 'open'
    let q = admin.from('support_tickets').select('*, user:profiles(username, full_name)').order('created_at', { ascending: false })
    if (status !== 'all') q = q.eq('status', status)
    const { data } = await q
    return NextResponse.json({ tickets: data || [] })
  }

  if (type === 'settings') {
    const { data } = await admin.from('site_settings').select('*')
    const { data: flags } = await admin.from('feature_flags').select('*')
    return NextResponse.json({ settings: data || [], flags: flags || [] })
  }

  if (type === 'spaces_admin') {
    const { data } = await admin.from('spaces').select('*').order('is_official', { ascending: false }).order('member_count', { ascending: false })
    return NextResponse.json({ spaces: data || [] })
  }

  if (type === 'space_posts_admin') {
    const space_id = searchParams.get('space_id')
    const { data } = await admin.from('space_posts')
      .select('*, user:profiles!space_posts_user_id_fkey(username, full_name)')
      .eq('space_id', space_id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    return NextResponse.json({ posts: data || [] })
  }

  if (type === 'news_admin') {
    const { data } = await admin.from('news_items').select('*').order('published_at', { ascending: false }).limit(50)
    return NextResponse.json({ news: data || [] })
  }

  if (type === 'logs') {
    const { data } = await admin.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100)
    return NextResponse.json({ logs: data || [] })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const admin = getAdmin()
  const body = await req.json()

  if (action === 'edit_space') {
    const { space_id, display_name, description, icon, cover_color, rules, is_official } = body
    await admin.from('spaces').update({ display_name, description, icon, cover_color, rules: rules || null, is_official }).eq('id', space_id)
    await admin.from('admin_logs').insert({ action: `Admin edited space: ${display_name}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'create_space') {
    const { name, display_name, description, icon, cover_color, rules, is_official } = body
    const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await admin.from('spaces').insert({
      name: slug, display_name, description: description || null,
      icon: icon || '✨', cover_color: cover_color || '#FF6D1F',
      rules: rules || null, is_official: is_official || false,
      member_count: 0, post_count: 0,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await admin.from('admin_logs').insert({ action: `Admin created space: ${display_name}` })
    return NextResponse.json({ space: data })
  }

  if (action === 'delete_space') {
    const { data: space } = await admin.from('spaces').select('display_name').eq('id', body.space_id).single()
    await admin.from('spaces').delete().eq('id', body.space_id)
    await admin.from('admin_logs').insert({ action: `Admin deleted space: ${space?.display_name}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_space_post') {
    await admin.from('space_posts').delete().eq('id', body.post_id)
    await admin.from('admin_logs').insert({ action: `Admin deleted space post: ${body.post_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'pin_space_post') {
    await admin.from('space_posts').update({ is_pinned: body.is_pinned }).eq('id', body.post_id)
    await admin.from('admin_logs').insert({ action: `Admin ${body.is_pinned ? 'pinned' : 'unpinned'} space post: ${body.post_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'publish_news') {
    const { title, summary, source_name, source_url, image_url, tags } = body
    await admin.from('news_items').insert({ title, summary, source_name, source_url, image_url: image_url || null, tags: tags || [] })
    await admin.from('admin_logs').insert({ action: `Published news: ${title}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_news') {
    await admin.from('news_items').delete().eq('id', body.news_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'update_setting') {
    await admin.from('site_settings').upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() })
    await admin.from('admin_logs').insert({ action: `Updated setting: ${body.key} = ${body.value}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'toggle_flag') {
    await admin.from('feature_flags').update({ enabled: body.enabled, updated_at: new Date().toISOString() }).eq('name', body.name)
    await admin.from('admin_logs').insert({ action: `Feature flag ${body.name} set to ${body.enabled}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_post') {
    await admin.from('posts').delete().eq('id', body.post_id)
    await admin.from('admin_logs').insert({ action: `Admin deleted post: ${body.post_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'toggle_verified') {
    await admin.from('profiles').update({ is_verified: body.is_verified, verified_at: body.is_verified ? new Date().toISOString() : null }).eq('id', body.user_id)
    await admin.from('admin_logs').insert({ action: `Admin ${body.is_verified ? 'verified' : 'unverified'} user: ${body.user_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'ban_user') {
    await admin.auth.admin.updateUserById(body.user_id, { ban_duration: body.unban ? 'none' : '87600h' })
    await admin.from('admin_logs').insert({ action: `Admin ${body.unban ? 'unbanned' : 'banned'} user: ${body.user_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_user') {
    await admin.auth.admin.deleteUser(body.user_id)
    await admin.from('admin_logs').insert({ action: `Admin deleted user: ${body.user_id}` })
    return NextResponse.json({ success: true })
  }

  if (action === 'reply_ticket') {
    await admin.from('support_tickets').update({ admin_reply: body.reply, status: 'resolved', updated_at: new Date().toISOString() }).eq('id', body.ticket_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'update_ticket_status') {
    await admin.from('support_tickets').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', body.ticket_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
