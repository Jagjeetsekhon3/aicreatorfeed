'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const AI_TOOLS = ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Flux', 'Adobe Firefly', 'Other']

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '12px 16px', fontSize: '14px', color: 'var(--color-cream)',
  outline: 'none', fontFamily: 'inherit',
}

export default function EditPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [caption, setCaption] = useState('')
  const [promptText, setPromptText] = useState('')
  const [aiTool, setAiTool] = useState('')
  const [tags, setTags] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      setAccessToken(session.access_token)

      const { data: post } = await supabase.from('posts').select('*').eq('id', id).single()
      if (!post) { router.replace('/feed'); return }
      if (post.user_id !== session.user.id) { router.replace('/feed'); return }

      setCaption(post.caption || '')
      setPromptText(post.prompt_text || '')
      setAiTool(post.ai_tool || '')
      setTags((post.tags || []).join(', '))
      setImageUrl(post.image_url || '')
      setMediaType(post.media_type || '')
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')

    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({
        caption,
        prompt_text: promptText || null,
        ai_tool: aiTool || null,
        tags: tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return }
    router.push('/feed')
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '32px', height: '32px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '32px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-cream)' }}>Edit post</h1>
        <div style={{ width: '40px' }} />
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
          ⚠ {error}
        </div>
      )}

      {/* Image preview (read-only) */}
      {imageUrl && (
        <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={imageUrl} alt="Post" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
          <p style={{ fontSize: '12px', color: '#9a8f7a', padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>Image cannot be changed — delete and repost to use a different image</p>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>Caption</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} maxLength={2000}
            style={{ ...inp, resize: 'none', lineHeight: 1.6 }} placeholder="What did you create?" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>
            ✦ AI Prompt <span style={{ fontWeight: 400, color: '#9a8f7a' }}>(optional)</span>
          </label>
          <textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={3}
            style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', resize: 'none', lineHeight: 1.6 }}
            placeholder="Paste your prompt..." />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>AI tool used</label>
          <select value={aiTool} onChange={e => setAiTool(e.target.value)}
            style={{ ...inp, cursor: 'pointer', appearance: 'none' as any }}>
            <option value="">Select tool...</option>
            {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-beige)', marginBottom: '7px' }}>Tags</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)}
            placeholder="midjourney, portrait, cinematic"
            style={inp} />
        </div>

        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button type="button" onClick={() => router.back()} style={{
            flex: 1, padding: '13px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, color: '#9a8f7a', fontFamily: 'inherit',
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            flex: 2, padding: '13px', borderRadius: '12px',
            background: 'var(--color-primary)', border: 'none', cursor: saving ? 'wait' : 'pointer',
            fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'inherit',
          }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
