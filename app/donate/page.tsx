'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import RazorpayButton from '@/components/ui/RazorpayButton'
import Link from 'next/link'

const PRESETS = [
  { label: '₹99',  plan: 'donation_99',  amount: 99,  desc: 'Buy us a chai ☕' },
  { label: '₹199', plan: 'donation_199', amount: 199, desc: 'Support our servers 🖥' },
  { label: '₹499', plan: 'donation_499', amount: 499, desc: 'Fuel AI creativity 🚀' },
]

export default function DonatePage() {
  const [selected, setSelected] = useState<string>('donation_199')
  const [customAmt, setCustomAmt] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) setAccessToken(data.session.access_token)
    })
  }, [])

  const activePlan = isCustom ? 'donation_custom' : selected
  const activeAmount = isCustom ? parseInt(customAmt) || 0 : PRESETS.find(p => p.plan === selected)?.amount || 0

  if (success) return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🙏</div>
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FAF3E1', marginBottom: '10px' }}>Thank you!</h1>
      <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
        Your support keeps AiCreatorFeed running and helps us build better tools for the AI creator community.
      </p>
      <Link href="/feed" style={{ display: 'inline-block', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none' }}>
        Back to feed →
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>💛</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#FAF3E1', marginBottom: '8px' }}>Support AiCreatorFeed</h1>
        <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7 }}>
          We're a community-first platform for AI creators. Your donation helps us keep the platform free, improve features, and pay for servers.
        </p>
      </div>

      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', animation: 'fadeIn 0.35s ease' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9a8f7a', marginBottom: '14px', letterSpacing: '0.05em' }}>SELECT AMOUNT</h3>

        {/* Preset amounts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {PRESETS.map(p => (
            <button key={p.plan} onClick={() => { setSelected(p.plan); setIsCustom(false) }}
              style={{ padding: '14px 8px', borderRadius: '12px', border: `2px solid ${!isCustom && selected === p.plan ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`, background: !isCustom && selected === p.plan ? 'rgba(255,109,31,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: !isCustom && selected === p.plan ? '#FF6D1F' : '#FAF3E1' }}>{p.label}</div>
              <div style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '3px' }}>{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <button onClick={() => setIsCustom(true)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `2px solid ${isCustom ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`, background: isCustom ? 'rgba(255,109,31,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px', transition: 'all 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isCustom ? '#FF6D1F' : '#9a8f7a' }}>✏️ Custom amount</div>
        </button>

        {isCustom && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,109,31,0.3)', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{ color: '#FF6D1F', fontWeight: 700, fontSize: '18px', marginRight: '8px' }}>₹</span>
              <input type="number" value={customAmt} onChange={e => setCustomAmt(e.target.value)} min="10" placeholder="Enter amount"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FAF3E1', fontSize: '18px', fontWeight: 700, fontFamily: 'inherit' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '6px' }}>Minimum ₹10</p>
          </div>
        )}

        {/* What it funds */}
        <div style={{ background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.1)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#FF6D1F', margin: '0 0 8px' }}>Your donation goes towards:</p>
          {['🖥 Server & hosting costs', '🛠 New features & improvements', '🎬 Tutorial production', '🌍 Growing the AI creator community'].map(item => (
            <p key={item} style={{ fontSize: '12px', color: '#9a8f7a', margin: '4px 0' }}>{item}</p>
          ))}
        </div>

        {/* Pay button */}
        <RazorpayButton
          plan={activePlan}
          type="donation"
          label={`₹${activeAmount} Donation`}
          amount={activeAmount}
          customAmount={isCustom ? parseInt(customAmt) : undefined}
          accessToken={accessToken}
          onSuccess={() => setSuccess(true)}
        >
          💛 Donate ₹{activeAmount || '—'}
        </RazorpayButton>

        <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '12px' }}>
          Secured by Razorpay · UPI, cards, netbanking accepted
        </p>
      </div>
    </div>
  )
}
