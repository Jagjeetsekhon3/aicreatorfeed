'use client'
import { useState } from 'react'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube'

export default function YouTubePlayer({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false)

  if (playing) return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
      <iframe
        src={`${getYouTubeEmbedUrl(videoId)}&autoplay=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )

  return (
    <div
      onClick={() => setPlaying(true)}
      style={{ position: 'relative', paddingBottom: '56.25%', background: '#000', cursor: 'pointer' }}
    >
      <img
        src={getYouTubeThumbnail(videoId, 'hqdefault')}
        alt="Video thumbnail"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      {/* Play button */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#FF6D1F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,109,31,0.5)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ color: '#fff', fontSize: '22px', marginLeft: '4px' }}>▶</span>
        </div>
      </div>
      {/* YouTube badge */}
      <div style={{
        position: 'absolute', bottom: '10px', right: '10px',
        background: 'rgba(0,0,0,0.7)', borderRadius: '6px',
        padding: '3px 8px', fontSize: '11px', color: '#fff', fontWeight: 600,
      }}>
        YouTube
      </div>
    </div>
  )
}
