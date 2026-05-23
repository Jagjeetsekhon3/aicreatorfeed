'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube'
import MentionInput from '@/components/ui/MentionInput'

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [aiTools, setAiTools] = useState<string[]>([])
  const [text, setText] = useState('')
  // Multi-image carousel: each slide = { url, preview, prompt_text, ai_tool }
  const [slides, setSlides] = useState<{ url: string; preview: string; prompt_text: string; ai_tool: string }[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [youtubeLink, setYoutubeLink] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [youtubeThumbnail, setYoutubeThumbnail] = useState('')
  const [tags, setTags] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showToolDropdown, setShowToolDropdown] = useState(false)
  const toolDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (toolDropdownRef.current && !toolDropdownRef.current.contains(e.target as Node)) {
        setShowToolDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const [userAvatar, setUserAvatar] = useState('')
  const [userInitial, setUserInitial] = useState('?')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    // Load AI tools from API
    fetch('/api/ai-tools').then(r => r.json()).then(d => {
      setAiTools((d.tools || []).map((t: any) => t.name))
    }).catch(() => {
      setAiTools(['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Flux', 'Other'])
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/auth/login?redirect=/post/new'); return }
      const u = data.session.user
      setAccessToken(data.session.access_token)
      setUserInitial((u.user_metadata?.full_name || u.email || '?')[0].toUpperCase())
      supabase.from('profiles').select('avatar_url, full_name').eq('id', u.id).single().then(({ data: p }) => {
        if (p?.avatar_url) setUserAvatar(p.avatar_url)
        if (p?.full_name) setUserInitial(p.full_name[0].toUpperCase())
      })
    })
  }, [])

  useEffect(() => {
    if (!youtubeLink.trim()) { setYoutubeId(''); setYoutubeThumbnail(''); return }
    const id = extractYouTubeId(youtubeLink)
    if (id) { setYoutubeId(id); setYoutubeThumbnail(getYouTubeThumbnail(id, 'hqdefault')) }
    else { setYoutubeId(''); setYoutubeThumbnail('') }
  }, [youtubeLink])

  async function uploadFile(file: File, slotIndex: number) {
    if (!file.type.startsWith('image/')) { setError('Only image files allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setError(`Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 10MB.`); return }
    setError('')
    setUploadingSlot(slotIndex)

    // Instant local preview
    const reader = new FileReader()
    reader.onload = ev => {
      const preview = ev.target?.result as string
      setSlides(prev => {
        const next = [...prev]
        if (slotIndex >= next.length) {
          next.push({ url: '', preview, prompt_text: '', ai_tool: '' })
        } else {
          next[slotIndex] = { ...next[slotIndex], preview }
        }
        return next
      })
    }
    reader.readAsDataURL(file)

    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'posts')
    form.append('type', 'post')

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (data.secure_url) {
      setSlides(prev => {
        const next = [...prev]
        if (slotIndex >= next.length) {
          next.push({ url: data.secure_url, preview: data.secure_url, prompt_text: '', ai_tool: '' })
        } else {
          next[slotIndex] = { ...next[slotIndex], url: data.secure_url }
        }
        return next
      })
      setActiveSlide(slotIndex)
    } else if (data.setup) {
      setError('Cloudinary not configured. Add credentials in Vercel env vars.')
      setSlides(prev => prev.filter((_, i) => i !== slotIndex))
    } else {
      setError(data.error || 'Upload failed')
      setSlides(prev => prev.filter((_, i) => i !== slotIndex))
    }
    setUploadingSlot(null)
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    // Support picking multiple files at once for new slots
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i], slotIndex + i)
    }
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (youtubeId) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    files.forEach((f, i) => uploadFile(f, slides.length + i))
  }

  function removeSlide(idx: number) {
    setSlides(prev => prev.filter((_, i) => i !== idx))
    setActiveSlide(prev => Math.max(0, Math.min(prev, slides.length - 2)))
  }

  function moveSlide(from: number, to: number) {
    setSlides(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setActiveSlide(to)
  }

  function updateSlide(idx: number, field: 'prompt_text' | 'ai_tool', value: string) {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && slides.length === 0 && !youtubeId) { setError('Add some text, image(s), or video'); return }
    if (slides.some(s => !s.url)) { setError('Some images are still uploading, please wait'); return }
    if (uploadingSlot !== null) { setError('Please wait for upload to finish'); return }
    setSubmitting(true); setError('')

    const imageData = slides.map(s => ({ url: s.url, prompt_text: s.prompt_text || null, ai_tool: s.ai_tool || null }))
    const allTools = Array.from(new Set(slides.map(s => s.ai_tool).filter(Boolean)))

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        text: text.trim(),
        image_url: slides[0]?.url || null,
        images: imageData,
        prompt_text: slides[0]?.prompt_text || null,
        ai_tool: slides[0]?.ai_tool || null,
        ai_tools: allTools,
        youtube_id: youtubeId || null,
        tags: tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to post'); setSubmitting(false); return }
    router.push('/feed')
  }

  const canPost = (text.trim() || slides.length > 0 || youtubeId) && uploadingSlot === null && !submitting

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto', padding: '32px 0 100px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'inherit', padding: '6px 0' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#FAF3E1' }}>New post</h1>
        <button type="submit" form="post-form" disabled={!canPost} style={{
          background: canPost ? '#FF6D1F' : 'rgba(255,255,255,0.08)',
          color: canPost ? '#fff' : '#555',
          border: 'none', borderRadius: '10px', padding: '8px 18px',
          fontSize: '14px', fontWeight: 700, cursor: canPost ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {submitting
            ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Posting</>
            : 'Post'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ff8080', animation: 'fadeUp 0.2s ease' }}>
          ⚠ {error}
        </div>
      )}

      <form id="post-form" onSubmit={handleSubmit}>

        {/* Composer card */}
        <div style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden' }}>

          {/* Top row — avatar + textarea */}
          <div style={{ display: 'flex', gap: '12px', padding: '18px 18px 10px' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {userAvatar
                ? <img src={userAvatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>{userInitial}</div>
              }
            </div>
            {/* Text */}
            <div style={{ flex: 1 }}>
              <MentionInput
                value={text}
                onChange={setText}
                placeholder="What are you creating with AI today? (@mention someone)"
                rows={4}
                style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '16px', lineHeight: 1.65, letterSpacing: '0.01em', borderRadius: 0 }}
              />
              {text.length > 1800 && (
                <p style={{ fontSize: '11px', color: text.length > 1950 ? '#ff8080' : '#9a8f7a', textAlign: 'right', margin: '4px 0 0' }}>{text.length}/2000</p>
              )}
            </div>
          </div>

          {/* ── CAROUSEL IMAGE AREA ── */}
          <div
            onDragOver={e => { e.preventDefault(); if (!youtubeId) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* Main slide preview */}
            {slides.length > 0 && !youtubeId && (
              <div style={{ position: 'relative', background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Active slide image */}
                <div style={{ position: 'relative', maxHeight: '400px', overflow: 'hidden' }}>
                  <img src={slides[activeSlide]?.preview || slides[activeSlide]?.url} alt=""
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />

                  {/* Uploading overlay */}
                  {uploadingSlot === activeSlide && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      <span style={{ fontSize: '12px', color: '#FAF3E1', fontWeight: 600 }}>Uploading...</span>
                    </div>
                  )}

                  {/* Slide count badge */}
                  {slides.length > 1 && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                      {activeSlide + 1} / {slides.length}
                    </div>
                  )}

                  {/* Arrow navigation */}
                  {slides.length > 1 && activeSlide > 0 && (
                    <button type="button" onClick={() => setActiveSlide(activeSlide - 1)}
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                  )}
                  {slides.length > 1 && activeSlide < slides.length - 1 && (
                    <button type="button" onClick={() => setActiveSlide(activeSlide + 1)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  )}

                  {/* Dot indicators */}
                  {slides.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                      {slides.map((_, i) => (
                        <button key={i} type="button" onClick={() => setActiveSlide(i)}
                          style={{ width: i === activeSlide ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === activeSlide ? '#FF6D1F' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
                      ))}
                    </div>
                  )}

                  {/* Remove current slide */}
                  <button type="button" onClick={() => removeSlide(activeSlide)}
                    style={{ position: 'absolute', top: '10px', left: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </button>
                </div>

                {/* Per-slide prompt + tool */}
                <div style={{ padding: '10px 14px', background: 'rgba(255,109,31,0.04)', borderTop: '1px solid rgba(255,109,31,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF6D1F' }}>✦ Image {activeSlide + 1} prompt</span>
                    <span style={{ fontSize: '11px', color: '#555' }}>(optional)</span>
                  </div>
                  <textarea
                    value={slides[activeSlide]?.prompt_text || ''}
                    onChange={e => updateSlide(activeSlide, 'prompt_text', e.target.value)}
                    placeholder="Prompt used for this image..."
                    rows={2}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: '#F5E7C6', fontFamily: 'monospace', resize: 'none', outline: 'none', lineHeight: 1.6 }}
                  />
                  {/* Per-slide AI tool */}
                  <div ref={toolDropdownRef} style={{ position: 'relative', marginTop: '6px' }}>
                    <button type="button" onClick={() => setShowToolDropdown(v => !v)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: slides[activeSlide]?.ai_tool ? '#FAF3E1' : '#9a8f7a', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' as const }}>
                      <span>{slides[activeSlide]?.ai_tool || 'AI tool for this image...'}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, transform: showToolDropdown ? 'rotate(180deg)' : 'rotate(0)' }}><path d="M2 4l4 4 4-4"/></svg>
                    </button>
                    {showToolDropdown && (
                      <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 -8px 24px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                        <div onClick={() => { updateSlide(activeSlide, 'ai_tool', ''); setShowToolDropdown(false) }}
                          style={{ padding: '9px 12px', fontSize: '12px', color: '#555', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>None</div>
                        {aiTools.map(t => (
                          <div key={t} onClick={() => { updateSlide(activeSlide, 'ai_tool', t); setShowToolDropdown(false) }}
                            style={{ padding: '9px 12px', fontSize: '12px', color: slides[activeSlide]?.ai_tool === t ? '#FF6D1F' : '#FAF3E1', cursor: 'pointer', background: slides[activeSlide]?.ai_tool === t ? 'rgba(255,109,31,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            onMouseEnter={e => { if (slides[activeSlide]?.ai_tool !== t) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { if (slides[activeSlide]?.ai_tool !== t) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
                            {t}{slides[activeSlide]?.ai_tool === t && <span>✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', overflowX: 'auto', alignItems: 'center' }}>
                  {slides.map((s, i) => (
                    <div key={i} onClick={() => setActiveSlide(i)}
                      style={{ position: 'relative', width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: `2px solid ${i === activeSlide ? '#FF6D1F' : 'transparent'}`, transition: 'border-color 0.15s' }}>
                      <img src={s.preview || s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {/* Reorder buttons */}
                      {i > 0 && (
                        <button type="button" onClick={e => { e.stopPropagation(); moveSlide(i, i - 1) }}
                          style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px', padding: '1px 4px' }}>←</button>
                      )}
                      {i < slides.length - 1 && (
                        <button type="button" onClick={e => { e.stopPropagation(); moveSlide(i, i + 1) }}
                          style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px', padding: '1px 4px' }}>→</button>
                      )}
                      {s.ai_tool && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', fontSize: '8px', color: '#FF8540', padding: '1px 3px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.ai_tool}</div>
                      )}
                      {uploadingSlot === i && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more images button */}
                  {slides.length < 10 && (
                    <label style={{ width: '52px', height: '52px', borderRadius: '6px', border: '1.5px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, gap: '2px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.5)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => handleImagePick(e, slides.length)} />
                      <span style={{ fontSize: '18px', color: '#9a8f7a', lineHeight: 1 }}>+</span>
                      <span style={{ fontSize: '8px', color: '#9a8f7a' }}>Add</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Empty drop zone (no images yet) */}
            {slides.length === 0 && !youtubeId && (
              <label style={{ display: 'block', margin: '0', cursor: 'pointer' }}>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => handleImagePick(e, 0)} />
                <div style={{ border: `2px dashed ${dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)'}`, margin: '0 18px 14px', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', transition: 'all 0.15s', background: dragOver ? 'rgba(255,109,31,0.04)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)')}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼</div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', margin: '0 0 4px' }}>
                    {dragOver ? 'Drop images here' : 'Click to add images'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9a8f7a', margin: 0 }}>Up to 10 images · each per-image prompt & AI tool · JPG, PNG, WebP</p>
                </div>
              </label>
            )}
          </div>

          {/* YouTube preview */}
          {youtubeId && (
            <div style={{ margin: '0 18px 14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', animation: 'fadeUp 0.25s ease' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                <img src={youtubeThumbnail} alt="Video" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '16px', marginLeft: '3px' }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#9a8f7a' }}>✓ YouTube video — plays on site</span>
                <button type="button" onClick={() => { setYoutubeLink(''); setYoutubeId(''); setYoutubeThumbnail('') }} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '13px' }}>Remove</button>
              </div>
            </div>
          )}

          {/* YouTube input */}
          {showVideo && !youtubeId && (
            <div style={{ margin: '0 18px 14px', animation: 'fadeUp 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="#9a8f7a" strokeWidth="1.2"/>
                  <path d="M6.5 5.5L10.5 8L6.5 10.5V5.5Z" fill="#9a8f7a"/>
                </svg>
                <input type="text" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)}
                  placeholder="Paste YouTube link..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#FAF3E1', fontFamily: 'inherit' }}
                />
              </div>
              {youtubeLink && !youtubeId && (
                <p style={{ fontSize: '11px', color: '#ff8080', marginTop: '6px' }}>⚠ Couldn't detect a YouTube video ID</p>
              )}
            </div>
          )}

          {/* Tags row */}
          <div style={{ margin: '0 18px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 1H6.5L13 7.5L7.5 13L1 6.5V1Z" stroke="#9a8f7a" strokeWidth="1.2" strokeLinejoin="round"/>
              <circle cx="4" cy="4" r="1" fill="#9a8f7a"/>
            </svg>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Add tags: midjourney, aiart, portrait"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#9a8f7a', fontFamily: 'inherit' }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Bottom toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px' }}>

            {/* Image button — opens file picker to add more images */}
            <label title="Add images" style={{ width: '36px', height: '36px', borderRadius: '8px', cursor: youtubeId ? 'not-allowed' : 'pointer', background: slides.length > 0 ? 'rgba(255,109,31,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: youtubeId ? 0.35 : 1, transition: 'background 0.15s' }}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={!!youtubeId}
                onChange={e => handleImagePick(e, slides.length)} />
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="3" width="15" height="12" rx="2" stroke={slides.length > 0 ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <circle cx="6" cy="7.5" r="1.5" stroke={slides.length > 0 ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <path d="M1.5 12L5.5 8.5L8.5 11.5L11.5 8.5L16.5 13" stroke={slides.length > 0 ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </label>

            {/* Video button */}
            <button type="button" onClick={() => { setShowVideo(!showVideo); if (showVideo) { setYoutubeLink(''); setYoutubeId('') } }} disabled={slides.length > 0} title="Add YouTube video"
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: slides.length > 0 ? 'not-allowed' : 'pointer', background: (showVideo || youtubeId) ? 'rgba(255,109,31,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: slides.length > 0 ? 0.35 : 1, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!slides.length) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = (showVideo || youtubeId) ? 'rgba(255,109,31,0.15)' : 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="3.5" width="11" height="11" rx="2" stroke={(showVideo || youtubeId) ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <path d="M12.5 6.5L16.5 4.5V13.5L12.5 11.5" stroke={(showVideo || youtubeId) ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Prompt button */}
            <button type="button" onClick={() => setShowPrompt(!showPrompt)} title="Add AI prompt"
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, pointerEvents: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L10.8 6.5H16L11.6 9.5L13.4 14.5L9 11.5L4.6 14.5L6.4 9.5L2 6.5H7.2L9 1.5Z" stroke="#9a8f7a" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Character count + slide count */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {slides.length > 0 && <span style={{ fontSize: '11px', color: '#FF6D1F', fontWeight: 600 }}>{slides.length} image{slides.length > 1 ? 's' : ''}</span>}
              {text.length > 0 && <span style={{ fontSize: '12px', color: '#555' }}>{text.length}</span>}
            </div>
          </div>
        </div>

        {/* Help text */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginTop: '14px', lineHeight: 1.5 }}>
          Up to 10 images · per-image prompt & AI tool · or 1 YouTube video · # tags
        </p>
      </form>
    </div>
  )
}
