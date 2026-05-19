'use client'
import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ImageIcon, Upload } from 'lucide-react'
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
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }, [folder, maxSizeMB, onUpload])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden aspect-square" style={{ background: '#222' }}>
          <Image src={preview} alt="Preview" fill className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF6D1F', borderTopColor: 'transparent' }} />
              <span className="text-sm" style={{ color: '#FAF3E1' }}>Uploading...</span>
            </div>
          )}
          {!uploading && (
            <button
              onClick={() => { setPreview(null); setError(null) }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#FAF3E1' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-3 w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? '#FF6D1F' : 'rgba(255,255,255,0.1)',
            background: dragOver ? 'rgba(255,109,31,0.05)' : '#2f2f2f',
          }}
        >
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,109,31,0.1)' }}>
            <ImageIcon size={22} style={{ color: '#FF6D1F' }} />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium" style={{ color: '#F5E7C6' }}>
              <span style={{ color: '#FF6D1F' }}>Click to upload</span> or drag & drop
            </p>
            <p className="text-xs mt-1" style={{ color: '#9a8f7a' }}>PNG, JPG, WebP up to {maxSizeMB}MB</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9a8f7a' }}>
            <Upload size={11} /> Stored on Cloudinary CDN
          </div>
        </label>
      )}
      {error && (
        <p className="mt-2 text-sm flex items-center gap-1.5" style={{ color: '#ff6b6b' }}>
          <X size={13} /> {error}
        </p>
      )}
    </div>
  )
}
