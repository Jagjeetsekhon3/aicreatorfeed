'use client'
import { useState, useEffect } from 'react'

type Requirement = {
  label: string
  current: number
  required: number
  unit: string
  met: boolean
}

type EligibilityData = {
  is_creator: boolean
  eligible: boolean
  requirements: Record<string, Requirement>
  application: { status: string; reject_reason?: string; reviewed_at?: string } | null
}

export default function CreatorEligibility({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<EligibilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/creator/eligibility', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [accessToken])

  async function applyNow() {
    setApplying(true)
    try {
      const res = await fetch('/api/creator/eligibility', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) {
        setToast('🎉 Congratulations! You are now a Creator!')
        setData(prev => prev ? { ...prev, is_creator: true } : prev)
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setToast(d.error || 'Something went wrong')
        setTimeout(() => setToast(''), 3000)
      }
    } catch {
      setToast('Network error, please try again')
      setTimeout(() => setToast(''), 3000)
    }
    setApplying(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
      <div style={{ width: '24px', height: '24px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!data) return null

  // Already a creator
  if (data.is_creator) return (
    <div style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary) 4%, transparent))', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🌟</div>
      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-cream)', marginBottom: '4px' }}>You're a Creator!</div>
      <div style={{ fontSize: '13px', color: '#9a8f7a' }}>You can now create paid tutorials, sell prompt packs, and receive tips from supporters.</div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { icon: '🎓', label: 'Paid Tutorials', href: '/tutorials/create' },
          { icon: '📦', label: 'Prompt Packs', href: '/packs/create' },
          { icon: '☕', label: 'Receive Tips', href: '/settings#tips' },
        ].map(item => (
          <a key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)', borderRadius: '10px', color: 'var(--color-cream)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
      </div>
    </div>
  )

  const reqs = data.requirements
  const metCount = Object.values(reqs).filter(r => r.met).length
  const totalCount = Object.values(reqs).length

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toast.includes('🎉') ? 'var(--color-primary)' : '#333', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, zIndex: 1000 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔓</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-cream)' }}>Unlock Creator Features</div>
          <div style={{ fontSize: '12px', color: '#9a8f7a' }}>Sell tutorials, prompt packs & receive tips</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: data.eligible ? '#4ade80' : 'var(--color-primary)' }}>
          {metCount}/{totalCount} met
        </div>
      </div>

      {/* Pending application */}
      {data.application?.status === 'pending' && (
        <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#facc15' }}>
          ⏳ Your application is under review. We'll notify you within 24–48 hours.
        </div>
      )}

      {/* Rejected */}
      {data.application?.status === 'rejected' && (
        <div style={{ background: 'rgba(255,128,128,0.08)', border: '1px solid rgba(255,128,128,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
          ❌ Previous application was not approved.
          {data.application.reject_reason && <span style={{ display: 'block', marginTop: '4px', color: '#9a8f7a' }}>{data.application.reject_reason}</span>}
        </div>
      )}

      {/* Requirements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {Object.entries(reqs).map(([key, req]) => {
          const pct = Math.min(100, Math.round((req.current / req.required) * 100))
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px' }}>{req.met ? '✅' : '○'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: req.met ? 'var(--color-cream)' : '#9a8f7a' }}>{req.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: req.met ? '#4ade80' : 'var(--color-primary)' }}>
                  {req.current.toLocaleString()} / {req.required.toLocaleString()}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: req.met ? '#4ade80' : 'var(--color-primary)',
                  borderRadius: '999px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              {!req.met && (
                <div style={{ fontSize: '11px', color: '#6b6460', marginTop: '3px' }}>
                  {(req.required - req.current).toLocaleString()} more {req.unit} needed
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Benefits section — always visible */}
      <div style={{ margin: '20px 0', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a8f7a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>What you unlock</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '☕', title: 'Receive Tips', desc: 'Supporters can tip you directly on your profile' },
            { icon: '🎓', title: 'Paid Tutorials', desc: 'Publish tutorials with a price — earn per unlock' },
            { icon: '📦', title: 'Prompt Packs', desc: 'Bundle & sell your best prompts as a pack' },
            { icon: '🌟', title: 'Creator Badge', desc: 'Stand out with a Creator badge on your profile' },
          ].map(b => (
            <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{b.icon}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: data.eligible ? 'var(--color-cream)' : '#6b6460' }}>{b.title}</div>
                <div style={{ fontSize: '11px', color: '#6b6460', marginTop: '1px' }}>{b.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '14px' }}>{data.eligible ? '✅' : '🔒'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {data.eligible && data.application?.status !== 'pending' ? (
        <button
          onClick={applyNow}
          disabled={applying}
          style={{ width: '100%', padding: '13px', background: 'var(--color-primary)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.7 : 1, fontFamily: 'inherit', letterSpacing: '0.3px', boxShadow: '0 4px 20px color-mix(in srgb, var(--color-primary) 35%, transparent)' }}
        >
          {applying ? 'Activating...' : '🚀 Activate Creator Status — It's Free'}
        </button>
      ) : !data.eligible ? (
        <div style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: '#6b6460' }}>
          Complete the requirements above to unlock ✦
        </div>
      ) : null}
    </div>
  )
}
