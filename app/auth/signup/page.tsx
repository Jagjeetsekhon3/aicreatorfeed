'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Logo() {
  return (
    <svg width="42" height="42" viewBox="-54 -100 108 170" fill="none">
      <polygon points="0,-72 54,60 36,60 0,-12 -36,60 -54,60" fill="var(--color-primary)"/>
      <rect x="-28" y="14" width="56" height="13" fill="var(--color-bg)"/>
      <circle cx="0" cy="-88" r="13" fill="var(--color-primary)"/>
    </svg>
  )
}

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '14px 16px', fontSize: '15px', color: 'var(--color-cream)',
  outline: 'none', fontFamily: 'inherit',
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) router.replace('/feed')
      else setChecking(false)
    }).catch(() => {
      if (mounted) setChecking(false)
    })
    return () => { mounted = false }
  }, [])

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  )

  const usernameValid = /^[a-z0-9_.]{3,20}$/.test(username)
  const passwordStrong = password.length >= 8

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!usernameValid) { setError('Username: 3–20 chars, lowercase letters, numbers, _ or . only'); return }
    if (!passwordStrong) { setError('Password must be at least 8 characters'); return }
    setLoading(true)

    // Check username not taken — use maybeSingle() so no error when not found
    const { data: existing, error: checkError } = await supabase
      .from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) { setError('That username is already taken'); setLoading(false); return }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { full_name: fullName, username },
      },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      // upsert so it never fails if row already exists
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        full_name: fullName,
      }, { onConflict: 'id' }).select().maybeSingle()
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '40px 32px' }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>📧</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '12px' }}>Check your email</h2>
        <p style={{ color: '#9a8f7a', lineHeight: 1.7, marginBottom: '8px' }}>
          We sent a confirmation link to
        </p>
        <p style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '20px', fontSize: '15px' }}>{email}</p>
        <p style={{ color: '#9a8f7a', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px' }}>
          Click the link in the email to activate your account. Check your spam folder if you don't see it.
        </p>
        <Link href="/auth/login" style={{
          display: 'inline-block', background: 'var(--color-primary)', color: '#fff',
          padding: '12px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '14px',
        }}>
          Go to sign in →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Logo /></div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-cream)', letterSpacing: '-0.5px' }}>
            Join Ai<span style={{ color: 'var(--color-primary)' }}>Creator</span>Feed
          </h1>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginTop: '6px' }}>Where AI Creators Connect</p>
        </div>

        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required style={inp} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a8f7a', fontSize: '15px' }}>@</span>
                <input type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="yourname" required
                  style={{ ...inp, paddingLeft: '30px', borderColor: username && !usernameValid ? 'rgba(255,80,80,0.4)' : username && usernameValid ? 'rgba(255,109,31,0.4)' : 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '5px' }}>3–20 chars · lowercase · letters, numbers, _ or .</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inp} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>
                Password
                {password && <span style={{ marginLeft: '8px', fontSize: '11px', color: passwordStrong ? '#4ade80' : '#ff8080', fontWeight: 400 }}>{passwordStrong ? '✓ Good' : 'Min 8 chars'}</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inp, paddingRight: '48px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9a8f7a' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !fullName || !email || !password} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              background: 'var(--color-primary)', border: 'none', cursor: 'pointer',
              fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: 'inherit',
              opacity: (!fullName || !email || !password) ? 0.5 : 1, marginTop: '4px',
            }}>
              {loading ? 'Creating account...' : "Create free account"}
            </button>

            <p style={{ fontSize: '11px', color: '#9a8f7a', textAlign: 'center' }}>
              By joining you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9a8f7a' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
