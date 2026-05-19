'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/feed',      label: 'Feed' },
  { href: '/prompts',   label: 'Prompts' },
  { href: '/news',      label: 'AI News' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/community', label: 'Community' },
]

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FF6D1F"/>
      <text x="20" y="29" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="26" fill="#FAF3E1">A</text>
      <circle cx="29" cy="12" r="4.5" fill="#222222"/>
      <circle cx="29" cy="12" r="3" fill="#FAF3E1"/>
    </svg>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav style={{
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

        {/* Nav links — hidden on small screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLinks.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '8px 12px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
                background: active ? 'rgba(255,109,31,0.12)' : 'transparent',
                color: active ? '#FF6D1F' : '#9a8f7a',
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/post/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#FF6D1F', color: '#fff', fontWeight: 700,
            padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px',
          }}>
            + Share Prompt
          </Link>
          <Link href="/auth/login" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>
            Sign in
          </Link>
          <Link href="/auth/signup" style={{
            fontSize: '13px', fontWeight: 600,
            background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.3)',
            color: '#FF6D1F', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none',
          }}>
            Join free
          </Link>
        </div>

      </div>
    </nav>
  )
}
