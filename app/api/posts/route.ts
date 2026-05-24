import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(req: NextRequest) {
  // Try Authorization header first (most reliable on Vercel)
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: { user } } = await admin.auth.getUser(token)
    if (user) return user
  }
  // Fallback to cookie-based session
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const supabase = createClient()
    const body = await req.json()
    const { text, image_url, images, prompt_text, ai_tool, ai_tools, youtube_id, tags } = body

    // images = [{url, prompt_text, ai_tool}, ...] for carousel posts
    const primaryImage = image_url || (images && images[0]?.url) || null

    if (!text && !primaryImage && !youtube_id) {
      return NextResponse.json({ error: 'Post must have text, image, or video' }, { status: 400 })
    }

    let media_type = 'text'
    if (youtube_id) media_type = 'video'
    else if (primaryImage) media_type = 'image'

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await admin.from('posts').insert({
      user_id: user.id,
      caption: text || '',
      prompt_text: prompt_text || (images?.[0]?.prompt_text) || null,
      media_type,
      image_url: primaryImage,
      images: images && images.length > 0 ? images : [],
      video_url: youtube_id || null,
      ai_tool: ai_tool || (images?.[0]?.ai_tool) || null,
      ai_tools: ai_tools || [],
      tags: tags || [],
    }).select(`*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)`).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
      .select(`*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)`)
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
