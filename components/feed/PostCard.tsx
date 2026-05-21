'use client'
import { useState } from 'react'
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

const TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  'Midjourney':       { bg: 'rgba(255,109,31,0.15)', color: '#FF8540' },
  'DALL·E 3':         { bg: 'rgba(250,243,225,0.1)',  color: '#FAF3E1' },
  'Sora':             { bg: 'rgba(255,109,31,0.1)',   color: '#FF6D1F' },
  'Stable Diffusion': { bg: 'rgba(245,231,198,0.1)',  color: '#F5E7C6' },
  'Runway':           { bg: 'rgba(255,109,31,0.12)',  color: '#FF7A30' },
  'Flux':             { bg: 'rgba(255,109,31,0.08)',  color: '#FF9050' },
}

export default function PostCard({ post, currentUserId, accessToken }: { post: Post; currentUserId?: string; accessToken?: string }) {
  const [liked, setLiked] = useState(post.is_liked || false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [copied, setCopied] = useState(false)
  const [showFullPrompt, setShowFullPrompt] = useState(false)

  async function handleLike() {
    if (!currentUserId) { window.location.href = '/auth/login'; return }
    const prev = liked
    setLiked(!liked)
    setLikeCount(prev ? likeCount - 1 : likeCount + 1)
    await fetch('/api/posts/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ post_id: post.id }),
    })
  }

  async function handleCopy() {
    if (!post.prompt_text) return
    await navigator.clipboard.writeText(post.prompt_text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const toolStyle = post.ai_tool ? (TOOL_COLORS[post.ai_tool] || { bg: 'rgba(255,255,255,0.07)', color: '#9a8f7a' }) : null
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <article style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Image */}
      {post.media_type === 'image' && post.image_url && (
        <div style={{ position: 'relative' }}>
          <img src={post.image_url} alt={post.caption} style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'cover' }} />
          {post.ai_tool && toolStyle && (
            <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', backdropFilter: 'blur(8px)', background: toolStyle.bg, color: toolStyle.color }}>
              {post.ai_tool}
            </span>
          )}
        </div>
      )}

      {/* YouTube video — plays inline */}
      {post.media_type === 'video' && post.video_url && (
        <YouTubePlayer videoId={post.video_url} />
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            {post.user.avatar_url ? (
              <img src={post.user.avatar_url} alt={post.user.full_name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,109,31,0.3)' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, border: '2px solid rgba(255,109,31,0.3)' }}>
                {post.user.full_name?.[0] || '?'}
              </div>
            )}
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/profile/${post.user.username}`} style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', textDecoration: 'none' }}>
              {post.user.full_name}
            </Link>
            <div style={{ fontSize: '11px', color: '#9a8f7a' }}>@{post.user.username} · {timeAgo}</div>
          </div>
        </div>

        {/* Caption / text */}
        {post.caption && (
          <p style={{ fontSize: '14px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
            {post.caption}
          </p>
        )}

        {/* AI Prompt */}
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
                <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: copied ? '#FF6D1F' : '#9a8f7a', fontFamily: 'inherit', fontWeight: 600 }}>
                  {copied ? '✓ Copied!' : 'Copy'}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', color: liked ? '#FF6D1F' : '#9a8f7a',
            fontFamily: 'inherit', transition: 'color 0.15s',
            padding: '4px 0',
          }}>
            <span style={{ fontSize: '16px' }}>{liked ? '♥' : '♡'}</span>
            <span>{likeCount}</span>
          </button>

          <Link href={`/post/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#9a8f7a', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>💬</span>
            <span>{post.comments_count}</span>
          </Link>

          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9a8f7a' }}>
            🔖
          </button>
        </div>
      </div>
    </article>
  )
}
