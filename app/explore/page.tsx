'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import YouTubePlayer from '@/components/ui/YouTubePlayer'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

const SORTS = [
  { key: 'trending',  label: '🔥 Trending' },
  { key: 'top_liked', label: '♥ Most liked' },
  { key: 'latest',    label: '✨ Latest' },
]

const TOOLS = ['All tools', 'Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Flux']
const TYPES = ['All', 'Images', 'Videos', 'Text', 'Prompts']

const TRENDING_TAGS = ['midjourney','aiart','stablediffusion','promptengineering','sora','dalle','runway','flux','aitools','cinematic','portrait','abstract']

export default function ExplorePage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('trending')
  const [tool, setTool] = useState('All tools')
  const [type, setType] = useState('All')
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
        supabase.from('likes').select('post_id').eq('user_id', data.session.user.id)
          .then(({ data: l }) => { if (l) setLikedIds(new Set(l.map((x: any) => x.post_id))) })
      }
    })
  }, [])

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 0 : page
    if (reset) { setLoading(true); setPosts([]) }
    const limit = 18

    let query = supabase
      .from('posts')
      .select('*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url, is_verified, is_official)')
      .range(p * limit, (p + 1) * limit - 1)

    // Sort
    if (sort === 'top_liked') query = query.order('likes_count', { ascending: false })
    else if (sort === 'latest') query = query.order('created_at', { ascending: false })
    else query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false })

    // Type filter
    if (type === 'Images') query = query.eq('media_type', 'image')
    else if (type === 'Videos') query = query.eq('media_type', 'video')
    else if (type === 'Text') query = query.eq('media_type', 'text')
    else if (type === 'Prompts') query = query.not('prompt_text', 'is', null)

    // Tool filter
    if (tool !== 'All tools') query = query.eq('ai_tool', tool)

    // Tag filter
    if (tag) query = query.contains('tags', [tag])

    // Search
    if (search.trim()) query = query.ilike('caption', `%${search.trim()}%`)

    const { data, error } = await query
    if (error) { setLoading(false); return }

    if (reset) setPosts(data || [])
    else setPosts(prev => [...prev, ...(data || [])])
    setHasMore((data || []).length === limit)
    if (!reset) setPage(p + 1); else setPage(1)
    setLoading(false)
  }, [sort, tool, type, tag, search, page])

  useEffect(() => { loadPosts(true) }, [sort, tool, type, tag])

  function handleSearch(e: React.FormEvent) { e.preventDefault(); loadPosts(true) }

  const postsWithLikes = posts.map(p => ({ ...p, is_liked: likedIds.has(p.id) }))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FAF3E1', marginBottom: '4px' }}>Explore</h1>
        <p style={{ fontSize: '14px', color: '#9a8f7a' }}>Discover trending prompts, images and videos from the community</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 14px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5" stroke="#9a8f7a" strokeWidth="1.3"/>
              <path d="M11 11L14 14" stroke="#9a8f7a" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts, prompts, tools..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#FAF3E1', fontFamily: 'inherit', padding: '12px 0' }} />
          </div>
          <button type="submit" style={{ background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
        </div>
      </form>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {/* Sort */}
        {SORTS.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)} style={{
            padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: sort === s.key ? '#FF6D1F' : '#2f2f2f',
            color: sort === s.key ? '#fff' : '#9a8f7a',
          }}>{s.label}</button>
        ))}

        <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 4px' }} />

        {/* Type */}
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: type === t ? 'rgba(255,109,31,0.15)' : '#2f2f2f',
            color: type === t ? '#FF6D1F' : '#9a8f7a',
          }}>{t}</button>
        ))}
      </div>

      {/* Tool filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {TOOLS.map(t => (
          <button key={t} onClick={() => setTool(t)} style={{
            padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            border: `1px solid ${tool === t ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer', fontFamily: 'inherit',
            background: tool === t ? 'rgba(255,109,31,0.12)' : 'transparent',
            color: tool === t ? '#FF6D1F' : '#9a8f7a',
          }}>{t}</button>
        ))}
      </div>

      {/* Trending tags */}
      {!tag && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', marginBottom: '8px', letterSpacing: '0.05em' }}>TRENDING TAGS</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TRENDING_TAGS.map(t => (
              <button key={t} onClick={() => setTag(t)} style={{
                padding: '5px 12px', borderRadius: '999px', fontSize: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#9a8f7a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,109,31,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF6D1F'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,109,31,0.3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#9a8f7a'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
              >#{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Active tag filter */}
      {tag && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#9a8f7a' }}>Showing:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6D1F', background: 'rgba(255,109,31,0.1)', padding: '4px 12px', borderRadius: '999px' }}>#{tag}</span>
          <button onClick={() => setTag('')} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>✕ Clear</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔭</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>Nothing found</h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px' }}>Try different filters or be the first to post!</p>
        </div>
      )}

      {/* Grid */}
      {!loading && posts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {postsWithLikes.map((post, i) => (
            <ExploreCard key={post.id} post={post} index={i} currentUserId={currentUserId} accessToken={accessToken}
              onTagClick={(t: string) => setTag(t)}
              onLike={(id: string, liked: boolean) => setLikedIds(prev => { const n = new Set(prev); liked ? n.add(id) : n.delete(id); return n })}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button onClick={() => loadPosts()} style={{
            background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6',
            padding: '10px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Load more</button>
        </div>
      )}
    </div>
  )
}

function ExploreCard({ post, index, currentUserId, accessToken, onTagClick, onLike }: any) {
  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [copied, setCopied] = useState(false)

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    if (!currentUserId) { window.location.href = '/auth/login'; return }
    const prev = liked; setLiked(!liked); setLikeCount(prev ? likeCount - 1 : likeCount + 1)
    onLike(post.id, !prev)
    await fetch('/api/posts/like', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ post_id: post.id }) })
  }

  return (
    <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', animation: `fadeIn 0.3s ease ${index * 0.04}s both`, transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Media */}
      {post.media_type === 'image' && post.image_url && (
        <Link href={`/post/${post.id}`} style={{ display: 'block' }}>
          <img src={post.image_url} alt={post.caption} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
        </Link>
      )}
      {post.media_type === 'video' && post.video_url && (
        <YouTubePlayer videoId={post.video_url} />
      )}

      <div style={{ padding: '12px 14px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none' }}>
            {post.user.avatar_url
              ? <img src={post.user.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{post.user.full_name?.[0]}</div>
            }
          </Link>
          <Link href={`/profile/${post.user.username}`} style={{ fontSize: '12px', fontWeight: 600, color: '#F5E7C6', textDecoration: 'none' }}>{post.user.full_name}</Link>
          {(post.user.is_official || post.user.is_verified) && <VerifiedBadge isOfficial={post.user.is_official} size={12} />}
          {post.ai_tool && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,109,31,0.12)', color: '#FF6D1F' }}>{post.ai_tool}</span>}
        </div>

        {/* Caption */}
        {post.caption && (
          <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
            <p style={{ fontSize: '13px', color: '#F5E7C6', lineHeight: 1.5, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{post.caption}</p>
          </Link>
        )}

        {/* Prompt snippet */}
        {post.prompt_text && (
          <div style={{ background: 'rgba(255,109,31,0.04)', border: '1px solid rgba(255,109,31,0.12)', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6D1F' }}>✦ PROMPT</span>
              <button onClick={async () => { await navigator.clipboard.writeText(post.prompt_text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: copied ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', fontWeight: 600 }}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>"{post.prompt_text}"</p>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {post.tags.slice(0, 3).map((t: string) => (
              <button key={t} onClick={() => onTagClick(t)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>#{t}</button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: liked ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit' }}>
            {liked ? '♥' : '♡'} {likeCount}
          </button>
          <Link href={`/post/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>
            💬 {post.comments_count}
          </Link>
          <Link href={`/post/${post.id}`} style={{ marginLeft: 'auto', fontSize: '11px', color: '#9a8f7a', textDecoration: 'none', fontWeight: 600 }}>View →</Link>
        </div>
      </div>
    </div>
  )
}
