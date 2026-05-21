'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import YouTubePlayer from '@/components/ui/YouTubePlayer'

type PostUser = { id: string; username: string; full_name: string; avatar_url: string | null }
type Post = {
  id: string; user_id: string; user: PostUser;
  caption: string; prompt_text: string | null;
  media_type: string; image_url: string | null; video_url: string | null;
  ai_tool: string | null; tags: string[];
  likes_count: number; comments_count: number;
  is_liked?: boolean; created_at: string;
}
type Comment = {
  id: string; content: string; created_at: string; user_id: string;
  user: { id: string; username: string; full_name: string; avatar_url: string | null }
}

const TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  'Midjourney':       { bg: 'rgba(255,109,31,0.15)', color: '#FF8540' },
  'DALL·E 3':         { bg: 'rgba(250,243,225,0.1)',  color: '#FAF3E1' },
  'Sora':             { bg: 'rgba(255,109,31,0.1)',   color: '#FF6D1F' },
  'Stable Diffusion': { bg: 'rgba(245,231,198,0.1)',  color: '#F5E7C6' },
  'Runway':           { bg: 'rgba(255,109,31,0.12)',  color: '#FF7A30' },
  'Flux':             { bg: 'rgba(255,109,31,0.08)',  color: '#FF9050' },
}

