'use client'
import { useState, useCallback } from 'react'
import { uploadImage } from '@/lib/cloudinary'

type Props = {
  onUpload: (url: string, publicId: string) => void
  folder?: string
  maxSizeMB?: number
}

export default function ImageUpload({ onUpload, folder = 'posts', maxSizeMB = 10 }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`Max file size is ${maxSizeMB}MB`); return }
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const result = await uploadImage(file, folder)
      onUpload(result.secure_url, result.public_id)
    } catch { setError('Upload failed. Please try again.'); setPreview(null) }
    finally { setUploading(false) }
  }, [folder, maxSizeMB, onUpload])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (preview) return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: '16px', overflow: 'hidden', background: '#222' }}>
      <img src={preview} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {uploading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#FAF3E1', fontSize: '13px' }}>Uploading...</span>
        </div>
      )}
      {!uploading && (
        <button onClick={() => { setPreview(null); setError(null) }}
          style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>
          ×
        </button>
      )}
    </div>
  )

  return (
    <div>
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '12px', width: '100%', aspectRatio: '1', borderRadius: '16px',
          border: `2px dashed ${dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)'}`,
          background: dragOver ? 'rgba(255,109,31,0.05)' : '#2f2f2f', cursor: 'pointer',
        }}
      >
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,109,31,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
          🖼️
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#F5E7C6' }}><span style={{ color: '#FF6D1F' }}>Click to upload</span> or drag & drop</p>
          <p style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '4px' }}>PNG, JPG, WebP up to {maxSizeMB}MB</p>
        </div>
      </label>
      {error && <p style={{ marginTop: '8px', fontSize: '13px', color: '#ff6b6b' }}>⚠ {error}</p>}
    </div>
  )
}
