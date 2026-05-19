import { getYouTubeThumbnail, getYouTubeEmbedUrl } from '@/lib/youtube'
import Image from 'next/image'
import { Clock, Eye, PlayCircle, Calendar } from 'lucide-react'
import type { Tutorial } from '@/types'

// Mock data — replace with Supabase query
const TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'Mastering Midjourney v6: Lighting & Composition Deep Dive',
    description: 'Learn how to control lighting, mood, and composition in Midjourney v6. I cover camera angles, lighting setups, and the exact prompts that work every time.',
    youtube_video_id: 'dQw4w9WgXcQ',
    thumbnail_url: getYouTubeThumbnail('dQw4w9WgXcQ'),
    duration_minutes: 28,
    views_count: 1247,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Midjourney', 'lighting', 'beginner'],
  },
  {
    id: '2',
    title: 'Build AI Video Workflows: Runway + Sora Together',
    description: 'A practical guide to combining Runway Gen-3 and Sora in your video production workflow. Real examples, real results.',
    youtube_video_id: 'jNQXAC9IVRw',
    thumbnail_url: getYouTubeThumbnail('jNQXAC9IVRw'),
    duration_minutes: 42,
    views_count: 892,
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Runway', 'Sora', 'video', 'workflow'],
  },
  {
    id: '3',
    title: 'The Complete Prompt Engineering Guide for 2025',
    description: 'Everything you need to know about writing prompts that work. Covers image, video, and text prompts across all major AI tools.',
    youtube_video_id: 'kJQP7kiw5Fk',
    thumbnail_url: getYouTubeThumbnail('kJQP7kiw5Fk'),
    duration_minutes: 55,
    views_count: 2419,
    published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['prompting', 'beginner', 'guide'],
  },
]

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function TutorialsPage() {
  const [latest, ...rest] = TUTORIALS

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Weekly tutorials</h1>
          <p className="text-[#9a8f7a] text-sm mt-1">New tutorial every Monday</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[#FF6D1F] bg-[rgba(255,109,31,0.08)] border border-[rgba(255,109,31,0.2)] px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          New this week
        </span>
      </div>

      {/* Featured latest tutorial */}
      <div className="card overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:w-2/5 relative aspect-video md:aspect-auto bg-gray-800">
            <Image
              src={latest.thumbnail_url}
              alt={latest.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer group">
              <PlayCircle size={52} className="text-white/80 group-hover:text-white group-hover:scale-105 transition-all" />
            </div>
            <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {latest.duration_minutes} min
            </span>
          </div>
          <div className="p-6 md:flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="tag bg-violet-900/50 text-[#FF6D1F]">Latest</span>
              {latest.tags.slice(0, 2).map(t => (
                <span key={t} className="tag bg-gray-800 text-[#9a8f7a]">{t}</span>
              ))}
            </div>
            <h2 className="text-xl font-semibold mb-3 leading-snug">{latest.title}</h2>
            <p className="text-[#9a8f7a] text-sm leading-relaxed mb-4">{latest.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#9a8f7a]">
              <span className="flex items-center gap-1.5"><Eye size={14} /> {formatViews(latest.views_count)} views</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> This week</span>
            </div>
            {/* Embed will show in a modal/page in real implementation */}
            <a
              href={`https://youtube.com/watch?v=${latest.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 bg-[#FF6D1F] hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              <PlayCircle size={16} />
              Watch tutorial
            </a>
          </div>
        </div>
      </div>

      {/* Rest of tutorials */}
      <h2 className="text-lg font-semibold mb-4">Previous tutorials</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {rest.map(tutorial => (
          <div key={tutorial.id} className="card overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer">
            <div className="relative aspect-video bg-gray-800">
              <Image
                src={tutorial.thumbnail_url}
                alt={tutorial.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <PlayCircle size={40} className="text-white" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                {tutorial.duration_minutes}m
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-sm leading-snug mb-2 group-hover:text-[#FF6D1F] transition-colors line-clamp-2">
                {tutorial.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#9a8f7a]">
                <span className="flex items-center gap-1"><Eye size={12} /> {formatViews(tutorial.views_count)}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {tutorial.duration_minutes} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
