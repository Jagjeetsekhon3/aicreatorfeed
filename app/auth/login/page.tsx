'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Logo() {
  return (
    <svg width="42" height="42" viewBox="-54 -100 108 170" fill="none">
      <polygon points="0,-72 54,60 36,60 0,-12 -36,60 -54,60" fill="#FF6D1F"/>
      <rect x="-28" y="14" width="56" height="13" fill="#222222"/>
      <circle cx="0" cy="-88" r="13" fill="#FF6D1F"/>
    </svg>
  )
}

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '14px 16px', fontSize: '15px', color: '#FAF3E1',
  outline: 'none', fontFamily: 'inherit',
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/feed'
  const supabase = createClient()

  const [identifier, setIdentifier] = useState('') // email or username
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isEmail = identifier.includes('@')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let email = identifier.trim()

      // If username entered, resolve to email first
      if (!isEmail) {
        const res = await fetch('/api/auth/resolve-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier.trim().replace('@', '') }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Username not found'); setLoading(false); return }
        email = data.email
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else { router.push(redirect); router.refresh() }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Logo /></div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', letterSpacing: '-0.5px' }}>
            Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
          </h1>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginTop: '6px' }}>Welcome back</p>
        </div>

        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '7px' }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@email.com or @username"
                  required
                  autoComplete="username"
                  style={{ ...inp, paddingRight: '80px' }}
                />
                {identifier && (
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                    background: isEmail ? 'rgba(255,109,31,0.15)' : 'rgba(255,255,255,0.08)',
                    color: isEmail ? '#FF6D1F' : '#9a8f7a',
                  }}>
                    {isEmail ? 'email' : 'username'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#F5E7C6' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ ...inp, paddingRight: '48px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9a8f7a',
                }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !identifier || !password} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: '#FF6D1F', border: 'none', cursor: loading ? 'wait' : 'pointer',
              fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'inherit',
              opacity: (!identifier || !password) ? 0.5 : 1, marginTop: '4px',
            }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9a8f7a' }}>
            No account?{' '}
            <Link href="/auth/signup" style={{ color: '#FF6D1F', fontWeight: 600, textDecoration: 'none' }}>
              Join AiCreatorFeed free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
