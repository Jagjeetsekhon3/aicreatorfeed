'use client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import type { Post } from '@/types'

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [copied, setCopied] = useState(false)

  function handleLike() { setLiked(!liked); setLikeCount(liked ? likeCount - 1 : likeCount + 1) }

  async function handleCopy() {
    if (!post.prompt_text) return
    await navigator.clipboard.writeText(post.prompt_text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      {post.image_url && (
        <div style={{ position: 'relative', paddingBottom: '100%', background: '#1a1a1a' }}>
          <img src={post.image_url} alt={post.caption} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {post.ai_tool && (
            <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,109,31,0.9)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
              {post.ai_tool}
            </span>
          )}
        </div>
      )}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Link href={`/profile/${post.user.username}`}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              {post.user.full_name[0]}
            </div>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/profile/${post.user.username}`} style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1' }}>{post.user.full_name}</Link>
            <p style={{ fontSize: '11px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
        </div>

        {post.caption && <p style={{ fontSize: '13px', color: '#F5E7C6', marginBottom: '10px', lineHeight: 1.5 }}>{post.caption}</p>}

        {post.prompt_text && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
              "{post.prompt_text}"
            </p>
          </div>
        )}

        {post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {post.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: liked ? '#FF6D1F' : '#9a8f7a' }}>
            {liked ? '♥' : '♡'} {likeCount}
          </button>
          <Link href={`/post/${post.id}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#9a8f7a' }}>
            💬 {post.comments_count}
          </Link>
          {post.prompt_text && (
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: copied ? '#FF6D1F' : '#9a8f7a' }}>
              {copied ? '✓ Copied!' : 'Copy prompt'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
