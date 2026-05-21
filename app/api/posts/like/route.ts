import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: { user } } = await admin.auth.getUser(token)
      userId = user?.id ?? null
    }

    if (!userId) {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id ?? null
    }

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { post_id } = await req.json()
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: existing } = await admin.from('likes').select('post_id').eq('user_id', userId).eq('post_id', post_id).single()

    if (existing) {
      await admin.from('likes').delete().eq('user_id', userId).eq('post_id', post_id)
      return NextResponse.json({ liked: false })
    } else {
      await admin.from('likes').insert({ user_id: userId, post_id })
      // Notify post owner
      const { data: post } = await admin.from('posts').select('user_id').eq('id', post_id).single()
      if (post?.user_id && post.user_id !== userId) {
        const { createNotification } = await import('@/app/api/notifications/route')
        await createNotification({ user_id: post.user_id, actor_id: userId, type: 'like', post_id })
      }
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
