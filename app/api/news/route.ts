import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '12')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')
  const db = admin()

  let q = db.from('news_items').select('*').order('published_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1)
  if (tag) q = q.contains('tags', [tag])
  if (search) q = q.ilike('title', `%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ news: data || [] })
}
