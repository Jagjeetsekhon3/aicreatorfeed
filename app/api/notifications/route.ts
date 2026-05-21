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

function db() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Helper — create a notification (called from other API routes)
export async function createNotification({
  user_id, actor_id, type, post_id, comment_id, message
}: {
  user_id: string, actor_id: string, type: string,
  post_id?: string, comment_id?: string, message?: string
}) {
  // Don't notify yourself
  if (user_id === actor_id) return
  const admin = db()
  // Avoid duplicate notifications (same actor + type + post within 1 hour)
  if (post_id) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existing } = await admin.from('notifications')
      .select('id').eq('user_id', user_id).eq('actor_id', actor_id)
      .eq('type', type).eq('post_id', post_id).gte('created_at', oneHourAgo)
      .maybeSingle()
    if (existing) return
  }
  await admin.from('notifications').insert({ user_id, actor_id, type, post_id: post_id || null, comment_id: comment_id || null, message: message || null })
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'list'
  const admin = db()

  if (type === 'count') {
    const { count } = await admin.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false)
    return NextResponse.json({ count: count || 0 })
  }

  // Get notifications list with actor and post info
  const { data } = await admin.from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url, is_verified, is_official),
      post:posts(id, caption, image_url, media_type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ notifications: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { action } = await req.json()
  const admin = db()

  if (action === 'mark_all_read') {
    await admin.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    return NextResponse.json({ success: true })
  }

  if (action === 'mark_read') {
    const { id } = await req.json()
    await admin.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_all') {
    await admin.from('notifications').delete().eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
