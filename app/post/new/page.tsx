'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'

const AI_TOOLS = ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Adobe Firefly', 'Flux', 'Other']

const inp: React.CSSProperties = {
  width: '100%', background: '#2a2a2a',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '12px 16px', fontSize: '14px', color: '#FAF3E1',
  outline: 'none', fontFamily: 'inherit',
}

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [promptText, setPromptText] = useState('')
  const [aiTool, setAiTool] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [youtubeThumbnail, setYoutubeThumbnail] = useState('')
  const [tags, setTags] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/auth/login?redirect=/post/new')
      else setUserId(data.session.user.id)
    })
  }, [])

  // Auto-detect YouTube URL as user types
  useEffect(() => {
    if (!youtubeLink) { setYoutubeId(''); setYoutubeThumbnail(''); return }
    const id = extractYouTubeId(youtubeLink)
    if (id) { setYoutubeId(id); setYoutubeThumbnail(getYouTubeThumbnail(id, 'hqdefault')) }
    else { setYoutubeId(''); setYoutubeThumbnail('') }
  }, [youtubeLink])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Max image size is 10MB'); return }
    setUploading(true); setError('')

    // Show local preview
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'posts')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (data.secure_url) setImageUrl(data.secure_url)
    else setError('Image upload failed')
    setUploading(false)
  }

  function removeImage() { setImageUrl(''); setImagePreview('') }
  function removeVideo() { setYoutubeLink(''); setYoutubeId(''); setYoutubeThumbnail('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !imageUrl && !youtubeId) { setError('Add some text, an image, or a video link'); return }
    setSubmitting(true); setError('')

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        image_url: imageUrl || null,
        prompt_text: promptText.trim() || null,
        ai_tool: aiTool || null,
        youtube_id: youtubeId || null,
        tags: tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to post'); setSubmitting(false); return }
    router.push('/feed')
  }

  const canPost = (text.trim() || imageUrl || youtubeId) && !uploading && !submitting

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '20px', padding: '4px' }}>←</button>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#FAF3E1' }}>Create post</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080' }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Main card */}
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share something with the AI creator community..."
            rows={4}
            maxLength={2000}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '16px', fontSize: '15px', color: '#FAF3E1',
              resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />
          <div style={{ padding: '0 16px 8px', textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: text.length > 1800 ? '#ff8080' : '#9a8f7a' }}>{text.length}/2000</span>
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: '#FAF3E1', fontSize: '13px' }}>Uploading...</span>
                </div>
              )}
              {!uploading && (
                <button type="button" onClick={removeImage} style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                  cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              )}
            </div>
          )}

          {/* YouTube preview */}
          {youtubeId && (
            <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                <img src={youtubeThumbnail} alt="Video" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,109,31,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '20px', marginLeft: '3px' }}>▶</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={removeVideo} style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)' }}>
                <p style={{ fontSize: '12px', color: '#9a8f7a' }}>✓ YouTube video detected — will play on site</p>
              </div>
            </div>
          )}

          {/* Prompt section */}
          {showPrompt && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', background: 'rgba(255,109,31,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#FF6D1F' }}>✦ AI Prompt</label>
                <button type="button" onClick={() => setShowPrompt(false)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '14px' }}>×</button>
              </div>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder="Paste the exact prompt you used..."
                rows={3}
                style={{ ...inp, fontFamily: 'monospace', fontSize: '12px', resize: 'none', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <select value={aiTool} onChange={e => setAiTool(e.target.value)}
                  style={{ ...inp, width: 'auto', flex: 1, fontSize: '12px', cursor: 'pointer' }}>
                  <option value="">AI tool used...</option>
                  {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>

            {/* Image */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={!!youtubeId} title="Add image" style={{
              background: imageUrl ? 'rgba(255,109,31,0.15)' : 'none', border: 'none',
              borderRadius: '8px', padding: '8px 10px', cursor: youtubeId ? 'not-allowed' : 'pointer',
              fontSize: '18px', opacity: youtubeId ? 0.3 : 1, transition: 'background 0.2s',
            }}>🖼️</button>

            {/* YouTube */}
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => document.getElementById('yt-input')?.focus()} disabled={!!imageUrl} title="Add YouTube video" style={{
                background: youtubeId ? 'rgba(255,109,31,0.15)' : 'none', border: 'none',
                borderRadius: '8px', padding: '8px 10px', cursor: imageUrl ? 'not-allowed' : 'pointer',
                fontSize: '18px', opacity: imageUrl ? 0.3 : 1,
              }}>▶️</button>
            </div>

            {/* Prompt */}
            <button type="button" onClick={() => setShowPrompt(!showPrompt)} title="Add AI prompt" style={{
              background: showPrompt ? 'rgba(255,109,31,0.15)' : 'none', border: 'none',
              borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontSize: '18px',
            }}>✨</button>

            {/* Tags */}
            <div style={{ flex: 1, marginLeft: '4px' }}>
              <input
                type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="#tags, #separated, #by, #commas"
                style={{ ...inp, padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)' }}
              />
            </div>
          </div>

          {/* YouTube URL input - shows when video button clicked */}
          {!imageUrl && (
            <div style={{ padding: '0 12px 12px', display: youtubeId ? 'none' : 'block' }}>
              <input
                id="yt-input"
                type="text" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)}
                placeholder="Paste YouTube link to embed video... (optional)"
                style={{ ...inp, fontSize: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
          )}
        </div>

        {/* Post button */}
        <button type="submit" disabled={!canPost} style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          background: canPost ? '#FF6D1F' : '#3a3a3a', border: 'none',
          cursor: canPost ? 'pointer' : 'not-allowed',
          fontSize: '15px', fontWeight: 700, color: canPost ? '#fff' : '#6a6a6a',
          fontFamily: 'inherit', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          {submitting
            ? <><div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Publishing...</>
            : '🚀 Post to AiCreatorFeed'
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9a8f7a', marginTop: '10px' }}>
          Share text · Add an image · Paste a YouTube link · Include your AI prompt
        </p>
      </form>
    </div>
  )
}
