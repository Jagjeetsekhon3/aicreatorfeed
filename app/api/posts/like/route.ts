import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { post_id } = await req.json()

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', session.user.id)
    .eq('post_id', post_id)
    .single()

  if (existing) {
    // Unlike
    await supabase.from('likes').delete()
      .eq('user_id', session.user.id).eq('post_id', post_id)
    return NextResponse.json({ liked: false })
  } else {
    // Like
    await supabase.from('likes').insert({ user_id: session.user.id, post_id })
    return NextResponse.json({ liked: true })
  }
}
