import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/feed'
  const code = searchParams.get('code')

  const supabase = createClient()

  // Handle email confirmation (token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Handle OAuth / magic link (code flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Something went wrong — send to login with message
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
