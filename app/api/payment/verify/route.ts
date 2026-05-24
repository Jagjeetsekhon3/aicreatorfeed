import crypto from 'crypto'
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

async function getKeySecret(): Promise<string> {
  const { data } = await admin().from('site_settings')
    .select('value').eq('key', 'razorpay_key_secret').maybeSingle()
  return data?.value || process.env.RAZORPAY_KEY_SECRET || ''
}

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, type } = await req.json()

    // Verify signature
    const secret = await getKeySecret()
    if (!secret) return NextResponse.json({ error: 'Payment secret not configured' }, { status: 500 })
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const user = await getUser(req)
    const db = admin()

    // Update payment record
    const { data: payment } = await db.from('payments')
      .update({ razorpay_payment_id, razorpay_signature, status: 'paid', updated_at: new Date().toISOString() })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()

    // ── Handle by type ──────────────────────────────────────────────────────

    if (type === 'donation' && user) {
      // Log donation, no profile change needed
      await db.from('admin_logs').insert({
        action: `Donation received from ${user.id}: ₹${(payment.amount / 100).toFixed(0)}`,
      })
    }

    if (type === 'subscription' && user) {
      const isYearly = plan?.includes('yearly')
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1))

      // Upsert subscription
      await db.from('subscriptions').upsert({
        user_id: user.id,
        plan: 'verified',
        status: 'active',
        payment_id: payment.id,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' })

      // Grant verified badge
      await db.from('profiles').update({
        is_verified: true,
        paid_verified: true,
        subscription_expires_at: expiresAt.toISOString(),
      }).eq('id', user.id)
    }

    if (type === 'ad' && user) {
      const isProPlan = plan === 'ad_pro'
      const daysActive = isProPlan ? 30 : 7
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + daysActive)

      // Create ad slot (pending review)
      await db.from('ad_slots').insert({
        user_id: user.id,
        slot: 'feed_mid',
        title: 'New Ad Campaign',
        description: '',
        link_url: 'https://',
        status: 'pending',
        budget_paise: payment.amount,
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        payment_id: payment.id,
      })
    }

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id })
  } catch (err: any) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
