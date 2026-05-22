'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/feed/PostCard'
import Link from 'next/link'

export default function SavedPage() {
  const router = useRouter()
  const supabase = createClient()

  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { setAuthed(false); setLoading(false); return }
      setAuthed(true)
      setCurrentUserId(data.session.user.id)
      setAccessToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!accessToken) return
    loadPosts(0, true)
  }, [accessToken])

  async function loadPosts(p: number, reset = false) {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const res = await fetch(`/api/bookmarks?page=${p}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    const newPosts = data.posts || []

    setPosts(prev => reset ? newPosts : [...prev, ...newPosts])
    setHasMore(data.hasMore)
    setPage(p)
    setLoading(false)
    setLoadingMore(false)
  }

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (authed === false) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>🔖</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FAF3E1', margin: 0 }}>Sign in to see saved posts</h2>
      <p style={{ color: '#9a8f7a', fontSize: '14px', margin: 0 }}>Bookmark posts to save them for later.</p>
      <Link href="/auth/login" style={{ background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
        Sign in
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', margin: 0 }}>Saved posts</h1>
          {!loading && <p style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '4px' }}>{posts.length} saved{hasMore ? '+' : ''}</p>}
        </div>
        <Link href="/explore" style={{ fontSize: '13px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>
          Explore →
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔖</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>No saved posts yet</h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            Tap the bookmark icon on any post to save it here.
          </p>
          <Link href="/explore" style={{ display: 'inline-block', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
            Explore posts
          </Link>
        </div>
      )}

      {/* Posts */}
      {!loading && posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              accessToken={accessToken}
              onDelete={handleDelete}
              initialBookmarked={true}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <button
                onClick={() => loadPosts(page + 1)}
                disabled={loadingMore}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6', padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
