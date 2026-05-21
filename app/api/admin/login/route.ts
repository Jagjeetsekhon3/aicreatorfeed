import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  if (password !== adminPassword) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })

  const res = NextResponse.json({ success: true })
  res.cookies.set('acf_admin_token', `admin_${adminPassword}`, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return res
}
