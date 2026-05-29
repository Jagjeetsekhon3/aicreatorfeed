'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '12px 16px', fontSize: '14px', color: 'var(--color-cream)',
  outline: 'none', fontFamily: 'inherit',
}

const label: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: 'var(--color-beige)', marginBottom: '7px',
}

const hint: React.CSSProperties = {
  fontSize: '11px', color: '#9a8f7a', marginTop: '5px',
}

const section: React.CSSProperties = {
  background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px', padding: '24px', marginBottom: '16px',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </h2>
  )
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={loading} style={{
      background: saved ? '#22c55e' : 'var(--color-primary)', color: '#fff',
      border: 'none', borderRadius: '10px', padding: '10px 24px',
      fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
      fontFamily: 'inherit', transition: 'background 0.3s',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
    </button>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '28px', height: '28px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} /></div>}>
      <SettingsForm />
    </Suspense>
  )
}

function SettingsForm() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'password'>('profile')

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Account fields
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  // States
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  const usernameValid = /^[a-z0-9_.]{3,20}$/.test(username)

  useEffect(() => {
    let mounted = true
    const timeout = setTimeout(() => { if (mounted) setPageLoading(false) }, 6000)

    async function load() {
      try {
        // Try getSession first (fast, reads cookie)
        let session = (await supabase.auth.getSession()).data.session

        // If no session, wait 1s and retry once (handles slow cookie propagation on production)
        if (!session) {
          await new Promise(r => setTimeout(r, 1000))
          session = (await supabase.auth.getSession()).data.session
        }

        if (!mounted) return

        if (!session?.user) {
          clearTimeout(timeout)
          // Don't redirect — just show empty form, user can sign in from navbar
          setPageLoading(false)
          return
        }

        const user = session.user
        setUserId(user.id)
        setEmail(user.email || '')

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        if (!profile) {
          const defaultUsername = (user.email || '').split('@')[0].replace(/[^a-z0-9_.]/g, '').slice(0, 20) || `user_${user.id.slice(0, 8)}`
          await supabase.from('profiles').upsert({ id: user.id, username: defaultUsername, full_name: user.user_metadata?.full_name || '' })
          setUsername(defaultUsername)
          setFullName(user.user_metadata?.full_name || '')
        } else {
          setFullName(profile.full_name || '')
          setUsername(profile.username || '')
          setBio(profile.bio || '')
          setWebsite(profile.website || '')
          setTwitter(profile.twitter || '')
          setInstagram(profile.instagram || '')
          setYoutube(profile.youtube || '')
          setAvatarUrl(profile.avatar_url || '')
          setAvatarPreview(profile.avatar_url || '')
        }
      } catch (err) {
        console.error('Settings load error:', err)
      } finally {
        clearTimeout(timeout)
        if (mounted) setPageLoading(false)
      }
    }
    load()
    return () => { mounted = false; clearTimeout(timeout) }
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Avatar must be under 5MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return avatarUrl
    const ext = avatarFile.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
    if (error) { setError('Avatar upload failed: ' + error.message); return null }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUsernameError('')
    if (!usernameValid) { setUsernameError('Username: 3–20 chars, lowercase letters, numbers, _ or .'); return }

    setProfileLoading(true)

    // Check username not taken by someone else
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing && existing.id !== userId) {
      setUsernameError('That username is already taken')
      setProfileLoading(false); return
    }

    // Upload avatar if changed
    const newAvatarUrl = await uploadAvatar()
    if (newAvatarUrl === null) { setProfileLoading(false); return }

    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      username,
      bio,
      website,
      twitter,
      instagram,
      youtube,
      avatar_url: newAvatarUrl,
    }).eq('id', userId)

    if (error) { setError(error.message) }
    else { setAvatarUrl(newAvatarUrl || ''); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000) }
    setProfileLoading(false)
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || newEmail === email) return
    setEmailLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) { setError(error.message) }
    else { setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000) }
    setEmailLoading(false)
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) { setError("New passwords don't match"); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setPasswordLoading(true)
    // Re-auth then update
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) { setError('Current password is incorrect'); setPasswordLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setError(error.message) }
    else { setPasswordSaved(true); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPasswordSaved(false), 3000) }
    setPasswordLoading(false)
  }

  if (pageLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const tabs = [
    { key: 'profile', label: '👤 Profile' },
    { key: 'account', label: '✉️ Account' },
    { key: 'password', label: '🔒 Password' },
  ] as const

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#9a8f7a' }}>Manage your profile and account</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#2f2f2f', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => { setActiveTab(key); setError('') }} style={{
            flex: 1, padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
            background: activeTab === key ? 'var(--color-primary)' : 'transparent',
            color: activeTab === key ? '#fff' : '#9a8f7a',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Global error */}
      {error && (
        <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
          ⚠ {error}
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave}>

          {/* Avatar */}
          <div style={section}>
            <SectionTitle>Profile photo</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%', cursor: 'pointer',
                  background: avatarPreview ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                  border: '3px solid color-mix(in srgb, var(--color-primary) 40%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                }}
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>{fullName?.[0] || '?'}</span>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: '18px' }}>📷</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
                  color: 'var(--color-primary)', borderRadius: '10px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Change photo
                </button>
                <p style={{ ...hint, marginTop: '6px' }}>JPG, PNG or WebP · Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div style={section}>
            <SectionTitle>Basic info</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={label}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inp} />
              </div>

              <div>
                <label style={label}>Username</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a8f7a', fontSize: '15px' }}>@</span>
                  <input
                    type="text" value={username}
                    onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')); setUsernameError('') }}
                    placeholder="yourname"
                    style={{ ...inp, paddingLeft: '30px', borderColor: usernameError ? 'rgba(255,80,80,0.4)' : username && usernameValid ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'rgba(255,255,255,0.1)' }}
                  />
                </div>
                {usernameError
                  ? <p style={{ ...hint, color: '#ff8080', marginTop: '5px' }}>⚠ {usernameError}</p>
                  : <p style={hint}>aicreatorfeed.com/@{username || 'yourname'}</p>
                }
              </div>

              <div>
                <label style={label}>Bio</label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Tell the community about yourself and what you create..."
                  rows={3} maxLength={160}
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                />
                <p style={hint}>{bio.length}/160 characters</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={section}>
            <SectionTitle>Links</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {[
                { icon: '🌐', label: 'Website', value: website, set: setWebsite, placeholder: 'https://yourwebsite.com' },
                { icon: '🐦', label: 'Twitter / X', value: twitter, set: setTwitter, placeholder: '@username' },
                { icon: '📸', label: 'Instagram', value: instagram, set: setInstagram, placeholder: '@username' },
                { icon: '▶️', label: 'YouTube', value: youtube, set: setYoutube, placeholder: 'https://youtube.com/@channel' },
              ].map(({ icon, label: lbl, value, set, placeholder }) => (
                <div key={lbl}>
                  <label style={label}>{icon} {lbl}</label>
                  <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={placeholder} style={inp} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={profileLoading} saved={profileSaved} />
          </div>
        </form>
      )}

      {/* ── ACCOUNT TAB ── */}
      {activeTab === 'account' && (
        <form onSubmit={handleEmailSave}>
          <div style={section}>
            <SectionTitle>Email address</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={label}>Current email</label>
                <input type="email" value={email} disabled style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={label}>New email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" style={inp} />
                <p style={hint}>We'll send a confirmation to your new email address.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={emailLoading} saved={emailSaved} />
          </div>
        </form>
      )}

      {/* ── PASSWORD TAB ── */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSave}>
          <div style={section}>
            <SectionTitle>Change password</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={label}>Current password</label>
                <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" required style={inp} />
              </div>

              <div>
                <label style={label}>New password</label>
                <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required style={inp} />
                {newPassword && (
                  <p style={{ ...hint, color: newPassword.length >= 8 ? '#4ade80' : '#ff8080', marginTop: '5px' }}>
                    {newPassword.length >= 8 ? '✓ Strong enough' : `${8 - newPassword.length} more characters needed`}
                  </p>
                )}
              </div>

              <div>
                <label style={label}>Confirm new password</label>
                <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inp} />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ ...hint, color: '#ff8080', marginTop: '5px' }}>⚠ Passwords don't match</p>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#9a8f7a' }}>
                <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                Show passwords
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={passwordLoading} saved={passwordSaved} />
          </div>
        </form>
      )}

    </div>
  )
}
