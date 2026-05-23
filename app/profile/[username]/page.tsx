'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import YouTubePlayer from '@/components/ui/YouTubePlayer'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

function MessageButton({ profileId, username, currentUserId }: { profileId: string; username: string; currentUserId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setAccessToken(data.session.access_token) })
  }, [])
  async function handleMessage() {
    if (!currentUserId) { router.push('/auth/login'); return }
    setLoading(true)
    const res = await fetch(`/api/messages?type=conversation&user_id=${profileId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.conversation) { router.push(`/messages/${data.conversation.id}`); return }
    const startRes = await fetch('/api/messages?action=start', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ other_user_id: profileId, message: `Hey @${username}! 👋` }),
    })
    const startData = await startRes.json()
    if (startData.conversation_id) router.push(`/messages/${startData.conversation_id}`)
    setLoading(false)
  }
  return (
    <button onClick={handleMessage} disabled={loading} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: '#F5E7C6', display: 'flex', alignItems: 'center', gap: '5px' }}>
      {loading ? '...' : '💬 Message'}
    </button>
  )
}

type Profile = {
  id: string; username: string; full_name: string; avatar_url: string | null
  bio: string | null; website: string | null; twitter: string | null
  instagram: string | null; youtube: string | null
  followers_count: number; following_count: number; posts_count: number
  is_verified: boolean; is_official: boolean
}

type Post = {
  id: string; caption: string; media_type: string
  image_url: string | null; video_url: string | null
  prompt_text: string | null; ai_tool: string | null
  tags: string[]; likes_count: number; comments_count: number; created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'prompts'>('posts')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editForm, setEditForm] = useState({ caption: '', prompt_text: '', ai_tool: '', tags: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [aiTools, setAiTools] = useState<string[]>(['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Flux', 'Other'])
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null)
  const [followModalUsers, setFollowModalUsers] = useState<any[]>([])
  const [followModalLoading, setFollowModalLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setCurrentUserId(data.session.user.id)
        setAccessToken(data.session.access_token)
      }
    })
    fetch('/api/ai-tools').then(r => r.json()).then(d => {
      if (d.tools?.length) setAiTools(d.tools.map((t: any) => t.name))
    })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).single()
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      const { data: userPosts } = await supabase.from('posts').select('*')
        .eq('user_id', prof.id).order('created_at', { ascending: false })
      setPosts(userPosts || [])

      if (currentUserId && currentUserId !== prof.id) {
        const res = await fetch(`/api/follow?following_id=${prof.id}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        })
        const fdata = await res.json()
        setIsFollowing(fdata.following)
      }
      setLoading(false)
    }
    load()
  }, [username, currentUserId, accessToken])

  async function handleFollow() {
    if (!currentUserId) { router.push('/auth/login'); return }
    setFollowLoading(true)
    const wasFollowing = isFollowing

    // Optimistic update
    setIsFollowing(!wasFollowing)
    setProfile(p => p ? { ...p, followers_count: wasFollowing ? Math.max(0, p.followers_count - 1) : p.followers_count + 1 } : p)

    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ following_id: profile!.id, action: wasFollowing ? 'unfollow' : 'follow' }),
    })
    const data = await res.json()
    if (data.error) {
      setIsFollowing(wasFollowing)
      setProfile(p => p ? { ...p, followers_count: wasFollowing ? p.followers_count + 1 : Math.max(0, p.followers_count - 1) } : p)
    } else {
      const { data: fresh } = await supabase.from('profiles').select('followers_count, following_count').eq('id', profile!.id).single()
      if (fresh) setProfile(p => p ? { ...p, followers_count: fresh.followers_count } : p)
    }
    setFollowLoading(false)
  }

  async function openFollowModal(type: 'followers' | 'following') {
    if (!profile) return
    setFollowModal(type)
    setFollowModalLoading(true)
    const res = await fetch(`/api/follow?type=${type}&profile_id=${profile.id}`)
    const data = await res.json()
    setFollowModalUsers(data.users || [])
    setFollowModalLoading(false)
  }

  function openEditPost(post: Post) {
    setEditingPost(post)
    setSelectedPost(null)
    setEditForm({
      caption: post.caption || '',
      prompt_text: post.prompt_text || '',
      ai_tool: post.ai_tool || '',
      tags: post.tags?.join(', ') || '',
    })
  }

  async function handleSaveEdit() {
    if (!editingPost) return
    setEditSaving(true)
    const res = await fetch(`/api/posts/${editingPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        caption: editForm.caption,
        prompt_text: editForm.prompt_text || null,
        ai_tool: editForm.ai_tool || null,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }),
    })
    if (res.ok) {
      const { post: updated } = await res.json()
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updated } : p))
      setEditingPost(null)
    }
    setEditSaving(false)
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setDeletingPostId(postId)
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId))
      setSelectedPost(null)
      setEditingPost(null)
    }
    setDeletingPostId(null)
  }

  const isOwnProfile = currentUserId === profile?.id
  const promptPosts = posts.filter(p => p.prompt_text)
  const displayPosts = activeTab === 'prompts' ? promptPosts : posts

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>🔍</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FAF3E1' }}>Profile not found</h2>
      <p style={{ color: '#9a8f7a' }}>@{username} doesn't exist</p>
      <Link href="/feed" style={{ color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>← Back to feed</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* Profile header */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>

        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,109,31,0.4)' }} />
            : <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', border: '3px solid rgba(255,109,31,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: '#FF6D1F' }}>
                {profile?.full_name?.[0] || '?'}
              </div>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {/* Name + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', margin: 0 }}>{profile?.full_name}</h1>
            {profile?.is_official && <VerifiedBadge isOfficial size={20} />}
            {!profile?.is_official && profile?.is_verified && <VerifiedBadge size={20} />}
            <span style={{ fontSize: '15px', color: '#9a8f7a' }}>@{profile?.username}</span>
            {isOwnProfile ? (
              <Link href="/settings" style={{ padding: '6px 16px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '13px', color: '#F5E7C6', textDecoration: 'none', fontWeight: 600 }}>
                Edit profile
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleFollow} disabled={followLoading} style={{
                  padding: '7px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  background: isFollowing ? 'rgba(255,255,255,0.08)' : '#FF6D1F',
                  color: isFollowing ? '#F5E7C6' : '#fff',
                }}>
                  {followLoading ? '...' : isFollowing ? 'Following' : '+ Follow'}
                </button>
                <MessageButton profileId={profile?.id || ''} username={profile?.username || ''} currentUserId={currentUserId} />
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
            {[
              { num: posts.length, label: 'posts', onClick: null },
              { num: profile?.followers_count || 0, label: 'followers', onClick: () => openFollowModal('followers') },
              { num: profile?.following_count || 0, label: 'following', onClick: () => openFollowModal('following') },
            ].map(({ num, label, onClick }) => (
              <div
                key={label}
                onClick={onClick || undefined}
                style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = '0.75' }}
                onMouseLeave={e => { if (onClick) e.currentTarget.style.opacity = '1' }}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FAF3E1' }}>{num.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: onClick ? '#FF6D1F' : '#9a8f7a' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p style={{ fontSize: '14px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '10px', whiteSpace: 'pre-wrap', maxWidth: '400px' }}>
              {profile.bio}
            </p>
          )}

          {/* Links */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {profile?.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#FF6D1F', textDecoration: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6.5H12M6.5 1C5 3.5 5 9.5 6.5 12M6.5 1C8 3.5 8 9.5 6.5 12" stroke="currentColor" strokeWidth="1.2"/></svg>
                {profile.website.replace(/https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {profile?.twitter && (
              <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>
                𝕏 {profile.twitter}
              </a>
            )}
            {profile?.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>
                📸 {profile.instagram}
              </a>
            )}
            {profile?.youtube && (
              <a href={profile.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#9a8f7a', textDecoration: 'none' }}>
                ▶ YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '24px' }}>
        {[
          { key: 'posts', label: `Posts (${posts.length})` },
          { key: 'prompts', label: `Prompts (${promptPosts.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as any)} style={{
            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
            color: activeTab === key ? '#FF6D1F' : '#9a8f7a',
            borderBottom: `2px solid ${activeTab === key ? '#FF6D1F' : 'transparent'}`,
            marginBottom: '-1px', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Posts grid */}
      {displayPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeTab === 'prompts' ? '✨' : '📸'}</div>
          <p style={{ color: '#9a8f7a', fontSize: '15px' }}>
            {isOwnProfile
              ? activeTab === 'prompts' ? 'Share your first AI prompt' : 'Share your first post'
              : `No ${activeTab} yet`
            }
          </p>
          {isOwnProfile && (
            <Link href="/post/new" style={{ display: 'inline-block', marginTop: '16px', background: '#FF6D1F', color: '#fff', padding: '9px 22px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              + Create post
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
          {displayPosts.map(post => (
            <div key={post.id} style={{ position: 'relative', paddingBottom: '100%', background: '#2a2a2a', overflow: 'hidden' }}
              onMouseEnter={e => {
                (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '1'
                if (isOwnProfile) (e.currentTarget.querySelector('.post-menu-btn') as HTMLElement | null)?.style && ((e.currentTarget.querySelector('.post-menu-btn') as HTMLElement).style.opacity = '1')
              }}
              onMouseLeave={e => {
                (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '0'
                if (isOwnProfile) (e.currentTarget.querySelector('.post-menu-btn') as HTMLElement | null)?.style && ((e.currentTarget.querySelector('.post-menu-btn') as HTMLElement).style.opacity = '0')
              }}
            >
              {/* Thumbnail */}
              <div onClick={() => setSelectedPost(post)} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
                {post.media_type === 'image' && post.image_url
                  ? <img src={post.image_url} alt={post.caption} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : post.media_type === 'video' && post.video_url
                    ? <div style={{ position: 'absolute', inset: 0, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '14px', marginLeft: '3px' }}>▶</span>
                        </div>
                      </div>
                    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                        <p style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.5, textAlign: 'center', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const }}>
                          {post.caption}
                        </p>
                      </div>
                }
              </div>

              {/* Type badges */}
              {post.media_type === 'video' && <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '14px', pointerEvents: 'none' }}>▶</span>}
              {post.prompt_text && <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(255,109,31,0.8)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', color: '#fff', fontWeight: 700, pointerEvents: 'none' }}>✦</span>}

              {/* Hover overlay (stats) */}
              <div className="overlay" onClick={() => setSelectedPost(post)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', cursor: 'pointer' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>♥ {post.likes_count}</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>💬 {post.comments_count}</span>
              </div>

              {/* Own post: ⋯ menu button */}
              {isOwnProfile && (
                <button
                  className="post-menu-btn"
                  onClick={e => { e.stopPropagation(); openEditPost(post) }}
                  style={{ position: 'absolute', top: '6px', right: '6px', opacity: 0, transition: 'opacity 0.15s', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: 700, lineHeight: 1, zIndex: 10 }}
                  title="Edit or delete post"
                >⋯</button>
              )}

              {/* Deleting spinner */}
              {deletingPostId === post.id && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post view modal */}
      {selectedPost && (
        <div onClick={() => setSelectedPost(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.15s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#2a2a2a', borderRadius: '16px', overflow: 'hidden', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            {selectedPost.media_type === 'image' && selectedPost.image_url && (
              <img src={selectedPost.image_url} alt={selectedPost.caption} style={{ width: '100%', display: 'block' }} />
            )}
            {selectedPost.media_type === 'video' && selectedPost.video_url && (
              <YouTubePlayer videoId={selectedPost.video_url} />
            )}
            <div style={{ padding: '16px' }}>
              {selectedPost.caption && <p style={{ fontSize: '14px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '12px' }}>{selectedPost.caption}</p>}
              {selectedPost.prompt_text && (
                <div style={{ background: 'rgba(255,109,31,0.06)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF6D1F', marginBottom: '6px' }}>✦ AI PROMPT {selectedPost.ai_tool ? `· ${selectedPost.ai_tool}` : ''}</div>
                  <p style={{ fontSize: '12px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>"{selectedPost.prompt_text}"</p>
                </div>
              )}
              {selectedPost.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {selectedPost.tags.map(t => <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>#{t}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: '14px', color: '#9a8f7a' }}>♥ {selectedPost.likes_count}</span>
                <span style={{ fontSize: '14px', color: '#9a8f7a' }}>💬 {selectedPost.comments_count}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => openEditPost(selectedPost)}
                        style={{ background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.25)', color: '#FF6D1F', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >✏️ Edit</button>
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        disabled={deletingPostId === selectedPost.id}
                        style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      >🗑 Delete</button>
                    </>
                  )}
                  <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#9a8f7a', fontFamily: 'inherit' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit post modal */}
      {editingPost && (
        <div onClick={() => setEditingPost(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 310, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.15s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FAF3E1' }}>Edit post</h3>
              <button onClick={() => setEditingPost(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8f7a', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>

            {/* Preview thumbnail */}
            {editingPost.image_url && (
              <div style={{ position: 'relative', maxHeight: '200px', overflow: 'hidden' }}>
                <img src={editingPost.image_url} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '200px' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #2a2a2a)' }} />
              </div>
            )}

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Caption */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Caption</label>
                <textarea
                  value={editForm.caption}
                  onChange={e => setEditForm(p => ({ ...p, caption: e.target.value }))}
                  rows={3}
                  placeholder="What's this about?"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Prompt text */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>✦ AI Prompt <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={editForm.prompt_text}
                  onChange={e => setEditForm(p => ({ ...p, prompt_text: e.target.value }))}
                  rows={3}
                  placeholder="The prompt you used to generate this..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,109,31,0.04)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '10px', color: '#FAF3E1', fontSize: '13px', padding: '10px 12px', resize: 'none', fontFamily: 'monospace', outline: 'none' }}
                />
              </div>

              {/* AI Tool */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>AI Tool <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
                <select
                  value={editForm.ai_tool}
                  onChange={e => setEditForm(p => ({ ...p, ai_tool: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                >
                  {['', ...aiTools].map(t => (
                    <option key={t} value={t}>{t || 'None'}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Tags <span style={{ color: '#555', fontWeight: 400 }}>(comma separated)</span></label>
                <input
                  value={editForm.tags}
                  onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="midjourney, portrait, cinematic..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', paddingTop: '4px' }}>
                <button
                  onClick={() => { setEditingPost(null); handleDeletePost(editingPost.id) }}
                  style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >🗑 Delete post</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditingPost(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9a8f7a', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                    style={{ background: '#FF6D1F', border: 'none', color: '#fff', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: editSaving ? 0.7 : 1 }}
                  >{editSaving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers / Following modal */}
      {followModal && (
        <div
          onClick={() => { setFollowModal(null); setFollowModalUsers([]) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.15s ease' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '420px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FAF3E1', textTransform: 'capitalize' }}>{followModal}</h3>
              <button
                onClick={() => { setFollowModal(null); setFollowModalUsers([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8f7a', fontSize: '20px', lineHeight: 1, fontFamily: 'inherit', padding: '0 4px' }}
              >×</button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {followModalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : followModalUsers.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9a8f7a', fontSize: '14px' }}>
                  {followModal === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </div>
              ) : (
                followModalUsers.map(u => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={() => { setFollowModal(null); setFollowModalUsers([]) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.full_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{u.full_name?.[0]}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</span>
                        {u.is_official && <span style={{ fontSize: '12px', color: '#FF6D1F' }}>●</span>}
                        {!u.is_official && u.is_verified && <span style={{ fontSize: '12px', color: '#FF6D1F' }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9a8f7a' }}>@{u.username}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