export default function PostCard({ post, currentUserId, accessToken, onDelete }: {
  post: Post; currentUserId?: string; accessToken?: string; onDelete?: (id: string) => void
}) {
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [copied, setCopied] = useState(false)
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const isOwner = currentUserId === post.user_id

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLike() {
    if (!currentUserId) { window.location.href = '/auth/login'; return }
    const prev = liked
    setLiked(!liked); setLikeCount(prev ? likeCount - 1 : likeCount + 1)
    await fetch('/api/posts/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: post.id }),
    })
  }

  async function handleToggleComments() {
    if (!showComments && !commentsLoaded) {
      const res = await fetch(`/api/comments?post_id=${post.id}`)
      const data = await res.json()
      setComments(data.comments || [])
      setCommentsLoaded(true)
    }
    setShowComments(!showComments)
    if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || !currentUserId) return
    setPosting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => [...prev, data.comment])
      setCommentText('')
      setCommentCount(c => c + 1)
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
    setCommentCount(c => Math.max(0, c - 1))
  }

  async function handleDeletePost() {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'DELETE',
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    })
    if (res.ok) { setDeleted(true); onDelete?.(post.id) }
    else setDeleting(false)
    setShowMenu(false)
  }

  if (deleted) return null

  const toolStyle = post.ai_tool ? (TOOL_COLORS[post.ai_tool] || { bg: 'rgba(255,255,255,0.07)', color: '#9a8f7a' }) : null
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <article style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Image */}
      {post.media_type === 'image' && post.image_url && (
        <div style={{ position: 'relative' }}>
          <img src={post.image_url} alt={post.caption} style={{ width: '100%', display: 'block', maxHeight: '520px', objectFit: 'cover' }} />
          {post.ai_tool && toolStyle && (
            <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', backdropFilter: 'blur(8px)', background: toolStyle.bg, color: toolStyle.color }}>
              {post.ai_tool}
            </span>
          )}
        </div>
      )}

      {/* YouTube */}
      {post.media_type === 'video' && post.video_url && <YouTubePlayer videoId={post.video_url} />}

      <div style={{ padding: '14px 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            {post.user.avatar_url
              ? <img src={post.user.avatar_url} alt={post.user.full_name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,109,31,0.3)' }} />
              : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, border: '2px solid rgba(255,109,31,0.3)' }}>
                  {post.user.full_name?.[0] || '?'}
                </div>
            }
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/profile/${post.user.username}`} style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none' }}>{post.user.full_name}</Link>
            <div style={{ fontSize: '11px', color: '#9a8f7a' }}>@{post.user.username} · {timeAgo}</div>
          </div>

          {/* 3-dot menu — only for post owner */}
          {isOwner && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: '#9a8f7a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontFamily: 'inherit',
              }}>⋯</button>
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', overflow: 'hidden', minWidth: '160px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50,
                  animation: 'fadeIn 0.15s ease',
                }}>
                  <Link href={`/post/${post.id}/edit`} onClick={() => setShowMenu(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px', textDecoration: 'none', color: '#F5E7C6', fontSize: '14px',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M10.5 2L13 4.5L5 12.5H2.5V10L10.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                    Edit post
                  </Link>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <button onClick={handleDeletePost} disabled={deleting} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ff8080', fontSize: '14px', fontFamily: 'inherit', textAlign: 'left',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 4H12.5M5 4V2.5H10V4M6 7V11.5M9 7V11.5M3.5 4L4.5 13H10.5L11.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {deleting ? 'Deleting...' : 'Delete post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption && <p style={{ fontSize: '14px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{post.caption}</p>}

        {/* Prompt */}
        {post.prompt_text && (
          <div style={{ background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6D1F' }}>✦ AI Prompt {post.ai_tool ? `· ${post.ai_tool}` : ''}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {post.prompt_text.length > 120 && (
                  <button onClick={() => setShowFullPrompt(!showFullPrompt)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9a8f7a', fontFamily: 'inherit' }}>
                    {showFullPrompt ? 'Show less' : 'Show more'}
                  </button>
                )}
                <button onClick={async () => { await navigator.clipboard.writeText(post.prompt_text!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: copied ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', fontWeight: 600 }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: showFullPrompt ? 'block' : '-webkit-box', WebkitLineClamp: showFullPrompt ? undefined : 2, WebkitBoxOrient: 'vertical' as const }}>
              "{post.prompt_text}"
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: liked ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', padding: '4px 0', transition: 'color 0.15s' }}>
            <span style={{ fontSize: '18px', transition: 'transform 0.1s' }}>{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
          </button>

          <button onClick={handleToggleComments} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: showComments ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', padding: '4px 0' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 10.5C14.5 11.052 14.052 11.5 13.5 11.5H4.5L2 14V3.5C2 2.948 2.448 2.5 3 2.5H13.5C14.052 2.5 14.5 2.948 14.5 3.5V10.5Z"/>
            </svg>
            <span>{commentCount}</span>
          </button>

          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9a8f7a' }}>🔖</button>
        </div>

        {/* Inline comments — Instagram style */}
        {showComments && (
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', animation: 'fadeIn 0.2s ease' }}>

            {/* Comments list */}
            {comments.length === 0 && commentsLoaded && (
              <p style={{ fontSize: '13px', color: '#9a8f7a', textAlign: 'center', padding: '12px 0' }}>No comments yet. Be the first!</p>
            )}
            {!commentsLoaded && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '12px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
                  <Link href={`/profile/${comment.user.username}`} style={{ flexShrink: 0 }}>
                    {comment.user.avatar_url
                      ? <img src={comment.user.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,109,31,0.15)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{comment.user.full_name?.[0]}</div>
                    }
                  </Link>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <Link href={`/profile/${comment.user.username}`} style={{ fontSize: '12px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none' }}>{comment.user.full_name}</Link>
                      <span style={{ fontSize: '11px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                      {currentUserId === comment.user_id && (
                        <button onClick={() => handleDeleteComment(comment.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(255,80,80,0.6)', fontFamily: 'inherit', padding: '0 2px' }}>
                          ✕
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#F5E7C6', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            {currentUserId ? (
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e as any) } }}
                  placeholder="Add a comment..."
                  rows={1}
                  maxLength={500}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                    padding: '9px 12px', fontSize: '13px', color: '#FAF3E1',
                    fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
                  }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 100) + 'px'
                  }}
                />
                <button type="submit" disabled={!commentText.trim() || posting} style={{
                  background: commentText.trim() ? '#FF6D1F' : 'rgba(255,255,255,0.06)',
                  color: commentText.trim() ? '#fff' : '#555',
                  border: 'none', borderRadius: '10px', padding: '9px 14px',
                  fontSize: '13px', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {posting ? '...' : 'Post'}
                </button>
              </form>
            ) : (
              <Link href="/auth/login" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600, padding: '8px' }}>
                Sign in to comment
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
