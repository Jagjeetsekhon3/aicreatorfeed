'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

export default function SpacePostPage() {
  const { name, postId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const [post, setPost] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [postVoted, setPostVoted] = useState(false)
  const [votedReplies, setVotedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setCurrentUserId(data.session.user.id); setAccessToken(data.session.access_token) }
    })
    fetch(`/api/community?type=post&post_id=${postId}`).then(r => r.json()).then(d => {
      setPost(d.post); setReplies(d.replies || [])
      setLoading(false)
    })
  }, [postId])

  async function handleVotePost() {
    if (!currentUserId) { router.push('/auth/login'); return }
    setPostVoted(!postVoted)
    setPost((p: any) => ({ ...p, upvotes: postVoted ? p.upvotes - 1 : p.upvotes + 1 }))
    await fetch('/api/community?action=vote_post', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ post_id: postId }) })
  }

  async function handleVoteReply(replyId: string) {
    if (!currentUserId) { router.push('/auth/login'); return }
    const wasVoted = votedReplies.has(replyId)
    setVotedReplies(prev => { const n = new Set(prev); wasVoted ? n.delete(replyId) : n.add(replyId); return n })
    setReplies(prev => prev.map(r => r.id === replyId ? { ...r, upvotes: wasVoted ? r.upvotes - 1 : r.upvotes + 1 } : r))
    await fetch('/api/community?action=vote_reply', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ reply_id: replyId }) })
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId) { router.push('/auth/login'); return }
    if (!replyText.trim()) return
    setPosting(true)
    const res = await fetch('/api/community?action=reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ post_id: postId, content: replyText.trim() }),
    })
    const data = await res.json()
    if (data.reply) {
      setReplies(prev => [...prev, data.reply])
      setReplyText('')
      setPost((p: any) => ({ ...p, reply_count: p.reply_count + 1 }))
    }
    setPosting(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return
    await fetch('/api/community?action=delete_post', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ post_id: postId }) })
    router.push(`/community/${name}`)
  }

  if (loading || !post) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'var(--color-cream)', outline: 'none', fontFamily: 'inherit', resize: 'none' }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#9a8f7a' }}>
        <Link href="/community" style={{ color: '#9a8f7a', textDecoration: 'none' }}>Community</Link>
        <span>›</span>
        <Link href={`/community/${name}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
          {post.space?.icon} {post.space?.display_name}
        </Link>
      </div>

      {/* Post */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '16px' }}>
        {/* Votes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button onClick={handleVotePost} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: postVoted ? 'var(--color-primary)' : '#9a8f7a', lineHeight: 1 }}>▲</button>
          <span style={{ fontSize: '16px', fontWeight: 800, color: postVoted ? 'var(--color-primary)' : 'var(--color-cream)' }}>{post.upvotes}</span>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '12px', lineHeight: 1.3 }}>{post.title}</h1>
          <p style={{ fontSize: '15px', color: 'var(--color-beige)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{post.content}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              {post.user.avatar_url
                ? <img src={post.user.avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{post.user.full_name?.[0]}</div>
              }
              <Link href={`/profile/${post.user.username}`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{post.user.full_name}</Link>
              {(post.user.is_official || post.user.is_verified) && <VerifiedBadge isOfficial={post.user.is_official} size={13} />}
            </div>
            <span style={{ fontSize: '12px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            <span style={{ fontSize: '12px', color: '#9a8f7a' }}>💬 {post.reply_count} replies</span>
            {currentUserId === post.user_id && (
              <button onClick={handleDelete} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'rgba(255,80,80,0.6)', fontFamily: 'inherit' }}>Delete post</button>
            )}
            <button onClick={() => replyRef.current?.focus()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-primary)', fontFamily: 'inherit', fontWeight: 600, marginLeft: currentUserId === post.user_id ? '0' : 'auto' }}>
              Reply ↓
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '14px' }}>
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h3>
        {replies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9a8f7a', fontSize: '14px', background: '#2f2f2f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
            No replies yet — be the first to respond!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {replies.map((reply, i) => (
              <div key={reply.id} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px', animation: `fadeIn 0.2s ease ${i * 0.04}s both` }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <button onClick={() => handleVoteReply(reply.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: votedReplies.has(reply.id) ? 'var(--color-primary)' : '#9a8f7a', lineHeight: 1 }}>▲</button>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: votedReplies.has(reply.id) ? 'var(--color-primary)' : '#9a8f7a' }}>{reply.upvotes}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {reply.user.avatar_url
                      ? <img src={reply.user.avatar_url} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>{reply.user.full_name?.[0]}</div>
                    }
                    <Link href={`/profile/${reply.user.username}`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{reply.user.full_name}</Link>
                    {(reply.user.is_official || reply.user.is_verified) && <VerifiedBadge isOfficial={reply.user.is_official} size={12} />}
                    <span style={{ fontSize: '11px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-beige)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '12px' }}>Leave a reply</h3>
        {currentUserId ? (
          <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Write your reply..." rows={4} maxLength={2000}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleReply(e as any) }}
              style={inp} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#9a8f7a' }}>⌘+Enter to submit</span>
              <button type="submit" disabled={posting || !replyText.trim()} style={{ padding: '9px 20px', background: replyText.trim() ? 'var(--color-primary)' : '#333', color: replyText.trim() ? '#fff' : '#555', border: 'none', borderRadius: '8px', cursor: replyText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 }}>
                {posting ? 'Posting...' : 'Post reply'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Sign in to reply</Link>
          </div>
        )}
      </div>
    </div>
  )
}
