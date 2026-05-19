import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const { text, image_url, prompt_text, ai_tool, youtube_id, tags } = body

    if (!text && !image_url && !youtube_id) {
      return NextResponse.json({ error: 'Post must have text, image, or video' }, { status: 400 })
    }

    // Determine media type
    let media_type = 'text'
    if (youtube_id) media_type = 'video'
    else if (image_url) media_type = 'image'

    const { data, error } = await supabase.from('posts').insert({
      user_id: session.user.id,
      caption: text || '',
      prompt_text: prompt_text || null,
      media_type,
      image_url: image_url || null,
      video_url: youtube_id || null,
      ai_tool: ai_tool || null,
      tags: tags || [],
    }).select(`
      *,
      user:profiles(id, username, full_name, avatar_url)
    `).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Increment post count
    await supabase.from('profiles')
      .update({ posts_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', session.user.id)

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = 12
    const filter = searchParams.get('filter') || 'all' // all | image | video | text

    let query = supabase
      .from('posts')
      .select(`
        *,
        user:profiles(id, username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (filter !== 'all') query = query.eq('media_type', filter)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ posts: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
