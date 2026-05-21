'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ICONS = ['💬', '🎨', '🤖', '✨', '🎬', '📸', '🚀', '⚡', '🧠', '🎭', '🌟', '🔥', '💡', '🎯', '🏆', '📰', '🔧', '🎮', '🌈', '🦾']
const COLORS = ['#FF6D1F', '#7c3aed', '#0891b2', '#dc2626', '#059669', '#d97706', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b']

export default function CreateSpacePage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('💬')
  const [color, setColor] = useState('#FF6D1F')
  const [rules, setRules] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/auth/login?redirect=/community/create')
      else setAccessToken(data.session.access_token)
    })
  }, [])

  const slug = displayName.toLowerCase().replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/community?action=create_space', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name: slug, display_name: displayName.trim(), description: description.trim(), icon, cover_color: color, rules: rules.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to create'); setLoading(false); return }
    router.push(`/community/${data.space.name}`)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#FAF3E1', outline: 'none', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '7px' }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', display: 'flex', padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#FAF3E1', margin: 0 }}>Create a space</h1>
      </div>

      {/* Preview */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '8px', background: color }} />
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{icon}</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FAF3E1' }}>{displayName || 'Space name'}</div>
            <div style={{ fontSize: '12px', color: '#9a8f7a' }}>acf/{slug || 'space-name'}</div>
          </div>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>⚠ {error}</div>}

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={lbl}>Space name *</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Midjourney Tips" required maxLength={50} style={inp} />
          {displayName && <p style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '5px' }}>URL: aicreatorfeed.com/community/{slug}</p>}
        </div>

        <div>
          <label style={lbl}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this space about?" rows={3} maxLength={300}
            style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
          <p style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '4px' }}>{description.length}/300</p>
        </div>

        <div>
          <label style={lbl}>Icon</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ICONS.map(i => (
              <button key={i} type="button" onClick={() => setIcon(i)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: `2px solid ${icon === i ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`, background: icon === i ? 'rgba(255,109,31,0.1)' : '#2a2a2a', cursor: 'pointer', fontSize: '18px' }}>{i}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>Rules <span style={{ fontWeight: 400, color: '#9a8f7a' }}>(optional)</span></label>
          <textarea value={rules} onChange={e => setRules(e.target.value)} placeholder="Set community guidelines..." rows={3} maxLength={500}
            style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
        </div>

        <button type="submit" disabled={loading || !displayName.trim()} style={{ padding: '13px', background: displayName.trim() ? '#FF6D1F' : '#333', color: displayName.trim() ? '#fff' : '#555', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: displayName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {loading ? 'Creating...' : 'Create space'}
        </button>
      </form>
    </div>
  )
}
