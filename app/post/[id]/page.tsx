'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import YouTubePlayer from '@/components/ui/YouTubePlayer'
import { RenderWithMentions } from '@/components/ui/MentionInput'

export default function PostPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const commentRef = useRef<HTMLTextAreaElement>(null)

  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
      }
    })
  }, [])

  useEffect(() => {
    async function load() {
      const admin_url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      // Load post
      const { data: postData } = await supabase
        .from('posts')
        .select('*, user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)')
        .eq('id', id)
        .single()

      if (!postData) { setLoading(false); return }
      setPost(postData)
      setLikeCount(postData.likes_count || 0)

      // Check if liked
      if (currentUserId) {
        const { data: likeData } = await supabase.from('likes').select('post_id').eq('user_id', currentUserId).eq('post_id', id as string).single()
        setLiked(!!likeData)
      }

      // Load comments
      const res = await fetch(`/api/comments?post_id=${id}`)
      const data = await res.json()
      setComments(data.comments || [])
      setLoading(false)
    }
    load()
  }, [id, currentUserId])

  async function handleLike() {
    if (!currentUserId) { router.push('/auth/login'); return }
    const prev = liked
    setLiked(!liked); setLikeCount(prev ? likeCount - 1 : likeCount + 1)
    await fetch('/api/posts/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: id }),
    })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || !currentUserId) return
    setPosting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: id, content: commentText.trim() }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => [...prev, data.comment])
      setCommentText('')
      setPost((p: any) => ({ ...p, comments_count: (p.comments_count || 0) + 1 }))
    }
    setPosting(false)
  }

  async function handleDeleteComment(comment_id: string) {
    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ comment_id }),
    })
    setComments(prev => prev.filter(c => c.id !== comment_id))
    setPost((p: any) => ({ ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }))
  }

  async function handleDeletePost() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    })
    if (res.ok) { router.push('/feed') }
    else setDeleting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!post) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ fontSize: '40px' }}>🔍</div>
      <p style={{ color: '#9a8f7a' }}>Post not found</p>
      <Link href="/feed" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>← Back to feed</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Back */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', marginBottom: '20px', padding: 0 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Post card */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>

        {/* Media */}
        {post.media_type === 'image' && (() => {
          const slides = (post.images && post.images.length > 0)
            ? post.images
            : (post.image_url ? [{ url: post.image_url, prompt_text: post.prompt_text, ai_tool: post.ai_tool }] : [])
          if (!slides.length) return null
          return (
            <div style={{ position: 'relative', background: '#111', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <img src={slides[carouselIdx]?.url} alt={post.caption}
                style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'cover' }} />

              {/* Arrows */}
              {slides.length > 1 && carouselIdx > 0 && (
                <button onClick={() => setCarouselIdx(i => i - 1)}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              )}
              {slides.length > 1 && carouselIdx < slides.length - 1 && (
                <button onClick={() => setCarouselIdx(i => i + 1)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              )}

              {/* Counter */}
              {slides.length > 1 && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.65)', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                  {carouselIdx + 1} / {slides.length}
                </div>
              )}

              {/* Dot indicators */}
              {slides.length > 1 && (
                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                  {slides.map((_: any, i: number) => (
                    <button key={i} onClick={() => setCarouselIdx(i)}
                      style={{ width: i === carouselIdx ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === carouselIdx ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
                  ))}
                </div>
              )}

              {/* Per-slide AI tool badge */}
              {slides[carouselIdx]?.ai_tool && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: '#FF8540' }}>
                  {slides[carouselIdx].ai_tool}
                </div>
              )}
            </div>
          )
        })()}
        {post.media_type === 'video' && post.video_url && (
          <YouTubePlayer videoId={post.video_url} />
        )}

        <div style={{ padding: '16px 18px' }}>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              {post.user.avatar_url
                ? <img src={post.user.avatar_url} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,109,31,0.3)' }} />
                : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>{post.user.full_name?.[0]}</div>
              }
            </Link>
            <div>
              <Link href={`/profile/${post.user.username}`} style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{post.user.full_name}</Link>
              <div style={{ fontSize: '12px', color: '#9a8f7a' }}>@{post.user.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
            </div>

            {/* 3-dot menu — post owner only */}
            {currentUserId === post.user.id && (
              <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto' }}>
                <button onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8f7a', padding: '4px 8px', borderRadius: '8px', fontSize: '18px', fontFamily: 'inherit', lineHeight: 1 }}>⋯</button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '6px', width: '150px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    <Link href={`/post/${id}/edit`} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      ✏️ Edit post
                    </Link>
                    <button onClick={handleDeletePost} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: '#ff8080', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,80,0.08)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                      🗑 {deleting ? 'Deleting…' : 'Delete post'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          {post.caption && <p style={{ fontSize: '15px', color: 'var(--color-beige)', lineHeight: 1.65, marginBottom: '14px', whiteSpace: 'pre-wrap' }}><RenderWithMentions text={post.caption} /></p>}

          {/* Prompt — shows current slide's prompt for carousel posts */}
          {(() => {
            const slides = (post.images && post.images.length > 0) ? post.images : (post.image_url ? [{ url: post.image_url, prompt_text: post.prompt_text, ai_tool: post.ai_tool }] : [])
            const slidePrompt = slides[carouselIdx]?.prompt_text || post.prompt_text
            const slideTool = slides[carouselIdx]?.ai_tool || post.ai_tool
            const isCarousel = slides.length > 1
            if (!slidePrompt) return null
            return (
              <div style={{ background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ✦ AI PROMPT {slideTool ? `· ${slideTool}` : ''}{isCarousel ? ` (image ${carouselIdx + 1})` : ''}
                  </span>
                  <button onClick={async () => { await navigator.clipboard.writeText(slidePrompt); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: copied ? 'var(--color-primary)' : '#9a8f7a', fontFamily: 'inherit' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>"{slidePrompt}"</p>
              </div>
            )
          })()}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {post.tags.map((t: string) => <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>#{t}</span>)}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '20px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: liked ? 'var(--color-primary)' : '#9a8f7a', fontFamily: 'inherit' }}>
              <span style={{ fontSize: '18px' }}>{liked ? '♥' : '♡'}</span> {likeCount}
            </button>
            <button onClick={() => commentRef.current?.focus()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#9a8f7a', fontFamily: 'inherit' }}>
              <span style={{ fontSize: '18px' }}>💬</span> {comments.length}
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-cream)', margin: 0 }}>Comments ({comments.length})</h3>
        </div>

        {/* Comment input */}
        {currentUserId ? (
          <form onSubmit={handleComment} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              ref={commentRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e as any) } }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: 'var(--color-cream)', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }}
            />
            <button type="submit" disabled={!commentText.trim() || posting} style={{
              background: commentText.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
              color: commentText.trim() ? '#fff' : '#555',
              border: 'none', borderRadius: '10px', padding: '10px 16px',
              fontSize: '13px', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.2s',
            }}>
              {posting ? '...' : 'Post'}
            </button>
          </form>
        ) : (
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Sign in to comment</Link>
          </div>
        )}

        {/* Comments list */}
        <div style={{ padding: comments.length ? '8px 0' : '0' }}>
          {comments.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#9a8f7a', fontSize: '14px' }}>
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: '10px', padding: '12px 18px', animation: 'fadeIn 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Link href={`/profile/${comment.user.username}`} style={{ flexShrink: 0 }}>
                  {comment.user.avatar_url
                    ? <img src={comment.user.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,109,31,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{comment.user.full_name?.[0]}</div>
                  }
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Link href={`/profile/${comment.user.username}`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{comment.user.full_name}</Link>
                    <span style={{ fontSize: '11px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    {currentUserId === comment.user_id && (
                      <button onClick={() => handleDeleteComment(comment.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9a8f7a', fontFamily: 'inherit', padding: '2px 4px' }}>Delete</button>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-beige)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
