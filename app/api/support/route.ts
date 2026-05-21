import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { subject, message, email } = await req.json()
  if (!subject || !message || !email) return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await admin.from('support_tickets').insert({
    user_id: session?.user?.id || null,
    user_email: email,
    subject,
    message,
    status: 'open',
    priority: 'normal',
  })

  return NextResponse.json({ success: true })
}
