'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import RazorpayButton from '@/components/ui/RazorpayButton'
import Link from 'next/link'

const PLANS = [
  {
    id: 'verified_monthly',
    label: 'Monthly',
    price: 299,
    period: '/month',
    tag: 'Flexible',
    features: ['✓ Orange verified badge ✓', '✓ Priority in search results', '✓ Verified creator profile', '✓ Monthly billed'],
  },
  {
    id: 'verified_yearly',
    label: 'Yearly',
    price: 1999,
    period: '/year',
    tag: 'Save 44%',
    popular: true,
    features: ['✓ Orange verified badge ✓', '✓ Priority in search results', '✓ Verified creator profile', '✓ 2 months free'],
  },
]

export default function VerifyPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('verified_yearly')
  const [accessToken, setAccessToken] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.push('/auth/login?redirect=/verify'); return }
      setAccessToken(data.session.access_token)
      setUser(data.session.user)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
      setProfile(p)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  if (profile?.paid_verified || profile?.is_verified) return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>✓</div>
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FAF3E1', marginBottom: '10px' }}>Already verified!</h1>
      <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7, marginBottom: '10px' }}>
        Your profile already has the verified badge.
      </p>
      {profile.subscription_expires_at && (
        <p style={{ color: '#9a8f7a', fontSize: '13px', marginBottom: '28px' }}>
          Subscription active until: <strong style={{ color: '#FAF3E1' }}>{new Date(profile.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
        </p>
      )}
      <Link href={`/profile/${profile.username}`} style={{ display: 'inline-block', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none' }}>
        View your profile →
      </Link>
    </div>
  )

  if (success) return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FF6D1F', marginBottom: '10px' }}>You're verified!</h1>
      <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
        Your orange ✓ badge is now live on your profile. Welcome to the verified creator community!
      </p>
      <Link href={`/profile/${profile?.username}`} style={{ display: 'inline-block', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none' }}>
        View your profile →
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto', padding: '0 16px 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.2)', borderRadius: '999px', padding: '6px 16px', marginBottom: '16px' }}>
          <span style={{ color: '#FF6D1F', fontWeight: 900 }}>✓</span>
          <span style={{ color: '#FF6D1F', fontSize: '12px', fontWeight: 700 }}>VERIFIED CREATOR</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#FAF3E1', marginBottom: '8px' }}>Get Verified</h1>
        <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7 }}>
          Stand out with an orange verified badge. Show the community you're a serious AI creator.
        </p>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px', animation: 'fadeIn 0.35s ease' }}>
        {PLANS.map(plan => (
          <div key={plan.id} onClick={() => setSelected(plan.id)}
            style={{ background: '#2f2f2f', border: `2px solid ${selected === plan.id ? '#FF6D1F' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#FF6D1F', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>BEST VALUE</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selected === plan.id ? '#FF6D1F' : 'rgba(255,255,255,0.2)'}`, background: selected === plan.id ? '#FF6D1F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected === plan.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1' }}>{plan.label}</span>
              <span style={{ fontSize: '10px', background: plan.popular ? 'rgba(255,109,31,0.15)' : 'rgba(255,255,255,0.06)', color: plan.popular ? '#FF6D1F' : '#9a8f7a', padding: '2px 7px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 600 }}>{plan.tag}</span>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#FAF3E1' }}>₹{plan.price.toLocaleString()}</span>
              <span style={{ fontSize: '13px', color: '#9a8f7a' }}>{plan.period}</span>
            </div>
            {plan.features.map(f => <p key={f} style={{ fontSize: '12px', color: '#9a8f7a', margin: '4px 0' }}>{f}</p>)}
          </div>
        ))}
      </div>

      {/* Pay button */}
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {(() => {
          const plan = PLANS.find(p => p.id === selected)!
          return (
            <RazorpayButton
              plan={selected}
              type="subscription"
              label={`Verified ${plan.label} - ₹${plan.price}`}
              amount={plan.price}
              accessToken={accessToken}
              onSuccess={() => setSuccess(true)}
            >
              ✓ Get verified — ₹{plan?.price.toLocaleString()}/{selected.includes('yearly') ? 'year' : 'month'}
            </RazorpayButton>
          )
        })()}
        <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '10px' }}>
          Secured by Razorpay · Cancel anytime · Badge active immediately after payment
        </p>
      </div>
    </div>
  )
}
