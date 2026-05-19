'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/feed',      label: 'Feed',      icon: FeedIcon },
  { href: '/prompts',   label: 'Prompts',   icon: PromptsIcon },
  { href: '/post/new',  label: 'Post',      icon: PostIcon },
  { href: '/tutorials', label: 'Tutorials', icon: TutorialsIcon },
  { href: '/community', label: 'Community', icon: CommunityIcon },
]

function Logo() {
  return (
    <svg width="34" height="34" viewBox="-54 -100 108 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,-72 54,60 36,60 0,-12 -36,60 -54,60" fill="#FF6D1F"/>
      <rect x="-28" y="14" width="56" height="13" fill="#222222"/>
      <circle cx="0" cy="-88" r="13" fill="#FF6D1F"/>
    </svg>
  )
}

/* ── SVG icons for bottom nav ── */
function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function PromptsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2"/>
      <path d="M3 21l4-4h11a2 2 0 0 0 2-2"/>
    </svg>
  )
}

function PostIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#FF6D1F' : 'none'} stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function TutorialsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" fill={active ? '#FF6D1F' : 'none'}/>
    </svg>
  )
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  )
}

function NewsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF6D1F' : '#9a8f7a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  )
}

export default function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── DESKTOP TOP NAV (hidden on mobile) ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
          .main-content { padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav { display: none !important; }
        }
        .bottom-nav-item:active { transform: scale(0.9); }
      `}</style>

      <nav className="desktop-nav" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(34,34,34,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 16px',
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <Logo />
            <span style={{ fontWeight: 900, fontSize: '18px', color: '#FAF3E1', letterSpacing: '-0.5px' }}>
              Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { href: '/feed', label: 'Feed' },
              { href: '/prompts', label: 'Prompts' },
              { href: '/news', label: 'AI News' },
              { href: '/tutorials', label: 'Tutorials' },
              { href: '/community', label: 'Community' },
            ].map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link key={href} href={href} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
                  background: active ? 'rgba(255,109,31,0.12)' : 'transparent',
                  color: active ? '#FF6D1F' : '#9a8f7a',
                  fontWeight: active ? 600 : 400,
                }}>{label}</Link>
              )
            })}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/post/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#FF6D1F', color: '#fff', fontWeight: 700,
              padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px',
            }}>+ Share Prompt</Link>
            <Link href="/auth/login" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/auth/signup" style={{
              fontSize: '13px', fontWeight: 600,
              background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.3)',
              color: '#FF6D1F', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none',
            }}>Join free</Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR (logo + join only) ── */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(34,34,34,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 16px', height: '56px',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Logo />
          <span style={{ fontWeight: 900, fontSize: '16px', color: '#FAF3E1', letterSpacing: '-0.5px' }}>
            Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{
            fontSize: '12px', fontWeight: 700,
            background: '#FF6D1F', color: '#fff',
            padding: '7px 14px', borderRadius: '8px', textDecoration: 'none',
          }}>Join free</Link>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV BAR (Instagram style) ── */}
      <div style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(26,26,26,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="mobile-bottom-nav">
        {[
          { href: '/feed',      label: 'Feed',      Icon: FeedIcon },
          { href: '/prompts',   label: 'Prompts',   Icon: PromptsIcon },
          { href: '/post/new',  label: '',          Icon: PostIcon, isPost: true },
          { href: '/tutorials', label: 'Tutorials', Icon: TutorialsIcon },
          { href: '/community', label: 'Community', Icon: CommunityIcon },
        ].map(({ href, label, Icon, isPost }) => {
          const active = isPost ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="bottom-nav-item"
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', padding: '10px 0 8px',
                textDecoration: 'none', transition: 'transform 0.1s',
              }}
            >
              {isPost ? (
                /* Big orange post button in center */
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: '#FF6D1F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(255,109,31,0.4)',
                  marginTop: '-18px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              ) : (
                <>
                  <Icon active={active} />
                  <span style={{
                    fontSize: '10px', fontWeight: active ? 600 : 400,
                    color: active ? '#FF6D1F' : '#9a8f7a',
                    letterSpacing: '0.02em',
                  }}>{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}
