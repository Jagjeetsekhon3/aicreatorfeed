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
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'prompts'>('posts')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setCurrentUserId(data.session.user.id)
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
        const { data: follow } = await supabase.from('follows')
          .select('follower_id').eq('follower_id', currentUserId).eq('following_id', prof.id).single()
        setIsFollowing(!!follow)
      }
      setLoading(false)
    }
    load()
  }, [username, currentUserId])

  async function handleFollow() {
    if (!currentUserId) { router.push('/auth/login'); return }
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile!.id)
      setIsFollowing(false)
      setProfile(p => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile!.id })
      setIsFollowing(true)
      setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p)
    }
    setFollowLoading(false)
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
              { num: posts.length, label: 'posts' },
              { num: profile?.followers_count || 0, label: 'followers' },
              { num: profile?.following_count || 0, label: 'following' },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FAF3E1' }}>{num.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{label}</div>
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
            <div key={post.id} onClick={() => setSelectedPost(post)} style={{ position: 'relative', paddingBottom: '100%', cursor: 'pointer', background: '#2a2a2a', overflow: 'hidden' }}
              onMouseEnter={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '1' }}
              onMouseLeave={e => { (e.currentTarget.querySelector('.overlay') as HTMLElement).style.opacity = '0' }}
            >
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
              {/* Type badge */}
              {post.media_type === 'video' && <span style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '14px' }}>▶</span>}
              {post.prompt_text && <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(255,109,31,0.8)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', color: '#fff', fontWeight: 700 }}>✦</span>}
              {/* Hover overlay */}
              <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>♥ {post.likes_count}</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>💬 {post.comments_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post modal */}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedPost.tags.map(t => <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>#{t}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: '14px', color: '#9a8f7a' }}>♥ {selectedPost.likes_count}</span>
                <span style={{ fontSize: '14px', color: '#9a8f7a' }}>💬 {selectedPost.comments_count}</span>
                <button onClick={() => setSelectedPost(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#9a8f7a', fontFamily: 'inherit' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
