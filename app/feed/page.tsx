import PostCard from '@/components/feed/PostCard'
import type { Post } from '@/types'
import { Flame, Clock, TrendingUp } from 'lucide-react'

const MOCK_POSTS: Post[] = [
  {
    id: '1', user_id: 'u1',
    user: { id: 'u1', username: 'rahul_ai', full_name: 'Rahul Kumar', avatar_url: null, bio: null, website: null, followers_count: 1200, following_count: 340, posts_count: 87, created_at: '2024-01-01' },
    caption: 'Cosmic nebula cityscape — took 40+ iterations to get the lighting right!',
    prompt_text: 'Cosmic nebula cityscape at night, cinematic wide shot, neon purple and blue atmosphere, ultra-detailed skyscrapers reflecting nebula light, hyperrealistic 8K render, volumetric fog, Blade Runner aesthetic, dramatic contrast',
    media_type: 'image',
    image_url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800',
    video_url: null, ai_tool: 'Midjourney',
    tags: ['cinematic', 'space', 'cityscape', 'scifi'],
    likes_count: 284, comments_count: 42, is_liked: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2', user_id: 'u2',
    user: { id: 'u2', username: 'sneha_creates', full_name: 'Sneha Agarwal', avatar_url: null, bio: null, website: null, followers_count: 890, following_count: 210, posts_count: 54, created_at: '2024-01-01' },
    caption: 'Portrait series using negative space — the prompt is everything here',
    prompt_text: 'Minimalist portrait of a woman, extreme negative space, soft studio lighting, fine art photography, black and white, high contrast, medium format film grain, timeless elegance',
    media_type: 'image',
    image_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    video_url: null, ai_tool: 'DALL·E 3',
    tags: ['portrait', 'minimalist', 'blackandwhite'],
    likes_count: 197, comments_count: 28, is_liked: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3', user_id: 'u3',
    user: { id: 'u3', username: 'vikram_design', full_name: 'Vikram Desai', avatar_url: null, bio: null, website: null, followers_count: 2100, following_count: 180, posts_count: 132, created_at: '2024-01-01' },
    caption: 'Abstract macro world — this prompt produces a different result every time',
    prompt_text: 'Extreme macro photography of abstract colorful liquid, soap bubble interference patterns, iridescent surface tension, shallow depth of field, vibrant spectrum colors, studio lighting, 100mm macro lens',
    media_type: 'image',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    video_url: null, ai_tool: 'Stable Diffusion',
    tags: ['macro', 'abstract', 'colorful', 'art'],
    likes_count: 156, comments_count: 19, is_liked: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function FeedPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { label: 'Trending', icon: TrendingUp },
            { label: 'Latest',   icon: Clock },
            { label: 'Hot today', icon: Flame },
          ].map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border"
              style={i === 0
                ? { background: '#FF6D1F', color: '#fff', borderColor: '#FF6D1F' }
                : { background: '#2f2f2f', color: '#9a8f7a', borderColor: 'rgba(255,255,255,0.07)' }
              }
            >
              <Icon size={14} /> {label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {['All', 'Images', 'Videos'].map((f, i) => (
              <button
                key={f}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ color: i === 0 ? '#FF6D1F' : '#9a8f7a', background: i === 0 ? 'rgba(255,109,31,0.1)' : 'transparent' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_POSTS.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block space-y-4">
        <div className="rounded-2xl p-4 border" style={{ background: '#2f2f2f', borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#FAF3E1' }}>Trending tools</h3>
          {['Midjourney v6', 'Sora 2', 'DALL·E 3', 'Stable Diffusion XL'].map((tool, i) => (
            <div key={tool} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span className="text-sm" style={{ color: '#F5E7C6' }}>{tool}</span>
              <span className="text-xs font-bold" style={{ color: '#FF6D1F' }}>#{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 border" style={{ background: '#2f2f2f', borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#FAF3E1' }}>Suggested creators</h3>
          {['Priya Sharma', 'Arjun Mehta', 'Meera Rao'].map(name => (
            <div key={name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,109,31,0.2)', color: '#FF6D1F' }}
                >
                  {name[0]}
                </div>
                <span className="text-sm" style={{ color: '#F5E7C6' }}>{name}</span>
              </div>
              <button
                className="text-xs font-semibold transition-colors"
                style={{ color: '#FF6D1F' }}
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
