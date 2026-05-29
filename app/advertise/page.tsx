'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import RazorpayButton from '@/components/ui/RazorpayButton'
import { usePricingSettings } from '@/lib/usePricingSettings'

export default function AdvertisePage() {
  const router = useRouter()
  const { pricing } = usePricingSettings()
  const [selected, setSelected] = useState('ad_pro')
  const [accessToken, setAccessToken] = useState('')
  const [step, setStep] = useState<'plans' | 'setup' | 'success'>('plans')
  const [paymentId, setPaymentId] = useState('')
  const [adForm, setAdForm] = useState({ title: '', description: '', link_url: '', cta_text: 'Learn more', image_url: '' })
  const [saving, setSaving] = useState(false)

  const AD_PLANS = [
    {
      id: 'ad_basic',
      label: `${pricing.ad_basic_days}-Day Basic`,
      price: pricing.ad_basic_price,
      days: pricing.ad_basic_days,
      slot: 'Feed — mid position',
      impressions: '~5,000',
      features: ['Feed mid placement', '~5,000 impressions', `${pricing.ad_basic_days} days duration`, 'Image + link + CTA button'],
    },
    {
      id: 'ad_pro',
      label: `${pricing.ad_pro_days}-Day Pro`,
      price: pricing.ad_pro_price,
      days: pricing.ad_pro_days,
      slot: 'Feed top + Explore',
      impressions: '~25,000',
      popular: true,
      features: ['Feed top + Explore page', '~25,000 impressions', `${pricing.ad_pro_days} days duration`, 'Image + link + CTA button', 'Performance analytics'],
    },
  ]

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/auth/login?redirect=/advertise'); return }
      setAccessToken(data.session.access_token)
    })
  }, [])

  async function saveAdDetails() {
    if (!adForm.title || !adForm.link_url) return
    setSaving(true)
    // Update the ad slot created during payment verification
    await fetch('/api/ads/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ ...adForm, payment_plan: selected }),
    })
    setSaving(false)
    setStep('success')
  }

  if (step === 'success') return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎯</div>
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '10px' }}>Ad submitted for review!</h1>
      <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
        Our team will review your ad within 24 hours. You'll be notified when it goes live.
      </p>
    </div>
  )

  return (
    <div style={{ maxWidth: '620px', margin: '40px auto', padding: '0 16px 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📢</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '8px' }}>
          {pricing.advertise_page_title}
        </h1>
        <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7 }}>
          {pricing.advertise_page_desc || 'Reach thousands of AI creators, artists, and prompt engineers. Our audience is passionate about AI tools, models, and creative workflows.'}
        </p>
      </div>

      {/* Audience stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px', animation: 'fadeIn 0.35s ease' }}>
        {[
          { label: 'Monthly active users', value: '10K+' },
          { label: 'Avg session time', value: '8 min' },
          { label: 'AI-focused niche', value: '100%' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-primary)' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {step === 'plans' && (
        <>
          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px', animation: 'fadeIn 0.35s ease' }}>
            {AD_PLANS.map(plan => (
              <div key={plan.id} onClick={() => setSelected(plan.id)}
                style={{ background: '#2f2f2f', border: `2px solid ${selected === plan.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                )}
                <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>{plan.label}</span>
                  <span style={{ fontSize: '10px', color: '#9a8f7a', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px' }}>{plan.days} days</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-primary)' }}>₹{plan.price.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '10px' }}>📍 {plan.slot}</div>
                <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '12px' }}>👁 {plan.impressions} est. impressions</div>
                {plan.features.map(f => <p key={f} style={{ fontSize: '11px', color: '#9a8f7a', margin: '3px 0' }}>✓ {f}</p>)}
              </div>
            ))}
          </div>

          <RazorpayButton
            plan={selected}
            type="ad"
            label={`Ad Campaign — ₹${AD_PLANS.find(p => p.id === selected)?.price}`}
            amount={AD_PLANS.find(p => p.id === selected)?.price}
            accessToken={accessToken}
            onSuccess={(pid) => { setPaymentId(pid); setStep('setup') }}
          >
            📢 Book ad campaign — ₹{AD_PLANS.find(p => p.id === selected)?.price.toLocaleString()}
          </RazorpayButton>

          <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '10px' }}>
            All ads are reviewed before going live · Contact us for custom campaigns
          </p>
        </>
      )}

      {step === 'setup' && (
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '4px' }}>Setup your ad</h3>
          <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '20px' }}>Payment confirmed ✓ — now tell us about your ad</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'title', label: 'Ad headline *', placeholder: 'Try Midjourney Pro — 20% off' },
              { key: 'description', label: 'Short description', placeholder: 'The best AI image tool for creators' },
              { key: 'link_url', label: 'Destination URL *', placeholder: 'https://yourdomain.com' },
              { key: 'cta_text', label: 'CTA button text', placeholder: 'Learn more' },
              { key: 'image_url', label: 'Ad image URL (optional)', placeholder: 'https://cloudinary.com/your-image.jpg' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input value={(adForm as any)[key]} onChange={e => setAdForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-cream)', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            ))}
          </div>

          {/* Ad preview */}
          {adForm.title && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'color-mix(in srgb, var(--color-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9a8f7a', marginBottom: '8px', letterSpacing: '0.05em' }}>AD PREVIEW</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {adForm.image_url && <img src={adForm.image_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>{adForm.title}</div>
                  {adForm.description && <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>{adForm.description}</div>}
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0, background: 'var(--color-primary)', color: '#fff', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{adForm.cta_text}</div>
              </div>
            </div>
          )}

          <button onClick={saveAdDetails} disabled={saving || !adForm.title || !adForm.link_url}
            style={{ marginTop: '20px', width: '100%', background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', borderRadius: '12px', padding: '13px', fontSize: '14px', fontFamily: 'inherit', opacity: (!adForm.title || !adForm.link_url) ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Submit ad for review →'}
          </button>
        </div>
      )}
    </div>
  )
}
