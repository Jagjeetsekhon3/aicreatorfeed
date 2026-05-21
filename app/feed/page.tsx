'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/feed/PostCard'
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
  const [accessToken, setAccessToken] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
        supabase.from('likes').select('post_id').eq('user_id', data.session.user.id)
          .then(({ data: likes }) => {
            if (likes) setLikedIds(new Set(likes.map((l: any) => l.post_id)))
          })
      }
    })
  }, [])

  const loadPosts = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page
    if (reset) { setLoading(true); setPosts([]) }
    else setLoadingMore(true)

    const res = await fetch(`/api/posts?page=${currentPage}&filter=${filter}`)
    const data = await res.json()
    const newPosts = data.posts || []

    if (reset) setPosts(newPosts)
    else setPosts(prev => [...prev, ...newPosts])

    setHasMore(newPosts.length === 12)
    if (!reset) setPage(currentPage + 1)
    else setPage(1)

    setLoading(false)
    setLoadingMore(false)
  }, [filter, page])

  // Reload when filter changes
  useEffect(() => { loadPosts(true) }, [filter])

  const postsWithLikes = posts.map(p => ({ ...p, is_liked: likedIds.has(p.id) }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: '24px', alignItems: 'start' }}>

        {/* Feed */}
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px' }}>
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                background: filter === key ? '#FF6D1F' : '#2f2f2f',
                color: filter === key ? '#fff' : '#9a8f7a',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {/* Empty state */}
          {!loading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {filter === 'all' ? '🌱' : filter === 'image' ? '🖼️' : filter === 'video' ? '▶️' : '✍️'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>
                {filter === 'all' ? 'No posts yet' : `No ${filter} posts yet`}
              </h3>
              <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                Be the first to share something with the community!
              </p>
              <Link href="/post/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#FF6D1F', color: '#fff', fontWeight: 700,
                padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px',
              }}>
                + Share first post
              </Link>
            </div>
          )}

          {/* Posts */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {postsWithLikes.map((post, i) => (
                <div key={post.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                  <PostCard post={post} currentUserId={currentUserId} accessToken={accessToken} />
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && hasMore && posts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button onClick={() => loadPosts()} disabled={loadingMore} style={{
                background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F5E7C6', padding: '10px 28px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                {loadingMore
                  ? <><div style={{ width: '14px', height: '14px', border: '2px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Loading...</>
                  : 'Load more posts'
                }
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Share CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,109,31,0.15), rgba(255,109,31,0.05))', border: '1px solid rgba(255,109,31,0.2)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚀</div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', marginBottom: '6px' }}>Share your work</h3>
            <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '14px', lineHeight: 1.5 }}>Post prompts, images, or videos with the community</p>
            <Link href="/post/new" style={{
              display: 'block', background: '#FF6D1F', color: '#fff',
              fontWeight: 700, padding: '9px', borderRadius: '10px',
              textDecoration: 'none', fontSize: '13px',
            }}>+ Create post</Link>
          </div>

          {/* Trending tags */}
          <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>Trending tags</h3>
            {['midjourney', 'aiart', 'stablediffusion', 'promptengineering', 'sora', 'dalle', 'runway', 'aitools'].map(tag => (
              <button key={tag} onClick={() => {}} style={{
                display: 'inline-block', margin: '3px', padding: '4px 10px',
                background: 'rgba(255,255,255,0.05)', borderRadius: '999px',
                fontSize: '12px', color: '#9a8f7a', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,109,31,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF6D1F' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#9a8f7a' }}
              >#{tag}</button>
            ))}
          </div>

        </aside>
      </div>
    </div>
  )
}
