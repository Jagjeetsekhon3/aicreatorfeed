'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/feed/PostCard'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import Link from 'next/link'

const FILTERS = [
  { key: 'all',   label: '✦ All' },
  { key: 'image', label: '🖼 Images' },
  { key: 'video', label: '▶ Videos' },
  { key: 'text',  label: '✍ Text' },
]

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [accessToken, setAccessToken] = useState('')
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
        setIsLoggedIn(true)

        // Load who they follow
        supabase.from('follows').select('following_id').eq('follower_id', data.session.user.id)
          .then(({ data: follows }) => {
            const ids = (follows || []).map((f: any) => f.following_id)
            setFollowingIds(ids)
          })

        // Load liked posts
        supabase.from('likes').select('post_id').eq('user_id', data.session.user.id)
          .then(({ data: likes }) => {
            if (likes) setLikedIds(new Set(likes.map((l: any) => l.post_id)))
          })

        // Load bookmarked posts
        fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
          .then(r => r.json())
          .then(d => { if (d.posts) setBookmarkedIds(new Set(d.posts.map((p: any) => p.id))) })
      } else {
        setIsLoggedIn(false)
        setLoading(false)
      }
    })
  }, [])

  // Load suggested users to follow
  useEffect(() => {
    if (!currentUserId) return
    supabase.from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, is_official, followers_count')
      .not('id', 'eq', currentUserId)
      .order('followers_count', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!data) return
        const notFollowing = data.filter(u => !followingIds.includes(u.id))
        setSuggestedUsers(notFollowing.slice(0, 5))
      })
  }, [currentUserId, followingIds])

  const loadPosts = useCallback(async (reset = false) => {
    if (!currentUserId && !isLoggedIn) return
    const currentPage = reset ? 0 : page
    if (reset) { setLoading(true); setPosts([]) } else setLoadingMore(true)

    const limit = 12

    // Get official account posts + followed users posts
    let query = supabase
      .from('posts')
      .select('*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)')
      .order('created_at', { ascending: false })
      .range(currentPage * limit, (currentPage + 1) * limit - 1)

    if (followingIds.length > 0) {
      // Show posts from followed users + official account
      const officialResult = await supabase.from('profiles').select('id').eq('is_official', true)
      const officialIds = (officialResult.data || []).map((p: any) => p.id)
      const allIds = [...followingIds, ...officialIds].filter(Boolean)
      if (allIds.length > 0) query = query.in('user_id', allIds)
      else { setLoading(false); setLoadingMore(false); setPosts([]); return }
    } else {
      // Not following anyone — show official posts only
      const officialResult = await supabase.from('profiles').select('id').eq('is_official', true)
      const officialIds = (officialResult.data || []).map((p: any) => p.id)
      if (officialIds.length > 0) query = query.in('user_id', officialIds)
      else { setLoading(false); setLoadingMore(false); setPosts([]); return }
    }

    if (filter !== 'all') query = query.eq('media_type', filter)

    const { data, error } = await query
    const newPosts = data || []

    if (reset) setPosts(newPosts); else setPosts(prev => [...prev, ...newPosts])
    setHasMore(newPosts.length === limit)
    if (!reset) setPage(currentPage + 1); else setPage(1)
    setLoading(false); setLoadingMore(false)
  }, [filter, page, currentUserId, followingIds, isLoggedIn])

  useEffect(() => {
    if (currentUserId !== undefined || !isLoggedIn) loadPosts(true)
  }, [filter, followingIds, isLoggedIn])

  async function handleFollow(userId: string) {
    if (!currentUserId) { window.location.href = '/auth/login'; return }
    await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ following_id: userId, action: 'follow' }),
    })
    setFollowingIds(prev => [...prev, userId])
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const postsWithLikes = posts.map(p => ({ ...p, is_liked: likedIds.has(p.id), is_bookmarked: bookmarkedIds.has(p.id) }))

  // Not logged in
  if (!isLoggedIn) return (
    <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
      <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', marginBottom: '8px' }}>Join AiCreatorFeed</h2>
      <p style={{ color: '#9a8f7a', marginBottom: '24px', lineHeight: 1.6 }}>Sign in to see posts from creators you follow</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Link href="/auth/signup" style={{ background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>Join free</Link>
        <Link href="/auth/login" style={{ background: '#2f2f2f', color: '#F5E7C6', fontWeight: 600, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>Sign in</Link>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px', position: 'sticky', top: '64px', background: '#222222', paddingTop: '16px', zIndex: 10 }}>
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            background: filter === key ? '#FF6D1F' : '#2f2f2f',
            color: filter === key ? '#fff' : '#9a8f7a', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
        <Link href="/explore" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#9a8f7a', textDecoration: 'none', padding: '8px 12px', whiteSpace: 'nowrap' }}>
          Explore →
        </Link>
      </div>

      {/* Follow suggestions */}
      {suggestedUsers.length > 0 && (
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', margin: 0 }}>Suggested creators</h3>
            <Link href="/explore" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>See all</Link>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {suggestedUsers.map(user => (
              <div key={user.id} style={{ flexShrink: 0, textAlign: 'center', width: '100px', background: '#222', borderRadius: '12px', padding: '14px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Link href={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, margin: '0 auto 8px' }}>{user.full_name?.[0]}</div>
                  }
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#FAF3E1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '70px' }}>{user.full_name?.split(' ')[0]}</span>
                    {(user.is_verified || user.is_official) && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7.5" fill="#FF6D1F"/>
                        <path d="M4.5 8.5L6.5 10.5L11.5 5.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '8px' }}>@{user.username}</div>
                </Link>
                <button onClick={() => handleFollow(user.id)} style={{ width: '100%', padding: '5px 0', background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty — not following anyone */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>Your feed is empty</h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            Follow some creators to see their posts here, or explore trending content
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link href="/explore" style={{ background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
              Explore creators
            </Link>
            <Link href="/post/new" style={{ background: '#2f2f2f', color: '#F5E7C6', fontWeight: 600, padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              Share a post
            </Link>
          </div>
        </div>
      )}

      {/* Posts */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {postsWithLikes.map((post, i) => (
            <div key={post.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}>
              <PostCard post={post} currentUserId={currentUserId} accessToken={accessToken}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                initialBookmarked={(post as any).is_bookmarked}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={() => loadPosts()} disabled={loadingMore} style={{
            background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6',
            padding: '10px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
            {loadingMore ? <><div style={{ width: '14px', height: '14px', border: '2px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Loading...</> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
