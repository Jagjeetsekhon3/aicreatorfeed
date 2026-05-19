// lib/cloudinary.ts — Upload helpers for images

export type CloudinaryUploadResult = {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

/**
 * Upload an image file to Cloudinary via the /api/upload route.
 * Returns the secure URL and public_id to save in your database.
 */
export async function uploadImage(file: File, folder = 'posts'): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Image upload failed')
  return res.json()
}

/**
 * Build a Cloudinary URL with transformations.
 * e.g. getOptimizedUrl('posts/abc123', { width: 800, quality: 'auto' })
 */
export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: string; format?: string } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const { width = 800, quality = 'auto', format = 'auto' } = options
  const transforms = `f_${format},q_${quality},w_${width}${options.height ? `,h_${options.height},c_fill` : ''}`
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`
}
