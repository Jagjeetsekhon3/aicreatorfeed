'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

export default function SpacePage() {
  const { name } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [space, setSpace] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const [showNewPost, setShowNewPost] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [joining, setJoining] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setCurrentUserId(data.session.user.id); setAccessToken(data.session.access_token) }
    })
  }, [])

  useEffect(() => {
    fetch(`/api/community?type=space&name=${name}`).then(r => r.json()).then(d => {
      if (!d.space) { router.push('/community'); return }
      setSpace(d.space)
    })
  }, [name])

  useEffect(() => {
    if (!space) return
    fetch(`/api/community?type=posts&space_id=${space.id}&sort=${sort}`).then(r => r.json()).then(d => {
      setPosts(d.posts || [])
      setLoading(false)
    })
  }, [space, sort])

  useEffect(() => {
    if (!accessToken || !space) return
    fetch('/api/community?type=membership', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json()).then(d => {
        setIsJoined((d.joined || []).some((m: any) => m.space_id === space.id))
      })
  }, [accessToken, space])

  async function handleJoin() {
    if (!currentUserId) { router.push('/auth/login'); return }
    setJoining(true)
    await fetch(`/api/community?action=${isJoined ? 'leave' : 'join'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ space_id: space.id }),
    })
    setIsJoined(!isJoined)
    setSpace((s: any) => ({ ...s, member_count: isJoined ? s.member_count - 1 : s.member_count + 1 }))
    setJoining(false)
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId) { router.push('/auth/login'); return }
    setPosting(true)
    const res = await fetch('/api/community?action=create_post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ space_id: space.id, title, content }),
    })
    const data = await res.json()
    if (data.post) {
      setPosts(prev => [data.post, ...prev])
      setTitle(''); setContent(''); setShowNewPost(false)
      setSpace((s: any) => ({ ...s, post_count: s.post_count + 1 }))
    }
    setPosting(false)
  }

  async function handleVote(postId: string) {
    if (!currentUserId) { router.push('/auth/login'); return }
    const wasVoted = votedIds.has(postId)
    setVotedIds(prev => { const n = new Set(prev); wasVoted ? n.delete(postId) : n.add(postId); return n })
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: wasVoted ? p.upvotes - 1 : p.upvotes + 1 } : p))
    await fetch('/api/community?action=vote_post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ post_id: postId }),
    })
  }

  if (!space || loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#FAF3E1', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Space header */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '80px', background: `linear-gradient(135deg, ${space.cover_color}44, ${space.cover_color}22)`, borderBottom: `3px solid ${space.cover_color}` }} />
        <div style={{ padding: '16px 20px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${space.cover_color}22`, border: `2px solid ${space.cover_color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, marginTop: '-36px' }}>
            {space.icon}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#FAF3E1', margin: 0 }}>{space.display_name}</h1>
              {space.is_official && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F' }}>Official</span>}
            </div>
            <p style={{ fontSize: '13px', color: '#9a8f7a', margin: '0 0 12px' }}>{space.description}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9a8f7a' }}>
              <span><strong style={{ color: '#FAF3E1' }}>{space.member_count.toLocaleString()}</strong> members</span>
              <span><strong style={{ color: '#FAF3E1' }}>{space.post_count}</strong> posts</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => { if (!currentUserId) { router.push('/auth/login'); return }; setShowNewPost(true) }} style={{ padding: '9px 18px', background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              + New post
            </button>
            <button onClick={handleJoin} disabled={joining} style={{ padding: '9px 18px', background: isJoined ? 'rgba(255,255,255,0.06)' : 'rgba(255,109,31,0.1)', color: isJoined ? '#9a8f7a' : '#FF6D1F', border: `1px solid ${isJoined ? 'rgba(255,255,255,0.1)' : 'rgba(255,109,31,0.3)'}`, borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              {joining ? '...' : isJoined ? 'Joined' : '+ Join'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', alignItems: 'start' }}>
        <div>
          {/* New post form */}
          {showNewPost && (
            <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,109,31,0.2)', borderRadius: '14px', padding: '18px', marginBottom: '16px', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', margin: 0 }}>New discussion</h3>
                <button onClick={() => setShowNewPost(false)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
              <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Discussion title..." required maxLength={200} style={inp} />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your thoughts, questions, or ideas..." required rows={5} maxLength={5000}
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowNewPost(false)} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9a8f7a', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={posting || !title.trim() || !content.trim()} style={{ padding: '9px 20px', background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 }}>
                    {posting ? 'Posting...' : 'Post discussion'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sort */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {(['new', 'top'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: sort === s ? '#FF6D1F' : '#2f2f2f', color: sort === s ? '#fff' : '#9a8f7a' }}>
                {s === 'new' ? '✨ New' : '🔥 Top'}
              </button>
            ))}
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#2f2f2f', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <h3 style={{ color: '#FAF3E1', marginBottom: '8px' }}>No posts yet</h3>
              <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '16px' }}>Start the first discussion in this space</p>
              <button onClick={() => setShowNewPost(true)} style={{ background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                + Start discussion
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {posts.map((post, i) => (
                <div key={post.id} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', transition: 'border-color 0.15s', animation: `fadeIn 0.25s ease ${i * 0.04}s both` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  {/* Vote */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => handleVote(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: votedIds.has(post.id) ? '#FF6D1F' : '#9a8f7a', lineHeight: 1, padding: '2px' }}>▲</button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: votedIds.has(post.id) ? '#FF6D1F' : '#FAF3E1' }}>{post.upvotes}</span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {post.is_pinned && <span style={{ fontSize: '11px', color: '#FF6D1F', fontWeight: 700, marginBottom: '4px', display: 'block' }}>📌 Pinned</span>}
                    <Link href={`/community/${name}/post/${post.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FAF3E1', margin: '0 0 6px', lineHeight: 1.4 }}>{post.title}</h3>
                    </Link>
                    <p style={{ fontSize: '13px', color: '#9a8f7a', margin: '0 0 10px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{post.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {post.user.avatar_url
                          ? <img src={post.user.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>{post.user.full_name?.[0]}</div>
                        }
                        <Link href={`/profile/${post.user.username}`} style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', textDecoration: 'none' }}>{post.user.full_name}</Link>
                        {(post.user.is_official || post.user.is_verified) && <VerifiedBadge isOfficial={post.user.is_official} size={12} />}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b6460' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      <Link href={`/community/${name}/post/${post.id}`} style={{ fontSize: '12px', color: '#9a8f7a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        💬 {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '10px' }}>About this space</h3>
            <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '12px' }}>{space.description || 'A community space for discussion.'}</p>
            {space.rules && (
              <>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#FAF3E1', marginBottom: '6px' }}>Rules</h4>
                <p style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.6 }}>{space.rules}</p>
              </>
            )}
            <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9a8f7a' }}>Members</span>
                <span style={{ fontWeight: 700, color: '#FAF3E1' }}>{space.member_count.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9a8f7a' }}>Posts</span>
                <span style={{ fontWeight: 700, color: '#FAF3E1' }}>{space.post_count}</span>
              </div>
            </div>
          </div>
          <Link href="/community" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#9a8f7a', textDecoration: 'none', padding: '10px', background: '#2f2f2f', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
            ← All spaces
          </Link>
        </aside>
      </div>
    </div>
  )
}
