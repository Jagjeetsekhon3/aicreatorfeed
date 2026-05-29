'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export default function ConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/auth/login'); return }
      setCurrentUserId(data.session.user.id)
      setAccessToken(data.session.access_token)
    })
  }, [])

  useEffect(() => {
    if (!accessToken) return
    fetch(`/api/messages?type=messages&conv_id=${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then(r => r.json()).then(d => {
      setMessages(d.messages || [])
      setConversation(d.conversation)
      setLoading(false)
    })
  }, [id, accessToken])

  // Set other user once we have conv + currentUserId
  useEffect(() => {
    if (!conversation || !currentUserId) return
    const otherId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
    supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', otherId).single()
      .then(({ data }) => setOtherUser(data))
  }, [conversation, currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 10 ? 'smooth' : 'instant' } as any)
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    if (!id) return
    const channel = supabase.channel(`conv-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, payload => {
        const msg = payload.new
        if (msg.sender_id !== currentUserId) {
          // Fetch sender info
          supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', msg.sender_id).single()
            .then(({ data }) => {
              setMessages(prev => [...prev, { ...msg, sender: data }])
            })
        }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, currentUserId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`, conversation_id: id, sender_id: currentUserId,
      content, created_at: new Date().toISOString(), read: false,
      sender: { id: currentUserId, full_name: 'You' }
    }
    setMessages(prev => [...prev, tempMsg])

    const res = await fetch('/api/messages?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ conv_id: id, content }),
    })
    const data = await res.json()
    if (data.message) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...data.message } : m))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function formatMsgTime(dateStr: string) {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
    return format(date, 'MMM d, h:mm a')
  }

  // Group messages by date
  function getDateLabel(dateStr: string) {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '32px', height: '32px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const isPending = conversation?.status === 'pending'
  const isRequester = conversation?.requested_by === currentUserId

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <style>{`@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {otherUser?.avatar_url
          ? <img src={otherUser.avatar_url} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700 }}>{otherUser?.full_name?.[0]}</div>
        }
        <div style={{ flex: 1 }}>
          <Link href={`/profile/${otherUser?.username}`} style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-cream)', textDecoration: 'none' }}>{otherUser?.full_name}</Link>
          <p style={{ fontSize: '12px', color: '#9a8f7a', margin: 0 }}>@{otherUser?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#222' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0' }}>
            {otherUser?.avatar_url
              ? <img src={otherUser.avatar_url} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '4px' }} />
              : <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{otherUser?.full_name?.[0]}</div>
            }
            <div style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '15px' }}>{otherUser?.full_name}</div>
            <div style={{ fontSize: '13px', color: '#9a8f7a' }}>@{otherUser?.username}</div>
            <p style={{ fontSize: '13px', color: '#9a8f7a', textAlign: 'center', marginTop: '8px' }}>
              {isPending && !isRequester ? 'Accept this request to start chatting' : 'Send a message to start the conversation'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId
          const prevMsg = messages[i - 1]
          const showDate = !prevMsg || getDateLabel(msg.created_at) !== getDateLabel(prevMsg.created_at)
          const showAvatar = !isMine && (!messages[i + 1] || messages[i + 1].sender_id !== msg.sender_id)

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '12px 0 8px', fontSize: '11px', color: '#9a8f7a', fontWeight: 600 }}>
                  {getDateLabel(msg.created_at)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', marginBottom: '3px', animation: 'msgIn 0.15s ease' }}>
                {!isMine && (
                  <div style={{ width: '28px', flexShrink: 0, visibility: showAvatar ? 'visible' : 'hidden' }}>
                    {otherUser?.avatar_url
                      ? <img src={otherUser.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{otherUser?.full_name?.[0]}</div>
                    }
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMine ? 'var(--color-primary)' : '#2f2f2f',
                    color: isMine ? '#fff' : 'var(--color-beige)',
                    fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                    opacity: msg.id?.startsWith('temp-') ? 0.7 : 1,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9a8f7a', marginTop: '3px', textAlign: isMine ? 'right' : 'left', paddingLeft: isMine ? 0 : '4px', paddingRight: isMine ? '4px' : 0 }}>
                    {formatMsgTime(msg.created_at)}
                    {isMine && <span style={{ marginLeft: '4px' }}>{msg.read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Pending request banner */}
      {isPending && !isRequester && (
        <div style={{ padding: '14px 16px', background: '#2a2a2a', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '10px' }}>
            <strong style={{ color: 'var(--color-cream)' }}>{otherUser?.full_name}</strong> wants to send you a message
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={async () => {
              await fetch('/api/messages?action=accept', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ conv_id: id }) })
              setConversation((c: any) => ({ ...c, status: 'accepted' }))
            }} style={{ padding: '9px 24px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              Accept
            </button>
            <button onClick={async () => {
              await fetch('/api/messages?action=decline', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ conv_id: id }) })
              router.push('/messages')
            }} style={{ padding: '9px 24px', background: 'transparent', color: '#9a8f7a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {(!isPending || isRequester) && conversation?.status !== 'blocked' && (
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '12px 14px', background: '#2a2a2a', borderTop: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 0 16px 16px', flexShrink: 0, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }}
            placeholder={isPending && isRequester ? 'Waiting for acceptance...' : 'Message...'}
            disabled={isPending && isRequester}
            rows={1}
            maxLength={1000}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '10px 16px', fontSize: '14px', color: 'var(--color-cream)',
              fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
              opacity: isPending && isRequester ? 0.5 : 1,
            }}
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px' }}
          />
          <button type="submit" disabled={!text.trim() || sending || (isPending && isRequester)} style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0,
            background: text.trim() && !isPending ? 'var(--color-primary)' : '#333',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: text.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L14 2L8 14L7 9L2 8Z" fill={text.trim() && !isPending ? '#fff' : '#555'} />
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}
