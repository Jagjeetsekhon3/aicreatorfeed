'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Logo ──────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="34" height="34" viewBox="-54 -100 108 170" fill="none">
      <polygon points="0,-72 54,60 36,60 0,-12 -36,60 -54,60" fill="#FF6D1F"/>
      <rect x="-28" y="14" width="56" height="13" fill="#222222"/>
      <circle cx="0" cy="-88" r="13" fill="#FF6D1F"/>
    </svg>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────
function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function ExploreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? '#FF6D1F' : 'none'}/>
    </svg>
  )
}
function PostIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#FF6D1F' : 'none'} stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}
function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  )
}
function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={active ? 'rgba(255,109,31,0.2)' : 'none'}/>
    </svg>
  )
}

// ── Profile Dropdown ──────────────────────────────────────────────────────
function ProfileDropdown({ user, signOut }: { user: any; signOut: () => void }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      .then(({ data }) => { if (data) { setUsername(data.username); setAvatar(data.avatar_url || '') } })
  }, [user.id])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initial = (user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: avatar ? 'transparent' : 'rgba(255,109,31,0.2)',
        border: `2px solid ${open ? '#FF6D1F' : 'rgba(255,109,31,0.4)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, overflow: 'hidden', transition: 'border-color 0.2s',
      }}>
        {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6D1F' }}>{initial}</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '200px',
          background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
          animation: 'dropIn 0.15s ease',
        }}>
          <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1' }}>{user.user_metadata?.full_name || 'Creator'}</div>
            <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>@{username || '...'}</div>
          </div>
          <div style={{ padding: '6px' }}>
            {[
              { href: `/profile/${username}`, icon: '👤', label: 'Profile' },
              { href: '/settings', icon: '⚙️', label: 'Settings' },
            ].map(({ href, icon, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                color: '#F5E7C6', fontSize: '14px', transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {icon} {label}
              </Link>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
            <button onClick={() => { setOpen(false); signOut() }} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '10px 12px', borderRadius: '8px', background: 'none',
              border: 'none', cursor: 'pointer', color: '#ff8080', fontSize: '14px',
              fontFamily: 'inherit', textAlign: 'left',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              🚪 Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Burger Menu ───────────────────────────────────────────────────────────
function BurgerMenu({ user, signOut }: { user: any; signOut: () => void }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const links = [
    { href: '/feed',          label: 'Feed',          icon: '🏠' },
    { href: '/explore',       label: 'Explore',       icon: '🔭' },
    { href: '/saved',         label: 'Saved',         icon: '🔖' },
    { href: '/search',        label: 'Search',        icon: '🔍' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/community',     label: 'Community',     icon: '👥' },
    { href: '/news',          label: 'AI News',       icon: '📰' },
    { href: '/tutorials',     label: 'Tutorials',     icon: '🎬' },
    { href: '/messages',      label: 'Messages',      icon: '💬' },
    { href: '/settings',      label: 'Settings',      icon: '⚙️' },
    { href: '/contact',       label: 'Contact',        icon: '✉️' },
    { href: '/verify',        label: 'Get Verified ✓', icon: '✓'  },
    { href: '/donate',        label: 'Support Us',      icon: '💛' },
    { href: '/advertise',     label: 'Advertise',       icon: '📢' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'block', height: '2px', background: '#9a8f7a', borderRadius: '2px',
            width: open ? (i === 1 ? '0' : '18px') : '18px',
            transform: open ? (i === 0 ? 'translateY(6px) rotate(45deg)' : i === 2 ? 'translateY(-6px) rotate(-45deg)' : 'none') : 'none',
            transition: 'all 0.2s',
          }} />
        ))}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '220px',
          background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
          animation: 'dropIn 0.15s ease',
        }}>
          <div style={{ padding: '6px' }}>
            {links.map(({ href, icon, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', textDecoration: 'none',
                background: pathname.startsWith(href) ? 'rgba(255,109,31,0.1)' : 'transparent',
                color: pathname.startsWith(href) ? '#FF6D1F' : '#F5E7C6',
                fontSize: '14px', fontWeight: pathname.startsWith(href) ? 600 : 400,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (!pathname.startsWith(href)) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = pathname.startsWith(href) ? 'rgba(255,109,31,0.1)' : 'transparent' }}
              >
                <span style={{ fontSize: '15px' }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
          {user && (
            <>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ padding: '6px' }}>
                <button onClick={() => { setOpen(false); signOut() }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '10px 12px', borderRadius: '8px', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#ff8080',
                  fontSize: '14px', fontFamily: 'inherit', textAlign: 'left',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  🚪 Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAccessToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!accessToken || !user) return
    // Load initial count
    fetch('/api/notifications?type=count', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => setUnreadCount(d.count || 0))
    // Realtime updates
    const channel = supabase.channel('notif-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        setUnreadCount(c => c + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        fetch('/api/notifications?type=count', { headers: { Authorization: `Bearer ${accessToken}` } })
          .then(r => r.json()).then(d => setUnreadCount(d.count || 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [accessToken, user])

  const desktopLinks = [
    { href: '/feed',      label: 'Feed' },
    { href: '/explore',   label: 'Explore' },
    { href: '/community', label: 'Community' },
    { href: '/news',      label: 'AI News' },
    { href: '/tutorials', label: 'Tutorials' },
  ]

  const mobileBottomLinks = [
    { href: '/feed',      label: 'Feed',      Icon: FeedIcon },
    { href: '/explore',   label: 'Explore',   Icon: ExploreIcon },
    { href: '/post/new',  label: '',          Icon: PostIcon,      isPost: true },
    { href: '/community', label: 'Community', Icon: CommunityIcon },
    { href: '/messages',  label: 'Messages',  Icon: MessagesIcon },
  ]

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-top-bar { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content { padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-top-bar { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>

      {/* ── DESKTOP TOP NAV ── */}
      <nav className="desktop-nav" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(34,34,34,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 16px',
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <Logo />
            <span style={{ fontWeight: 900, fontSize: '18px', color: '#FAF3E1', letterSpacing: '-0.5px' }}>
              Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {desktopLinks.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link key={href} href={href} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
                  background: active ? 'rgba(255,109,31,0.12)' : 'transparent',
                  color: active ? '#FF6D1F' : '#9a8f7a', fontWeight: active ? 600 : 400,
                }}>{label}</Link>
              )
            })}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Link href="/search" title="Search" style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#9a8f7a" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="#9a8f7a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>
            {user && (
              <Link href="/notifications" title="Notifications" onClick={() => setUnreadCount(0)} style={{ position: "relative", width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#9a8f7a" strokeWidth="1.5" strokeLinecap="round"><path d="M8.5 2a5.5 5.5 0 0 1 5.5 5.5c0 2.5.5 3.5 1 4.5H2c.5-1 1-2 1-4.5A5.5 5.5 0 0 1 8.5 2Z"/><path d="M7 14.5a1.5 1.5 0 0 0 3 0"/></svg>
                {unreadCount > 0 && <span style={{ position: "absolute", top: "-3px", right: "-3px", background: "#FF6D1F", color: "#fff", fontSize: "10px", fontWeight: 800, width: "17px", height: "17px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #222" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
            )}
            <Link href="/post/new" title="Create post" style={{
              width: '36px', height: '36px', borderRadius: '10px', background: '#FF6D1F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', boxShadow: '0 2px 8px rgba(255,109,31,0.35)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3.5V14.5M3.5 9H14.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </Link>
            <BurgerMenu user={user} signOut={signOut} />
            {user ? (
              <ProfileDropdown user={user} signOut={signOut} />
            ) : (
              <>
                <Link href="/auth/login" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Sign in</Link>
                <Link href="/auth/signup" style={{ fontSize: '13px', fontWeight: 600, background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.3)', color: '#FF6D1F', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none' }}>Join free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <nav className="mobile-top-bar" style={{
        display: 'none', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(34,34,34,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 'env(safe-area-inset-top)',
      }}>
        <div style={{ padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Logo />
          <span style={{ fontWeight: 900, fontSize: '16px', color: '#FAF3E1' }}>
            Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/search" style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#9a8f7a" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="#9a8f7a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>
          <BurgerMenu user={user} signOut={signOut} />
          {user ? (
            <ProfileDropdown user={user} signOut={signOut} />
          ) : (
            <>
              <Link href="/auth/login" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Sign in</Link>
              <Link href="/auth/signup" style={{ fontSize: '12px', fontWeight: 700, background: '#FF6D1F', color: '#fff', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none' }}>Join free</Link>
            </>
          )}
        </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(26,26,26,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {mobileBottomLinks.map(({ href, label, Icon, isPost }) => {
          const active = isPost ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px', padding: '10px 0 8px', textDecoration: 'none',
            }}>
              {isPost ? (
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', background: '#FF6D1F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(255,109,31,0.4)', marginTop: '-18px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              ) : (
                <>
                  <Icon active={active} />
                  <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#FF6D1F' : '#9a8f7a' }}>{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}
