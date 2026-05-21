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
