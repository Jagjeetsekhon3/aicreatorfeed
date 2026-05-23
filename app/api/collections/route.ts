import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await admin().auth.getUser(token)
  return user
}

// GET — list user's collections (with post counts) or posts in a collection
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const collection_id = searchParams.get('collection_id')
  const db = admin()

  // List posts in a collection
  if (collection_id) {
    const { data } = await db
      .from('collection_posts')
      .select(`post_id, created_at,
        post:posts!collection_posts_post_id_fkey(
          id, caption, prompt_text, media_type, image_url, video_url,
          ai_tool, tags, likes_count, comments_count, created_at, user_id,
          user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified)
        )`)
      .eq('collection_id', collection_id)
      .order('created_at', { ascending: false })

    const posts = (data || []).map((r: any) => r.post).filter(Boolean)
    return NextResponse.json({ posts })
  }

  // List collections for a user
  if (user_id) {
    const { data } = await db
      .from('collections')
      .select('*')
      .eq('user_id', user_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    return NextResponse.json({ collections: data || [] })
  }

  return NextResponse.json({ error: 'user_id or collection_id required' }, { status: 400 })
}

// POST — create collection OR save post to collection
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const db = admin()

  // Save post to collection
  if (body.post_id && body.collection_id) {
    const { data: existing } = await db.from('collection_posts')
      .select('id').eq('collection_id', body.collection_id).eq('post_id', body.post_id).maybeSingle()

    if (existing) {
      // Remove from collection
      await db.from('collection_posts').delete().eq('id', existing.id)
      await db.from('collections').update({ post_count: db.rpc as any }).eq('id', body.collection_id)
      // Recalculate count
      const { count } = await db.from('collection_posts').select('*', { count: 'exact', head: true }).eq('collection_id', body.collection_id)
      await db.from('collections').update({ post_count: count || 0 }).eq('id', body.collection_id)
      return NextResponse.json({ saved: false })
    } else {
      await db.from('collection_posts').insert({ collection_id: body.collection_id, post_id: body.post_id, user_id: user.id })
      const { count } = await db.from('collection_posts').select('*', { count: 'exact', head: true }).eq('collection_id', body.collection_id)
      await db.from('collections').update({ post_count: count || 0 }).eq('id', body.collection_id)
      return NextResponse.json({ saved: true })
    }
  }

  // Create new collection
  if (body.name) {
    // Ensure user has a default collection
    const { data: existing } = await db.from('collections').select('id').eq('user_id', user.id).eq('is_default', true).maybeSingle()
    if (!existing && body.is_default !== false) {
      // first collection = make it default
    }
    const { data, error } = await db.from('collections').insert({
      user_id: user.id,
      name: body.name.trim(),
      description: body.description || null,
      is_default: body.is_default || false,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ collection: data })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

// PATCH — rename collection
export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id, name, description } = await req.json()
  const { data, error } = await admin().from('collections').update({ name, description }).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collection: data })
}

// DELETE — delete collection
export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await req.json()
  await admin().from('collections').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
