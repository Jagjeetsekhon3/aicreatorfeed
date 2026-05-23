'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import YouTubePlayer from '@/components/ui/YouTubePlayer'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import MentionInput, { RenderWithMentions } from '@/components/ui/MentionInput'

type PostUser = { id: string; username: string; full_name: string; avatar_url: string | null; is_verified?: boolean; is_official?: boolean }
type Post = {
  id: string; user_id: string; user: PostUser;
  caption: string; prompt_text: string | null;
  media_type: string; image_url: string | null; video_url: string | null;
  ai_tool: string | null; tags: string[];
  likes_count: number; comments_count: number;
  is_liked?: boolean; is_bookmarked?: boolean; created_at: string;
}
type Comment = {
  id: string; content: string; created_at: string; user_id: string; parent_id: string | null;
  user: { id: string; username: string; full_name: string; avatar_url: string | null }
  replies?: Comment[]
}

const TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  'Midjourney':         { bg: 'rgba(255,109,31,0.15)', color: '#FF8540' },
  'DALL·E 3':           { bg: 'rgba(250,243,225,0.1)',  color: '#FAF3E1' },
  'Stable Diffusion':   { bg: 'rgba(245,231,198,0.1)',  color: '#F5E7C6' },
  'Sora':               { bg: 'rgba(255,109,31,0.1)',   color: '#FF6D1F' },
  'Runway':             { bg: 'rgba(255,122,48,0.12)',  color: '#FF7A30' },
}

