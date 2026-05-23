import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Public safe keys — never expose admin/private settings
const PUBLIC_KEYS = [
  'site_name', 'tagline', 'accent_color', 'bg_color', 'text_primary',
  'contact_email', 'contact_message',
  'social_twitter', 'social_instagram', 'social_discord', 'social_discord_label',
  'social_youtube', 'social_youtube_label', 'social_tiktok', 'social_linkedin', 'social_linkedin_label',
  'meta_title', 'meta_description', 'favicon_url',
]

export const revalidate = 60

export async function GET() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await db.from('site_settings').select('key, value').in('key', PUBLIC_KEYS)
    const settings = (data || []).reduce((acc: Record<string, string>, row) => {
      acc[row.key] = row.value
      return acc
    }, {})
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ settings: {} })
  }
}
