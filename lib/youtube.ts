// lib/youtube.ts — YouTube embed helpers

/**
 * Extract video ID from any YouTube URL format:
 *   https://youtu.be/dQw4w9WgXcQ
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   https://youtube.com/shorts/dQw4w9WgXcQ
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Get YouTube thumbnail URL (hqdefault = 480x360) */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hqdefault' | 'maxresdefault' = 'hqdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/** Get YouTube embed URL */
export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}
