import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await admin().auth.getUser(token)
  return user
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { title, description, link_url, cta_text, image_url, payment_plan } = await req.json()

  const slot = payment_plan === 'ad_pro' ? 'feed_top' : 'feed_mid'

  // Update most recent pending ad for this user
  const { data } = await admin()
    .from('ad_slots')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ error: 'No pending ad found' }, { status: 404 })

  await admin().from('ad_slots').update({
    title, description: description || null,
    link_url, cta_text: cta_text || 'Learn more',
    image_url: image_url || null,
    slot,
  }).eq('id', data.id)

  return NextResponse.json({ success: true })
}

// GET active ads for a slot
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slot = searchParams.get('slot') || 'feed_mid'

  const now = new Date().toISOString()
  const { data } = await admin()
    .from('ad_slots')
    .select('id, title, description, image_url, link_url, cta_text, slot')
    .eq('status', 'active')
    .eq('slot', slot)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ ad: data || null })
}
