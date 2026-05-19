// types/index.ts — All shared types for NexusAI

export type MediaType = 'image' | 'video' | 'text'

export type User = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null      // Stored in Supabase Storage
  bio: string | null
  website: string | null
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  user: User
  caption: string
  prompt_text: string | null     // The actual AI prompt
  media_type: MediaType
  image_url: string | null       // Cloudinary URL
  video_url: string | null       // YouTube video ID or Cloudinary URL
  ai_tool: string | null         // e.g. "Midjourney", "Sora", "DALL·E 3"
  tags: string[]
  likes_count: number
  comments_count: number
  is_liked: boolean              // Whether current user liked it
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  user: User
  content: string
  created_at: string
}

export type Tutorial = {
  id: string
  title: string
  description: string
  youtube_video_id: string       // Just the ID, e.g. "dQw4w9WgXcQ"
  thumbnail_url: string          // YouTube thumbnail
  duration_minutes: number
  views_count: number
  published_at: string
  tags: string[]
}

export type NewsItem = {
  id: string
  title: string
  summary: string
  source_name: string
  source_url: string
  published_at: string
  tags: string[]
}

export type Follow = {
  follower_id: string
  following_id: string
  created_at: string
}
