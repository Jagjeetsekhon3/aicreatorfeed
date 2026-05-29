'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [tab, setTab] = useState<'chats' | 'requests'>('chats')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/auth/login?redirect=/messages'); return }
      setCurrentUserId(data.session.user.id)
      setAccessToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/messages?type=inbox', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json()).then(d => {
      setConversations(d.conversations || [])
      setLoading(false)
    })
  }, [accessToken])

  // Realtime updates
  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase.channel('inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetch('/api/messages?type=inbox', { headers: { Authorization: `Bearer ${accessToken}` } })
          .then(r => r.json()).then(d => setConversations(d.conversations || []))
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, accessToken])

  function getOtherUser(conv: any) {
    return conv.user1_id === currentUserId ? conv.user2 : conv.user1
  }

  function getUnread(conv: any) {
    return conv.user1_id === currentUserId ? conv.user1_unread : conv.user2_unread
  }

  const accepted = conversations.filter(c => c.status === 'accepted')
  const requests = conversations.filter(c => c.status === 'pending' && c.requested_by !== currentUserId)

  async function handleAccept(conv_id: string) {
    await fetch('/api/messages?action=accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ conv_id }),
    })
    setConversations(prev => prev.map(c => c.id === conv_id ? { ...c, status: 'accepted' } : c))
  }

  async function handleDecline(conv_id: string) {
    await fetch('/api/messages?action=decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ conv_id }),
    })
    setConversations(prev => prev.filter(c => c.id !== conv_id))
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-cream)' }}>Messages</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '16px' }}>
        {([
          { key: 'chats', label: `Chats${accepted.length ? ` (${accepted.length})` : ''}` },
          { key: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
            color: tab === key ? 'var(--color-primary)' : '#9a8f7a',
            borderBottom: `2px solid ${tab === key ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: '-1px',
          }}>{label}
            {key === 'requests' && requests.length > 0 && (
              <span style={{ marginLeft: '6px', background: 'var(--color-primary)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px' }}>
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chats */}
      {tab === 'chats' && (
        <div>
          {accepted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>💬</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '8px' }}>No messages yet</h3>
              <p style={{ color: '#9a8f7a', fontSize: '14px' }}>Visit someone's profile and send them a message</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {accepted.map(conv => {
                const other = getOtherUser(conv)
                const unread = getUnread(conv)
                return (
                  <Link key={conv.id} href={`/messages/${conv.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', transition: 'background 0.15s', background: unread > 0 ? 'color-mix(in srgb, var(--color-primary) 5%, transparent)' : 'transparent', border: '1px solid transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = unread > 0 ? 'color-mix(in srgb, var(--color-primary) 5%, transparent)' : 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {other?.avatar_url
                        ? <img src={other.avatar_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>{other?.full_name?.[0]}</div>
                      }
                      {unread > 0 && (
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid #222' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '14px', fontWeight: unread > 0 ? 700 : 600, color: 'var(--color-cream)' }}>{other?.full_name}</span>
                        <span style={{ fontSize: '11px', color: '#9a8f7a' }}>{conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '13px', color: unread > 0 ? 'var(--color-beige)' : '#9a8f7a', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '280px', fontWeight: unread > 0 ? 600 : 400 }}>
                          {conv.last_message || 'Start chatting'}
                        </p>
                        {unread > 0 && (
                          <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', flexShrink: 0 }}>{unread}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Message Requests */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>📬</div>
              <p style={{ color: '#9a8f7a', fontSize: '14px' }}>No message requests</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '4px' }}>
                These people want to send you a message. Accept to start chatting.
              </p>
              {requests.map(conv => {
                const other = getOtherUser(conv)
                return (
                  <div key={conv.id} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      {other?.avatar_url
                        ? <img src={other.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700 }}>{other?.full_name?.[0]}</div>
                      }
                      <div>
                        <Link href={`/profile/${other?.username}`} style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{other?.full_name}</Link>
                        <p style={{ fontSize: '12px', color: '#9a8f7a', margin: 0 }}>@{other?.username}</p>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--color-beige)', margin: 0, lineHeight: 1.5 }}>{conv.last_message}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleAccept(conv.id)} style={{
                        flex: 1, padding: '9px', borderRadius: '10px', border: 'none',
                        background: 'var(--color-primary)', color: '#fff', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                      }}>Accept</button>
                      <button onClick={() => handleDecline(conv.id)} style={{
                        flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: '#9a8f7a', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                      }}>Decline</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
