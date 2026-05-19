'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '14px 16px', fontSize: '15px', color: '#FAF3E1',
  outline: 'none', fontFamily: 'inherit',
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#222222' }} />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}

function ForgotPasswordForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  if (sent) return (
    <div style={{ minHeight: '100vh', background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '380px' }}>
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>📬</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', marginBottom: '12px' }}>Check your inbox</h2>
        <p style={{ color: '#9a8f7a', lineHeight: 1.6, marginBottom: '24px' }}>
          We sent a password reset link to <strong style={{ color: '#F5E7C6' }}>{email}</strong>
        </p>
        <Link href="/auth/login" style={{ color: '#FF6D1F', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
          Back to sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1' }}>Reset password</h1>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginTop: '6px' }}>We'll email you a reset link</p>
        </div>
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>
          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
              ⚠ {error}
            </div>
          )}
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '7px' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inp} />
            </div>
            <button type="submit" disabled={loading || !email} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: '#FF6D1F', border: 'none', cursor: 'pointer',
              fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'inherit',
              opacity: !email ? 0.5 : 1,
            }}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9a8f7a' }}>
            <Link href="/auth/login" style={{ color: '#FF6D1F', fontWeight: 600, textDecoration: 'none' }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
