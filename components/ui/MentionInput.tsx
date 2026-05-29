'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type User = { id: string; username: string; full_name: string; avatar_url: string | null }

type Props = {
  value: string
  onChange: (val: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  style?: React.CSSProperties
  inputRef?: React.RefObject<HTMLTextAreaElement>
  disabled?: boolean
}

export default function MentionInput({ value, onChange, onKeyDown, placeholder, rows = 2, style, inputRef, disabled }: Props) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const ref = inputRef || internalRef

  const [suggestions, setSuggestions] = useState<User[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Detect @mention in text
  function detectMention(text: string, cursorPos: number) {
    const before = text.slice(0, cursorPos)
    const match = before.match(/@([a-zA-Z0-9_]*)$/)
    if (match) {
      setMentionQuery(match[1])
      setMentionStart(cursorPos - match[0].length)
      setSelectedIdx(0)
    } else {
      setMentionQuery(null)
      setSuggestions([])
    }
  }

  // Fetch users matching query
  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 1) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?type=users&q=${encodeURIComponent(query)}&limit=6`)
      const data = await res.json()
      setSuggestions(data.users || [])
    } catch { setSuggestions([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (mentionQuery === null) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(mentionQuery), 200)
    return () => clearTimeout(debounceRef.current)
  }, [mentionQuery, fetchUsers])

  function insertMention(user: User) {
    const before = value.slice(0, mentionStart)
    const after  = value.slice(ref.current?.selectionStart || mentionStart)
    const newVal = `${before}@${user.username} ${after}`
    onChange(newVal)
    setMentionQuery(null)
    setSuggestions([])
    // Move cursor after the inserted mention
    setTimeout(() => {
      const pos = (before + `@${user.username} `).length
      ref.current?.setSelectionRange(pos, pos)
      ref.current?.focus()
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0 && mentionQuery !== null) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(suggestions[selectedIdx]); return }
      if (e.key === 'Escape') { setMentionQuery(null); setSuggestions([]); return }
    }
    onKeyDown?.(e)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    detectMention(e.target.value, e.target.selectionStart)
  }

  // Render text with clickable @mentions
  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: 'var(--color-cream)', fontSize: '14px',
          padding: '10px 12px', fontFamily: 'inherit', outline: 'none',
          resize: 'none',
          ...style,
        }}
      />

      {/* Mention dropdown */}
      {mentionQuery !== null && (suggestions.length > 0 || loading) && (
        <div style={{
          position: 'absolute', left: 0, bottom: '100%', marginBottom: '4px',
          background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px', overflow: 'hidden', zIndex: 100,
          width: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontSize: '12px', color: '#9a8f7a' }}>Searching...</div>
          )}
          {suggestions.map((u, i) => (
            <div key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u) }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', background: i === selectedIdx ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent', transition: 'background 0.1s' }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{u.full_name?.[0]}</div>
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                <div style={{ fontSize: '11px', color: '#9a8f7a' }}>@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Render plain text with @mentions as clickable links
export function RenderWithMentions({ text, style }: { text: string; style?: React.CSSProperties }) {
  if (!text) return null
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g)
  return (
    <span style={style}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Link key={i} href={`/profile/${part.slice(1)}`}
            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >{part}</Link>
        ) : part
      )}
    </span>
  )
}
