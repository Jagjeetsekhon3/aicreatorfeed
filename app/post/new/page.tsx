'use client'
import { useState } from 'react'
import ImageUpload from '@/components/ui/ImageUpload'
import { Sparkles, Tag, ChevronDown } from 'lucide-react'

const AI_TOOLS = ['Midjourney', 'DALL·E 3', 'Stable Diffusion', 'Sora', 'Runway', 'Kling', 'Adobe Firefly', 'Other']
const MEDIA_TYPES = [
  { value: 'image', label: 'Image prompt' },
  { value: 'video', label: 'Video prompt' },
  { value: 'text',  label: 'Text / tips' },
]

const inputStyle = {
  width: '100%',
  background: '#2f2f2f',
  border: '0.5px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#FAF3E1',
  outline: 'none',
}

export default function NewPostPage() {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('image')
  const [caption, setCaption] = useState('')
  const [promptText, setPromptText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [aiTool, setAiTool] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      alert('Post ready to save! Connect Supabase to publish.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1" style={{ color: '#FAF3E1' }}>Share your prompt</h1>
        <p className="text-sm" style={{ color: '#9a8f7a' }}>Show the community what you created with AI</p>
      </div>

      {/* Media type selector */}
      <div className="flex gap-2 mb-6">
        {MEDIA_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMediaType(value as typeof mediaType)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
            style={mediaType === value
              ? { background: '#FF6D1F', color: '#fff', borderColor: '#FF6D1F' }
              : { background: '#2f2f2f', color: '#9a8f7a', borderColor: 'rgba(255,255,255,0.08)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {mediaType === 'image' && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#F5E7C6' }}>Image</label>
            <ImageUpload onUpload={(url) => setImageUrl(url)} folder="posts" />
          </div>
        )}

        {mediaType === 'video' && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#F5E7C6' }}>YouTube or video URL</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F5E7C6' }}>Caption</label>
          <input
            type="text"
            placeholder="Describe what you created..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#F5E7C6' }}>
            <Sparkles size={14} style={{ color: '#FF6D1F' }} />
            Your AI prompt
          </label>
          <textarea
            placeholder="Paste the exact prompt you used so others can try it..."
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            rows={4}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'none' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F5E7C6' }}>AI tool used</label>
          <div className="relative">
            <select
              value={aiTool}
              onChange={e => setAiTool(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Select tool...</option>
              {AI_TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9a8f7a' }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#F5E7C6' }}>
            <Tag size={14} />
            Tags
          </label>
          <input
            type="text"
            placeholder="cinematic, portrait, fantasy (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || (!caption && !promptText)}
          className="w-full font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
          style={{ background: '#FF6D1F', color: '#fff' }}
        >
          {submitting ? 'Publishing...' : 'Publish prompt'}
        </button>
      </form>
    </div>
  )
}
