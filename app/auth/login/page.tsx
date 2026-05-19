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
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirect}` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#222222',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Logo />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', letterSpacing: '-0.5px' }}>
            Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
          </h1>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginTop: '6px' }}>Welcome back</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', padding: '32px',
        }}>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={googleLoading} style={{
            width: '100%', padding: '13px', borderRadius: '12px',
            background: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontSize: '14px', fontWeight: 600, color: '#222', marginBottom: '20px',
            opacity: googleLoading ? 0.7 : 1, fontFamily: 'inherit',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
            <span style={{ fontSize: '12px', color: '#9a8f7a' }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
              borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
              fontSize: '13px', color: '#ff8080',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '7px' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                style={inp}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#F5E7C6' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
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
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '16px', color: '#9a8f7a', padding: '4px',
                }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || !password} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: loading ? '#cc5510' : '#FF6D1F',
              border: 'none', cursor: loading ? 'wait' : 'pointer',
              fontSize: '15px', fontWeight: 700, color: '#fff',
              marginTop: '4px', fontFamily: 'inherit',
              opacity: (!email || !password) ? 0.5 : 1,
              transition: 'background 0.2s',
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
