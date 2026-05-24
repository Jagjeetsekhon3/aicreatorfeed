import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Public safe keys — never expose admin/private settings
const PUBLIC_KEYS = [
  'site_name', 'tagline', 'accent_color', 'bg_color', 'text_primary',
  'contact_email', 'contact_message',
  'social_twitter', 'social_instagram', 'social_discord', 'social_discord_label',
  'social_youtube', 'social_youtube_label', 'social_tiktok', 'social_linkedin', 'social_linkedin_label',
  'meta_title', 'meta_description', 'favicon_url',
  // Pricing
  'pricing_donation_preset_1_amount', 'pricing_donation_preset_1_label',
  'pricing_donation_preset_2_amount', 'pricing_donation_preset_2_label',
  'pricing_donation_preset_3_amount', 'pricing_donation_preset_3_label',
  'pricing_donation_page_title',      'pricing_donation_page_desc',
  'pricing_verified_monthly_price',   'pricing_verified_yearly_price',
  'pricing_ad_basic_price',           'pricing_ad_basic_days',
  'pricing_ad_pro_price',             'pricing_ad_pro_days',
  'pricing_advertise_page_title',     'pricing_advertise_page_desc',
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
