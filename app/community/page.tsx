'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CommunityPage() {
  const supabase = createClient()
  const router = useRouter()
  const [spaces, setSpaces] = useState<any[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
      }
    })
    fetch('/api/community?type=spaces').then(r => r.json()).then(d => {
      setSpaces(d.spaces || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/community?type=membership', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => {
        setJoined(new Set((d.joined || []).map((m: any) => m.space_id)))
      })
  }, [accessToken])

  async function handleJoin(spaceId: string, isJoined: boolean) {
    if (!currentUserId) { router.push('/auth/login'); return }
    setJoining(spaceId)
    await fetch(`/api/community?action=${isJoined ? 'leave' : 'join'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ space_id: spaceId }),
    })
    setJoined(prev => {
      const n = new Set(prev)
      isJoined ? n.delete(spaceId) : n.add(spaceId)
      return n
    })
    setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, member_count: isJoined ? Math.max(0, s.member_count - 1) : s.member_count + 1 } : s))
    setJoining(null)
  }

  const filtered = spaces.filter(s => !search || s.display_name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase()))
  const official = filtered.filter(s => s.is_official)
  const userCreated = filtered.filter(s => !s.is_official)
  const mySpaces = filtered.filter(s => joined.has(s.id))

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FAF3E1', marginBottom: '4px' }}>Community</h1>
          <p style={{ fontSize: '14px', color: '#9a8f7a' }}>Join spaces, discuss AI, share knowledge</p>
        </div>
        <Link href="/community/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
          + Create Space
        </Link>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 14px', marginBottom: '28px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5" stroke="#9a8f7a" strokeWidth="1.3"/>
          <path d="M11 11L14 14" stroke="#9a8f7a" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spaces..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#FAF3E1', fontFamily: 'inherit', padding: '13px 0' }} />
      </div>

      {/* My spaces */}
      {mySpaces.length > 0 && !search && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>Your spaces</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {mySpaces.map(space => (
              <Link key={space.id} href={`/community/${space.name}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2f2f2f', border: '1px solid rgba(255,109,31,0.2)', borderRadius: '10px', padding: '8px 14px', textDecoration: 'none' }}>
                <span style={{ fontSize: '16px' }}>{space.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1' }}>{space.display_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Official spaces */}
      {official.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>
            Official spaces
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F' }}>By AiCreatorFeed</span>
          </h2>
          <SpaceGrid spaces={official} joined={joined} onJoin={handleJoin} joining={joining} />
        </div>
      )}

      {/* User created */}
      {userCreated.length > 0 && (
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>Community spaces</h2>
          <SpaceGrid spaces={userCreated} joined={joined} onJoin={handleJoin} joining={joining} />
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <p style={{ color: '#9a8f7a' }}>No spaces found for "{search}"</p>
          <Link href="/community/create" style={{ display: 'inline-block', marginTop: '16px', color: '#FF6D1F', fontWeight: 600, textDecoration: 'none' }}>Create this space →</Link>
        </div>
      )}
    </div>
  )
}

function SpaceGrid({ spaces, joined, onJoin, joining }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
      {spaces.map((space: any) => {
        const isJoined = joined.has(space.id)
        const isJoining = joining === space.id
        return (
          <div key={space.id} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s', animation: 'fadeIn 0.2s ease' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            {/* Cover */}
            <div style={{ height: '6px', background: space.cover_color || '#FF6D1F' }} />
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${space.cover_color}22`, border: `1px solid ${space.cover_color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {space.icon}
                  </div>
                  <div>
                    <Link href={`/community/${space.name}`} style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none', display: 'block' }}>{space.display_name}</Link>
                    <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{space.member_count.toLocaleString()} members · {space.post_count} posts</div>
                  </div>
                </div>
                <button onClick={() => onJoin(space.id, isJoined)} disabled={isJoining} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                  border: isJoined ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  background: isJoined ? 'transparent' : '#FF6D1F',
                  color: isJoined ? '#9a8f7a' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                }}>
                  {isJoining ? '...' : isJoined ? 'Joined' : '+ Join'}
                </button>
              </div>
              {space.description && (
                <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{space.description}</p>
              )}
              <Link href={`/community/${space.name}`} style={{ display: 'inline-block', marginTop: '12px', fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>
                View space →
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
