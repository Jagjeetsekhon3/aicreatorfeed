import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function admin() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
function checkAdmin() {
  const cookieStore = cookies()
  const token = cookieStore.get('acf_admin_token')?.value
  return token === `admin_${process.env.ADMIN_PASSWORD}`
}

// GET — public, no auth
export async function GET() {
  const { data, error } = await admin()
    .from('ai_tools').select('id, name, color, bg_color, sort_order, is_active')
    .eq('is_active', true).order('sort_order').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tools: data || [] })
}

// GET ALL (admin) — includes inactive
export async function HEAD() {
  if (!checkAdmin()) return new NextResponse(null, { status: 401 })
  const { data } = await admin().from('ai_tools').select('*').order('sort_order').order('name')
  return NextResponse.json({ tools: data || [] })
}

// POST — add tool
export async function POST(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, color, bg_color, sort_order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const { data, error } = await admin().from('ai_tools').insert({
    name: name.trim(), color: color || '#9a8f7a',
    bg_color: bg_color || 'rgba(255,255,255,0.07)',
    sort_order: sort_order ?? 99, is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tool: data })
}

// PATCH — edit tool
export async function PATCH(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  if (updates.name) updates.name = updates.name.trim()
  const { data, error } = await admin().from('ai_tools').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tool: data })
}

// DELETE — remove tool
export async function DELETE(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const { error } = await admin().from('ai_tools').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
