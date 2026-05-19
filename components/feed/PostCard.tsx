'use client'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Copy, Bookmark } from 'lucide-react'
import { useState } from 'react'
import type { Post } from '@/types'

const AI_TOOL_COLORS: Record<string, { bg: string; color: string }> = {
  'Midjourney':        { bg: 'rgba(255,109,31,0.15)', color: '#FF8540' },
  'DALL·E 3':          { bg: 'rgba(250,243,225,0.12)', color: '#FAF3E1' },
  'Sora':              { bg: 'rgba(255,109,31,0.1)',  color: '#FF6D1F' },
  'Stable Diffusion':  { bg: 'rgba(245,231,198,0.12)', color: '#F5E7C6' },
  'Runway':            { bg: 'rgba(255,109,31,0.12)', color: '#FF7A30' },
  'Kling':             { bg: 'rgba(255,109,31,0.08)', color: '#FF9050' },
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [copied, setCopied] = useState(false)

  function handleLike() {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  async function handleCopy() {
    if (!post.prompt_text) return
    await navigator.clipboard.writeText(post.prompt_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toolStyle = post.ai_tool ? (AI_TOOL_COLORS[post.ai_tool] || { bg: 'rgba(255,255,255,0.08)', color: '#9a8f7a' }) : null

  return (
    <article
      className="rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px]"
      style={{ background: '#2f2f2f', border: '0.5px solid rgba(255,255,255,0.07)' }}
    >
      {/* Image */}
      {post.image_url && (
        <div className="relative aspect-square" style={{ background: '#222' }}>
          <Image
            src={post.image_url}
            alt={post.caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {post.ai_tool && toolStyle && (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur"
              style={{ background: toolStyle.bg, color: toolStyle.color }}
            >
              {post.ai_tool}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${post.user.username}`}>
            {post.user.avatar_url ? (
              <Image src={post.user.avatar_url} alt={post.user.full_name} width={34} height={34} className="rounded-full object-cover" />
            ) : (
              <div
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(255,109,31,0.2)', color: '#FF6D1F' }}
              >
                {post.user.full_name[0]}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${post.user.username}`} className="font-semibold text-sm transition-colors hover:opacity-80" style={{ color: '#FAF3E1' }}>
              {post.user.full_name}
            </Link>
            <p className="text-xs" style={{ color: '#9a8f7a' }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-2 line-clamp-2" style={{ color: '#F5E7C6' }}>{post.caption}</p>
        )}

        {/* Prompt preview */}
        {post.prompt_text && (
          <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-mono line-clamp-3 leading-relaxed" style={{ color: '#9a8f7a' }}>
              &ldquo;{post.prompt_text}&rdquo;
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center gap-4 pt-3"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: liked ? '#FF6D1F' : '#9a8f7a' }}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#9a8f7a' }}
          >
            <MessageCircle size={16} />
            <span>{post.comments_count}</span>
          </Link>

          {post.prompt_text && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm transition-colors ml-auto"
              style={{ color: copied ? '#FF6D1F' : '#9a8f7a' }}
            >
              <Copy size={14} />
              <span>{copied ? 'Copied!' : 'Copy prompt'}</span>
            </button>
          )}

          <button className="transition-colors" style={{ color: '#9a8f7a' }}>
            <Bookmark size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}
