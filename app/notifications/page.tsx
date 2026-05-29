'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: (actor: string, msg?: string) => string }> = {
  follow:  { icon: '👤', color: '#a78bfa', label: (a) => `${a} started following you` },
  like:    { icon: '♥',  color: '#f43f5e', label: (a) => `${a} liked your post` },
  comment: { icon: '💬', color: 'var(--color-primary)', label: (a, m) => `${a} commented: "${m}"` },
  reply:   { icon: '↩',  color: 'var(--color-primary)', label: (a, m) => `${a} replied: "${m}"` },
  mention: { icon: '@',  color: '#facc15', label: (a) => `${a} mentioned you` },
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/auth/login?redirect=/notifications'); return }
      setAccessToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setLoading(false) })
  }, [accessToken])

  // Realtime new notifications
  useEffect(() => {
    if (!accessToken) return
    const channel = supabase.channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [accessToken])

  async function markAllRead() {
    setMarking(true)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: 'mark_all_read' }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setMarking(false)
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: 'mark_read', id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function deleteAll() {
    if (!confirm('Delete all notifications?')) return
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: 'delete_all' }),
    })
    setNotifications([])
  }

  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-cream)', margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && <p style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '3px' }}>{unreadCount} unread</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={marking} style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {marking ? '...' : '✓ Mark all read'}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9a8f7a', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '16px' }}>
        {[
          { key: 'all',    label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key as any)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
            color: filter === key ? 'var(--color-primary)' : '#9a8f7a',
            borderBottom: `2px solid ${filter === key ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔔</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '8px' }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px', lineHeight: 1.6 }}>
            {filter === 'unread' ? 'You have no unread notifications' : 'When someone follows, likes or comments — it shows up here'}
          </p>
        </div>
      )}

      {/* Notifications list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {displayed.map((notif, i) => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.like
          const actor = notif.actor
          const label = cfg.label(actor?.full_name || 'Someone', notif.message || '')

          const href = notif.type === 'follow'
            ? `/profile/${actor?.username}`
            : notif.post_id ? `/post/${notif.post_id}` : '#'

          return (
            <div key={notif.id}
              onClick={() => { markRead(notif.id); router.push(href) }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                background: notif.read ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
                border: `1px solid ${notif.read ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 10%, transparent)'}`,
                transition: 'all 0.15s', animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'color-mix(in srgb, var(--color-primary) 5%, transparent)')}
            >
              {/* Avatar + icon */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Link href={`/profile/${actor?.username}`} onClick={e => e.stopPropagation()} style={{ textDecoration: 'none' }}>
                  {actor?.avatar_url
                    ? <img src={actor.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700 }}>{actor?.full_name?.[0] || '?'}</div>
                  }
                </Link>
                {/* Type icon badge */}
                <div style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: cfg.color, border: '2px solid #222',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px',
                }}>{cfg.icon}</div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', color: 'var(--color-cream)', lineHeight: 1.5 }}>
                      <Link href={`/profile/${actor?.username}`} onClick={e => e.stopPropagation()} style={{ fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>
                        {actor?.full_name}
                      </Link>
                      {(actor?.is_official || actor?.is_verified) && <span style={{ marginLeft: '3px', display: 'inline-flex', verticalAlign: 'middle' }}><VerifiedBadge isOfficial={actor.is_official} size={13} /></span>}
                      {' '}
                      <span style={{ color: 'var(--color-beige)', fontWeight: 400 }}>
                        {notif.type === 'follow' ? 'started following you' : notif.type === 'like' ? 'liked your post' : notif.type === 'comment' ? 'commented on your post' : 'replied to your comment'}
                      </span>
                    </span>
                    {notif.message && (
                      <p style={{ fontSize: '13px', color: '#9a8f7a', margin: '3px 0 0', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        "{notif.message}"
                      </p>
                    )}
                    <p style={{ fontSize: '11px', color: '#6b6460', margin: '4px 0 0' }}>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Post thumbnail */}
                    {notif.post?.image_url && (
                      <img src={notif.post.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', opacity: 0.8 }} />
                    )}
                    {/* Unread dot */}
                    {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
