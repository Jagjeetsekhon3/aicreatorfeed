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

// Payment amounts in paise (₹1 = 100)
const PLANS: Record<string, { amount: number; label: string }> = {
  donation_99:      { amount: 9900,   label: '₹99 Donation' },
  donation_199:     { amount: 19900,  label: '₹199 Donation' },
  donation_499:     { amount: 49900,  label: '₹499 Donation' },
  donation_custom:  { amount: 0,      label: 'Custom Donation' },
  verified_monthly: { amount: 29900,  label: '₹299/mo Verified' },
  verified_yearly:  { amount: 199900, label: '₹1999/yr Verified' },
  ad_basic:         { amount: 99900,  label: '₹999 Ad (7 days)' },
  ad_pro:           { amount: 299900, label: '₹2999 Ad (30 days)' },
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

    // Determine amount
    let amount: number
    let label: string
    if (plan === 'donation_custom') {
      amount = Math.round((custom_amount || 99) * 100) // custom amount in rupees → paise
      label = `₹${custom_amount} Donation`
    } else {
      const planInfo = PLANS[plan]
      if (!planInfo) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      amount = planInfo.amount
      label = planInfo.label
    }

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
