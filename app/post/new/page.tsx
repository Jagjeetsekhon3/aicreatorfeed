'use client'
import { useState } from 'react'

const AI_TOOLS = ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Adobe Firefly', 'Other']
const MEDIA_TYPES = [
  { value: 'image', label: 'Image prompt' },
  { value: 'video', label: 'Video prompt' },
  { value: 'text',  label: 'Text / tips' },
]

const inp: React.CSSProperties = {
  width: '100%', background: '#2f2f2f',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
  padding: '12px 16px', fontSize: '14px', color: '#FAF3E1', outline: 'none',
  fontFamily: 'inherit',
}

export default function NewPostPage() {
  const [mediaType, setMediaType] = useState('image')
  const [caption, setCaption] = useState('')
  const [promptText, setPromptText] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [aiTool, setAiTool] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try { alert('Ready to save! Connect Supabase to publish.') }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 0' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#FAF3E1', marginBottom: '6px' }}>Share your prompt</h1>
      <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px' }}>Show the community what you created with AI</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {MEDIA_TYPES.map(({ value, label }) => (
          <button key={value} onClick={() => setMediaType(value)} style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: '1px solid', cursor: 'pointer',
            background: mediaType === value ? '#FF6D1F' : '#2f2f2f',
            borderColor: mediaType === value ? '#FF6D1F' : 'rgba(255,255,255,0.08)',
            color: mediaType === value ? '#fff' : '#9a8f7a',
          }}>{label}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {mediaType === 'video' && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '8px' }}>YouTube or video URL</label>
            <input type="url" placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={inp} />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '8px' }}>Caption</label>
          <input type="text" placeholder="Describe what you created..." value={caption} onChange={e => setCaption(e.target.value)} style={inp} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '8px' }}>✦ Your AI prompt</label>
          <textarea placeholder="Paste the exact prompt you used..." value={promptText} onChange={e => setPromptText(e.target.value)} rows={4} style={{ ...inp, fontFamily: 'monospace', resize: 'none' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '8px' }}>AI tool used</label>
          <select value={aiTool} onChange={e => setAiTool(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">Select tool...</option>
            {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#F5E7C6', marginBottom: '8px' }}>Tags</label>
          <input type="text" placeholder="cinematic, portrait, fantasy (comma separated)" value={tags} onChange={e => setTags(e.target.value)} style={inp} />
        </div>

        <button type="submit" disabled={submitting || (!caption && !promptText)} style={{
          background: '#FF6D1F', color: '#fff', fontWeight: 700, fontSize: '15px',
          border: 'none', borderRadius: '12px', padding: '14px', cursor: 'pointer',
          opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? 'Publishing...' : 'Publish prompt'}
        </button>
      </form>
    </div>
  )
}
