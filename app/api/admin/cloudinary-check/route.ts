import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('acf_admin_token')?.value
  if (token !== `admin_${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const api_key    = process.env.CLOUDINARY_API_KEY
  const api_secret = process.env.CLOUDINARY_API_SECRET

  const missing: string[] = []
  if (!cloud_name || cloud_name === 'your-cloud-name') missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
  if (!api_key    || api_key    === 'your-api-key')    missing.push('CLOUDINARY_API_KEY')
  if (!api_secret || api_secret === 'your-api-secret') missing.push('CLOUDINARY_API_SECRET')

  if (missing.length > 0) {
    return NextResponse.json({ configured: false, missing, status: 'Missing env vars' })
  }

  // Test the connection with a ping
  try {
    cloudinary.config({ cloud_name, api_key, api_secret })
    const result = await cloudinary.api.ping()
    return NextResponse.json({
      configured: true,
      status: 'Connected',
      cloud_name,
      plan: result.status || 'ok',
    })
  } catch (err: any) {
    return NextResponse.json({
      configured: false,
      missing: [],
      status: 'Connection failed',
      error: err?.message || 'Unknown error',
    })
  }
}
