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
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [promptText, setPromptText] = useState('')
  const [aiTool, setAiTool] = useState('')
  const [youtubeLink, setYoutubeLink] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [youtubeThumbnail, setYoutubeThumbnail] = useState('')
  const [tags, setTags] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed (JPG, PNG, WebP, GIF)'); return }
    if (file.size > 10 * 1024 * 1024) { setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is 10MB.`); return }

    setUploading(true); setError('')

    // Show local preview instantly
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'posts')
    form.append('type', 'post')

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (data.secure_url) {
      setImageUrl(data.secure_url)
    } else if (data.setup) {
      setError('Cloudinary is not set up yet. Add your Cloudinary credentials in Vercel environment variables.')
      setImagePreview('')
    } else {
      setError(data.error || 'Upload failed. Please try again.')
      setImagePreview('')
    }
    setUploading(false)
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
    e.target.value = '' // reset so same file can be re-picked
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (youtubeId) return
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !imageUrl && !youtubeId) { setError('Add some text, image, or video'); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text: text.trim(), image_url: imageUrl || null,
        prompt_text: promptText.trim() || null, ai_tool: aiTool || null,
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

          {/* Image drop zone / preview */}
          <div
            onDragOver={e => { e.preventDefault(); if (!youtubeId) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ margin: '0 0 4px' }}
          >
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${dragOver ? 'rgba(255,109,31,0.5)' : 'rgba(255,255,255,0.07)'}`, transition: 'border-color 0.15s' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />

                {/* Uploading overlay */}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: '#FAF3E1', fontWeight: 600 }}>Uploading to Cloudinary...</span>
                  </div>
                )}

                {/* Uploaded badge + remove button */}
                {!uploading && (
                  <>
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Uploaded
                    </div>
                    <button type="button" onClick={() => { setImageUrl(''); setImagePreview('') }}
                      style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '8px', padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 }}>
                      Change
                    </button>
                  </>
                )}
              </div>
            ) : !youtubeId && (
              /* Drop zone — only visible when no image/video */
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: dragOver ? 'rgba(255,109,31,0.04)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)')}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px' }}>🖼</div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', margin: '0 0 4px' }}>
                  {dragOver ? 'Drop to upload' : 'Click or drag image here'}
                </p>
                <p style={{ fontSize: '12px', color: '#9a8f7a', margin: 0 }}>JPG, PNG, WebP, GIF — max 10MB</p>
              </div>
            )}
          </div>

          {/* YouTube preview */}
          {youtubeId && (
            <div style={{ margin: '0 18px 14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', animation: 'fadeUp 0.25s ease' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                <img src={youtubeThumbnail} alt="Video" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(255,109,31,0.4)' }}>
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

          {/* AI Prompt section */}
          {showPrompt && (
            <div style={{ margin: '0 18px 14px', background: 'rgba(255,109,31,0.04)', border: '1px solid rgba(255,109,31,0.12)', borderRadius: '12px', padding: '14px', animation: 'fadeUp 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6D1F', letterSpacing: '0.05em' }}>✦ AI PROMPT</span>
                <button type="button" onClick={() => setShowPrompt(false)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
              </div>
              <textarea value={promptText} onChange={e => setPromptText(e.target.value)}
                placeholder="Paste the exact prompt you used..."
                rows={3}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#F5E7C6', fontFamily: 'monospace', resize: 'none', outline: 'none', lineHeight: 1.6 }}
              />
              <div ref={toolDropdownRef} style={{ position: 'relative', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowToolDropdown(v => !v)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: aiTool ? '#FAF3E1' : '#9a8f7a', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' as const }}
                >
                  <span>{aiTool || 'Select AI tool used...'}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: showToolDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M2 4l4 4 4-4"/>
                  </svg>
                </button>
                {showToolDropdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '240px', overflowY: 'auto' }}>
                    <div
                      onClick={() => { setAiTool(''); setShowToolDropdown(false) }}
                      style={{ padding: '9px 12px', fontSize: '12px', color: '#555', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >Select AI tool used...</div>
                    {aiTools.map(t => (
                      <div
                        key={t}
                        onClick={() => { setAiTool(t); setShowToolDropdown(false) }}
                        style={{ padding: '9px 12px', fontSize: '12px', color: aiTool === t ? '#FF6D1F' : '#FAF3E1', cursor: 'pointer', background: aiTool === t ? 'rgba(255,109,31,0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (aiTool !== t) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (aiTool !== t) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                      >
                        {t}
                        {aiTool === t && <span style={{ fontSize: '10px' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 0' }} />

          {/* Bottom toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px' }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />

            {/* Image button */}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={!!youtubeId || uploading} title="Add image"
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: youtubeId ? 'not-allowed' : 'pointer', background: imageUrl ? 'rgba(255,109,31,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: youtubeId ? 0.35 : 1, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!youtubeId) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = imageUrl ? 'rgba(255,109,31,0.15)' : 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="3" width="15" height="12" rx="2" stroke={imageUrl ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <circle cx="6" cy="7.5" r="1.5" stroke={imageUrl ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <path d="M1.5 12L5.5 8.5L8.5 11.5L11.5 8.5L16.5 13" stroke={imageUrl ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Video button */}
            <button type="button" onClick={() => { setShowVideo(!showVideo); if (showVideo) { setYoutubeLink(''); setYoutubeId('') } }} disabled={!!imageUrl} title="Add YouTube video"
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: imageUrl ? 'not-allowed' : 'pointer', background: (showVideo || youtubeId) ? 'rgba(255,109,31,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imageUrl ? 0.35 : 1, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!imageUrl) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = (showVideo || youtubeId) ? 'rgba(255,109,31,0.15)' : 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1.5" y="3.5" width="11" height="11" rx="2" stroke={(showVideo || youtubeId) ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3"/>
                <path d="M12.5 6.5L16.5 4.5V13.5L12.5 11.5" stroke={(showVideo || youtubeId) ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Prompt button */}
            <button type="button" onClick={() => setShowPrompt(!showPrompt)} title="Add AI prompt"
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: showPrompt ? 'rgba(255,109,31,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = showPrompt ? 'rgba(255,109,31,0.2)' : 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = showPrompt ? 'rgba(255,109,31,0.15)' : 'transparent' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5L10.8 6.5H16L11.6 9.5L13.4 14.5L9 11.5L4.6 14.5L6.4 9.5L2 6.5H7.2L9 1.5Z" stroke={showPrompt ? '#FF6D1F' : '#9a8f7a'} strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Character count far right */}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#555' }}>{text.length > 0 ? `${text.length}` : ''}</span>
          </div>
        </div>

        {/* Help text */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginTop: '14px', lineHeight: 1.5 }}>
          🖼 image &nbsp;·&nbsp; ▶ YouTube &nbsp;·&nbsp; ✦ AI prompt &nbsp;·&nbsp; # tags — all optional
        </p>
      </form>
    </div>
  )
}