export default function PostCard({ post, currentUserId, accessToken, onDelete, initialBookmarked }: {
  post: Post; currentUserId?: string; accessToken?: string
  onDelete?: (id: string) => void; initialBookmarked?: boolean
}) {
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false)
  const [bookmarking, setBookmarking] = useState(false)
  const [showSaveMenu, setShowSaveMenu] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [collectionsLoaded, setCollectionsLoaded] = useState(false)
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShare(false)
      if (saveRef.current && !saveRef.current.contains(e.target as Node)) setShowSaveMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (deleted) return null

  async function handleLike() {
    if (!currentUserId) return
    setLiked(p => !p); setLikeCount(p => p + (liked ? -1 : 1))
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
    setShowComments(v => !v)
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
      setCommentCount(c => c + 1)
      setCommentText('')
    }
    setPosting(false)
  }

  async function handleReply(parentComment: Comment) {
    if (!replyText.trim() || !currentUserId) return
    setPostingReply(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: post.id, content: replyText.trim(), parent_id: parentComment.id }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => prev.map(c =>
        c.id === parentComment.id ? { ...c, replies: [...(c.replies || []), data.comment] } : c
      ))
      setCommentCount(c => c + 1)
      setReplyText('')
      setReplyingTo(null)
    }
    setPostingReply(false)
  }

  async function handleDeleteComment(commentId: string, parentId?: string) {
    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ comment_id: commentId }),
    })
    if (parentId) {
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) } : c))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
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

  async function handleBookmark() {
    if (!currentUserId) return
    setBookmarking(true)
    const prev = bookmarked
    setBookmarked(!prev)
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: post.id }),
    })
    if (!res.ok) setBookmarked(prev)
    setBookmarking(false)
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/post/${post.id}`
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
    setShowShare(false)
  }

  async function openSaveMenu() {
    if (!currentUserId) return
    setShowSaveMenu(v => !v)
    if (!collectionsLoaded) {
      const res = await fetch(`/api/collections?user_id=${currentUserId}`, {
        headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      })
      const data = await res.json()
      setCollections(data.collections || [])
      setCollectionsLoaded(true)
    }
  }

  async function saveToCollection(collectionId: string) {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ post_id: post.id, collection_id: collectionId }),
    })
    const data = await res.json()
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, _saved: data.saved } : c))
    setBookmarked(data.saved)
    setShowSaveMenu(false)
  }

  async function createAndSave() {
    const name = prompt('Collection name:')
    if (!name?.trim()) return
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()
    if (data.collection) {
      await saveToCollection(data.collection.id)
      setCollections(prev => [...prev, data.collection])
    }
  }

  const toolStyle = post.ai_tool ? (TOOL_COLORS[post.ai_tool] || { bg: 'rgba(255,255,255,0.06)', color: '#9a8f7a' }) : null

  return (
    <article style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Link href={`/profile/${post.user.username}`} style={{ flexShrink: 0 }}>
            {post.user.avatar_url
              ? <img src={post.user.avatar_url} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,109,31,0.15)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>{post.user.full_name?.[0]}</div>
            }
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Link href={`/profile/${post.user.username}`} style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none' }}>{post.user.full_name}</Link>
              {(post.user.is_verified || post.user.is_official) && <VerifiedBadge isOfficial={post.user.is_official} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#9a8f7a' }}>@{post.user.username}</span>
              <span style={{ fontSize: '12px', color: '#555' }}>·</span>
              <span style={{ fontSize: '12px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {toolStyle && post.ai_tool && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '4px', background: toolStyle.bg, color: toolStyle.color }}>{post.ai_tool}</span>
              )}
            </div>
          </div>

          {/* 3-dot menu (own post) */}
          {currentUserId === post.user_id && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8f7a', padding: '4px 6px', borderRadius: '8px', fontSize: '18px', lineHeight: 1 }}>⋯</button>
              {showMenu && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', minWidth: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50 }}>
                  <Link href={`/post/${post.id}/edit`} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', textDecoration: 'none', color: '#F5E7C6', fontSize: '13px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    ✏️ Edit post
                  </Link>
                  <button onClick={handleDeletePost} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff8080', fontSize: '13px', fontFamily: 'inherit' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,80,80,0.08)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                    🗑 {deleting ? 'Deleting...' : 'Delete post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption with @mentions */}
        {post.caption && (
          <p style={{ fontSize: '14px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
            <RenderWithMentions text={post.caption} />
          </p>
        )}

        {/* Prompt */}
        {post.prompt_text && (
          <div style={{ background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6D1F' }}>✦ AI Prompt {post.ai_tool ? `· ${post.ai_tool}` : ''}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {post.prompt_text.length > 120 && (
                  <button onClick={() => setShowFullPrompt(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9a8f7a', fontFamily: 'inherit' }}>{showFullPrompt ? 'Less' : 'More'}</button>
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
      </div>

      {/* Image */}
      {post.media_type === 'image' && post.image_url && (
        <Link href={`/post/${post.id}`}>
          <img src={post.image_url} alt={post.caption} style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover', cursor: 'pointer' }} />
        </Link>
      )}

      {/* Video */}
      {post.media_type === 'video' && post.video_url && (
        <div style={{ borderRadius: 0 }}>
          <YouTubePlayer videoId={post.video_url} />
        </div>
      )}

      <div style={{ padding: '10px 16px 14px' }}>
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '10px', borderBottom: showComments ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          {/* Like */}
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: liked ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', padding: '4px 0', transition: 'color 0.15s' }}>
            <span style={{ fontSize: '18px' }}>{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <button onClick={handleToggleComments} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: showComments ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', padding: '4px 0' }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10.5C14.5 11.052 14.052 11.5 13.5 11.5H4.5L2 14V3.5C2 2.948 2.448 2.5 3 2.5H13.5C14.052 2.5 14.5 2.948 14.5 3.5V10.5Z"/></svg>
            <span>{commentCount}</span>
          </button>

          {/* Share */}
          <div ref={shareRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowShare(v => !v)} title="Share" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: showShare ? '#FF6D1F' : '#9a8f7a', padding: '4px 0', transition: 'color 0.15s' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="13" r="1.5"/>
                <line x1="5.47" y1="7.28" x2="10.54" y2="4.22"/><line x1="5.47" y1="8.72" x2="10.54" y2="11.78"/>
              </svg>
            </button>
            {showShare && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', width: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50 }}>
                {[
                  { label: '🔗 Copy link',      action: handleCopyLink },
                  { label: '𝕏 Share on X',      action: () => { window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/post/${post.id}`)}&text=${encodeURIComponent(post.caption?.slice(0,100) || 'Check this out on AiCreatorFeed')}`, '_blank'); setShowShare(false) } },
                  { label: '💬 Share on WhatsApp', action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(`${post.caption?.slice(0,80) || 'Check this out'} ${window.location.origin}/post/${post.id}`)}`, '_blank'); setShowShare(false) } },
                  { label: '📋 Copy post URL',  action: handleCopyLink },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#F5E7C6', fontSize: '13px', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                    {linkCopied && label.includes('Copy') ? '✓ Copied!' : label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save to collection */}
          <div ref={saveRef} style={{ marginLeft: 'auto', position: 'relative' }}>
            <button onClick={openSaveMenu} disabled={!currentUserId} title="Save to collection"
              style={{ background: 'none', border: 'none', cursor: currentUserId ? 'pointer' : 'default', color: bookmarked ? '#FF6D1F' : '#9a8f7a', padding: '4px', transition: 'color 0.15s, transform 0.1s', transform: bookmarking ? 'scale(0.85)' : 'scale(1)', display: 'flex', alignItems: 'center' }}>
              {bookmarked ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#FF6D1F" stroke="#FF6D1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h10v13l-5-3-5 3V2z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h10v13l-5-3-5 3V2z"/></svg>
              )}
            </button>
            {showSaveMenu && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', width: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50 }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: '#9a8f7a', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>SAVE TO COLLECTION</div>
                {collections.length === 0 && collectionsLoaded && (
                  <div style={{ padding: '10px 14px', fontSize: '12px', color: '#9a8f7a' }}>No collections yet</div>
                )}
                {collections.map(c => (
                  <button key={c.id} onClick={() => saveToCollection(c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#F5E7C6', fontSize: '13px', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                    <span>📁 {c.name}</span>
                    {c._saved && <span style={{ color: '#FF6D1F', fontSize: '12px' }}>✓</span>}
                  </button>
                ))}
                <button onClick={createAndSave} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: '#FF6D1F', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,109,31,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                  + New collection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div style={{ paddingTop: '12px', animation: 'fadeIn 0.2s ease' }}>
            {!commentsLoaded && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {commentsLoaded && comments.length === 0 && (
              <p style={{ fontSize: '13px', color: '#9a8f7a', textAlign: 'center', padding: '10px 0' }}>No comments yet. Be the first!</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
              {comments.map(comment => (
                <div key={comment.id}>
                  {/* Top-level comment */}
                  <div style={{ display: 'flex', gap: '8px' }}>
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
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {currentUserId && (
                            <button onClick={() => { setReplyingTo(replyingTo?.id === comment.id ? null : comment); setReplyText(`@${comment.user.username} `) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9a8f7a', fontFamily: 'inherit', fontWeight: 600 }}>
                              Reply
                            </button>
                          )}
                          {currentUserId === comment.user_id && (
                            <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(255,80,80,0.6)', fontFamily: 'inherit' }}>✕</button>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#F5E7C6', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                        <RenderWithMentions text={comment.content} />
                      </p>
                    </div>
                  </div>

                  {/* Replies */}
                  {(comment.replies || []).length > 0 && (
                    <div style={{ marginLeft: '36px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(comment.replies || []).map(reply => (
                        <div key={reply.id} style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ width: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', flexShrink: 0 }} />
                          <Link href={`/profile/${reply.user.username}`} style={{ flexShrink: 0 }}>
                            {reply.user.avatar_url
                              ? <img src={reply.user.avatar_url} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                              : <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,109,31,0.15)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>{reply.user.full_name?.[0]}</div>
                            }
                          </Link>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '6px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <Link href={`/profile/${reply.user.username}`} style={{ fontSize: '11px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none' }}>{reply.user.full_name}</Link>
                              <span style={{ fontSize: '10px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                              {currentUserId === reply.user_id && (
                                <button onClick={() => handleDeleteComment(reply.id, comment.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: 'rgba(255,80,80,0.6)', fontFamily: 'inherit' }}>✕</button>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#F5E7C6', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                              <RenderWithMentions text={reply.content} />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingTo?.id === comment.id && currentUserId && (
                    <div style={{ marginLeft: '36px', marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
                      <MentionInput
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={`Reply to @${comment.user.username}...`}
                        rows={1}
                        style={{ fontSize: '12px', padding: '7px 10px' }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment) } if (e.key === 'Escape') setReplyingTo(null) }}
                      />
                      <button onClick={() => handleReply(comment)} disabled={!replyText.trim() || postingReply}
                        style={{ background: replyText.trim() ? '#FF6D1F' : 'rgba(255,255,255,0.06)', color: replyText.trim() ? '#fff' : '#555', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        {postingReply ? '...' : 'Reply'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Main comment input */}
            {currentUserId ? (
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <MentionInput
                  value={commentText}
                  onChange={setCommentText}
                  inputRef={commentInputRef}
                  placeholder="Add a comment... (@mention someone)"
                  rows={1}
                  style={{ fontSize: '13px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e as any) } }}
                />
                <button type="submit" disabled={!commentText.trim() || posting}
                  style={{ background: commentText.trim() ? '#FF6D1F' : 'rgba(255,255,255,0.06)', color: commentText.trim() ? '#fff' : '#555', border: 'none', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', flexShrink: 0 }}>
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
