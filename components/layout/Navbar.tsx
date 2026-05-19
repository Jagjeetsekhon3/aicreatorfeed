'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image, Newspaper, BookOpen, Users, PlusCircle } from 'lucide-react'

const navLinks = [
  { href: '/feed',      label: 'Feed',      icon: Home },
  { href: '/prompts',   label: 'Prompts',   icon: Image },
  { href: '/news',      label: 'AI News',   icon: Newspaper },
  { href: '/tutorials', label: 'Tutorials', icon: BookOpen },
  { href: '/community', label: 'Community', icon: Users },
]

// AiCreatorFeed Logo — Bold "A" with orange dot (V8 final)
function AiCreatorFeedLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#FF6D1F"/>
      {/* Bold A lettermark */}
      <text
        x="20" y="29"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        fontWeight="900"
        fontSize="26"
        fill="#FAF3E1"
        letterSpacing="-1"
      >A</text>
      {/* Orange dot — the signature mark */}
      <circle cx="29" cy="12" r="4.5" fill="#222222"/>
      <circle cx="29" cy="12" r="3" fill="#FAF3E1"/>
    </svg>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur border-b"
      style={{
        background: 'rgba(34,34,34,0.95)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

        {/* Logo + Name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <AiCreatorFeedLogo size={34} />
          <div className="leading-none">
            <span className="font-black text-lg tracking-tight" style={{ color: '#FAF3E1' }}>
              Ai<span style={{ color: '#FF6D1F' }}>Creator</span>Feed
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? 'rgba(255,109,31,0.12)' : 'transparent',
                  color: active ? '#FF6D1F' : '#9a8f7a',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/post/new"
            className="hidden sm:flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: '#FF6D1F' }}
          >
            <PlusCircle size={15} />
            Share Prompt
          </Link>
          <Link
            href="/auth/login"
            className="text-sm transition-colors"
            style={{ color: '#9a8f7a' }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all border"
            style={{
              background: 'rgba(255,109,31,0.1)',
              borderColor: 'rgba(255,109,31,0.3)',
              color: '#FF6D1F',
            }}
          >
            Join free
          </Link>
        </div>

      </div>
    </nav>
  )
}
