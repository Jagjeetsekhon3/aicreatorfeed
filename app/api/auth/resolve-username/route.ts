import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Called by login page to resolve username → email
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    const supabase = createClient()

    // Look up the profile to get the user ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username.toLowerCase())
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'No account found with that username' }, { status: 404 })
    }

    // Get email from auth.users via service role
    const { createClient: createAdmin } = await import('@supabase/supabase-js')
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id)
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: 'Could not resolve account' }, { status: 404 })
    }

    return NextResponse.json({ email: userData.user.email })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
