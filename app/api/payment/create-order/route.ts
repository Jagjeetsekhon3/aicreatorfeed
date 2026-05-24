import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getRazorpayKeys() {
  // site_settings takes priority over env vars — lets admin change without redeploy
  const { data } = await admin().from('site_settings')
    .select('key, value')
    .in('key', ['razorpay_key_id', 'razorpay_key_secret'])

  const saved: Record<string, string> = {}
  ;(data || []).forEach((s: any) => { saved[s.key] = s.value })

  const key_id = saved['razorpay_key_id'] || process.env.RAZORPAY_KEY_ID || ''
  const key_secret = saved['razorpay_key_secret'] || process.env.RAZORPAY_KEY_SECRET || ''

  if (!key_id || !key_secret || key_id.includes('your_key')) return null
  return { key_id, key_secret }
}

function buildRazorpay(key_id: string, key_secret: string) {
  return new Razorpay({ key_id, key_secret })
}

async function getPlanAmount(plan: string, customAmount?: number): Promise<{ amount: number; label: string } | null> {
  // Load prices from site_settings (admin-configurable), fall back to hardcoded defaults
  const { data } = await admin().from('site_settings').select('key, value').like('key', 'pricing_%')
  const s: Record<string, number> = {}
  ;(data || []).forEach((r: any) => {
    const key = r.key.replace('pricing_', '')
    s[key] = parseFloat(r.value) || 0
  })

  const prices: Record<string, { amount: number; label: string }> = {
    donation_99:      { amount: Math.round((s.donation_preset_1_amount || 99)   * 100), label: '₹99 Donation' },
    donation_199:     { amount: Math.round((s.donation_preset_2_amount || 199)  * 100), label: '₹199 Donation' },
    donation_499:     { amount: Math.round((s.donation_preset_3_amount || 499)  * 100), label: '₹499 Donation' },
    donation_custom:  { amount: Math.round((customAmount || 99) * 100),                 label: `₹${customAmount} Donation` },
    verified_monthly: { amount: Math.round((s.verified_monthly_price || 299)    * 100), label: 'Verified Monthly' },
    verified_yearly:  { amount: Math.round((s.verified_yearly_price  || 1999)   * 100), label: 'Verified Yearly' },
    ad_basic:         { amount: Math.round((s.ad_basic_price || 999)            * 100), label: 'Ad Basic' },
    ad_pro:           { amount: Math.round((s.ad_pro_price   || 2999)           * 100), label: 'Ad Pro' },
  }

  if (plan === 'donation_custom') {
    return { amount: Math.round((customAmount || 99) * 100), label: `₹${customAmount} Donation` }
  }
  return prices[plan] || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan, custom_amount, type, metadata = {} } = body

    const keys = await getRazorpayKeys()
    if (!keys) {
      return NextResponse.json({
        error: 'Razorpay not configured',
        setup: true,
        message: 'Add your Razorpay keys in Admin → Payments',
      }, { status: 503 })
    }

    const rzp = buildRazorpay(keys.key_id, keys.key_secret)

    // Get user if authenticated
    let userId: string | null = null
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      const { data: { user } } = await admin().auth.getUser(token)
      userId = user?.id || null
    }

    // Determine amount dynamically from settings
    let amount: number
    let label: string

    const planInfo = await getPlanAmount(plan, custom_amount)
    if (!planInfo) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    amount = planInfo.amount
    label = planInfo.label

    // Create Razorpay order
    const order = await rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: `acf_${Date.now()}`,
      notes: { plan, type, label, user_id: userId || 'guest', ...metadata },
    })

    // Save order to DB
    await admin().from('payments').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount,
      currency: 'INR',
      type,
      status: 'created',
      metadata: { plan, label, ...metadata },
    })

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: keys.key_id,
      name: 'AiCreatorFeed',
      description: label,
    })
  } catch (err: any) {
    console.error('Razorpay order error:', err)
    return NextResponse.json({ error: err.message || 'Order creation failed' }, { status: 500 })
  }
}
