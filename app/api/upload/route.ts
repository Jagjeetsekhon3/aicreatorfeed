// app/api/upload/route.ts
// Server-side Cloudinary upload — API secret never exposed to browser

import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

function getConfig() {
  const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const api_key    = process.env.CLOUDINARY_API_KEY
  const api_secret = process.env.CLOUDINARY_API_SECRET

  if (!cloud_name || !api_key || !api_secret ||
      cloud_name === 'your-cloud-name' || api_key === 'your-api-key') {
    return null
  }
  return { cloud_name, api_key, api_secret }
}

export async function POST(req: NextRequest) {
  // Config check — fail fast with a helpful message
  const config = getConfig()
  if (!config) {
    return NextResponse.json({
      error: 'Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel environment variables.',
      setup: true,
    }, { status: 503 })
  }

  cloudinary.config(config)

  try {
    const formData = await req.formData()
    const file   = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'posts'
    const type   = (formData.get('type') as string) || 'post' // post | avatar | thumbnail

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed (JPG, PNG, WebP, GIF)' }, { status: 400 })
    }

    // Validate size — 10MB max
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Maximum size is 10MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 })
    }

    // Convert to base64
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload config per type
    const transformations: Record<string, object[]> = {
      post: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1200, crop: 'limit' },
      ],
      avatar: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      ],
      thumbnail: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 800, height: 450, crop: 'fill' },
      ],
    }

    const result = await cloudinary.uploader.upload(base64, {
      folder: `aicreatorfeed/${folder}`,
      transformation: transformations[type] || transformations.post,
      resource_type: 'image',
    })

    return NextResponse.json({
      public_id:  result.public_id,
      secure_url: result.secure_url,
      width:      result.width,
      height:     result.height,
      format:     result.format,
      bytes:      result.bytes,
    })

  } catch (err: any) {
    console.error('Cloudinary upload error:', err)

    // Parse Cloudinary-specific errors
    const msg = err?.message || ''
    if (msg.includes('Invalid API key') || msg.includes('Must supply api_key')) {
      return NextResponse.json({ error: 'Invalid Cloudinary API key. Check your CLOUDINARY_API_KEY.' }, { status: 401 })
    }
    if (msg.includes('cloud_name') || msg.includes('Unknown API key')) {
      return NextResponse.json({ error: 'Invalid Cloudinary cloud name. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.' }, { status: 401 })
    }
    if (msg.includes('File size too large')) {
      return NextResponse.json({ error: 'File too large for your Cloudinary plan.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
