import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await admin.auth.getUser(token)
    if (user) return user
  }
  return null
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { following_id, action } = await req.json()
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 })
  if (user.id === following_id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (action === 'unfollow') {
    await admin.from('follows').delete()
      .eq('follower_id', user.id)
      .eq('following_id', following_id)

    // Recalculate exact counts
    const { count: followerCount } = await admin.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', following_id)
    const { count: followingCount } = await admin.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    await admin.from('profiles').update({ followers_count: followerCount || 0 }).eq('id', following_id)
    await admin.from('profiles').update({ following_count: followingCount || 0 }).eq('id', user.id)

    return NextResponse.json({ following: false })
  }

  // Follow
  await admin.from('follows').upsert({
    follower_id: user.id,
    following_id: following_id,
  }, { onConflict: 'follower_id,following_id' })

  // Recalculate exact counts directly
  const { count: followerCount } = await admin.from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', following_id)
  const { count: followingCount } = await admin.from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user.id)

  await admin.from('profiles').update({ followers_count: followerCount || 0 }).eq('id', following_id)
  await admin.from('profiles').update({ following_count: followingCount || 0 }).eq('id', user.id)

  return NextResponse.json({ following: true })
}

// GET — check if following a user
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ following: false })

  const { searchParams } = new URL(req.url)
  const following_id = searchParams.get('following_id')
  if (!following_id) return NextResponse.json({ following: false })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin.from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', following_id)
    .maybeSingle()

  return NextResponse.json({ following: !!data })
}
