import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const db = admin()

  let q = db.from('tutorials').select('*').order('published_at', { ascending: false }).limit(limit)
  if (tag) q = q.contains('tags', [tag])
  if (search) q = q.ilike('title', `%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tutorials: data || [] })
}

// Admin: create tutorial
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, youtube_video_id, thumbnail_url, duration_minutes, tags } = body
    if (!title || !youtube_video_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const db = admin()
    const { data, error } = await db.from('tutorials').insert({
      title, description, youtube_video_id,
      thumbnail_url: thumbnail_url || `https://img.youtube.com/vi/${youtube_video_id}/hqdefault.jpg`,
      duration_minutes: duration_minutes || 0,
      tags: tags || [],
      published_at: new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tutorial: data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Admin: delete tutorial
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const db = admin()
    const { error } = await db.from('tutorials').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
