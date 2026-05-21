'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (res.ok) router.push('/acfjagjeetadmin/dashboard')
    else { setError(data.error || 'Invalid password'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', background: '#FF6D1F', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#FAF3E1', marginBottom: '4px' }}>AiCreatorFeed Admin</h1>
          <p style={{ fontSize: '13px', color: '#6b6460' }}>Restricted access</p>
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px' }}>
          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9a8f7a', marginBottom: '7px', letterSpacing: '0.05em' }}>ADMIN PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" required autoFocus
                style={{ width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', fontSize: '15px', color: '#FAF3E1', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={loading || !password} style={{
              width: '100%', padding: '13px', borderRadius: '10px',
              background: password ? '#FF6D1F' : '#2a2a2a', border: 'none',
              cursor: password ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 700,
              color: password ? '#fff' : '#555', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {loading ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Verifying...</> : 'Enter admin panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
