'use client'
import { useState, useEffect } from 'react'
import { getYouTubeThumbnail } from '@/lib/youtube'

type Tutorial = {
  id: string
  title: string
  description: string
  youtube_video_id: string
  thumbnail_url: string
  duration_minutes: number
  views_count: number
  tags: string[]
  published_at: string
}

const ALL_TAGS = ['Midjourney', 'Runway', 'Sora', 'Flux', 'prompting', 'workflow', 'video', 'guide', 'tips']

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTag) params.set('tag', activeTag)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/tutorials?${params}`)
      const data = await res.json()
      setTutorials(data.tutorials || [])
      setLoading(false)
    }
    load()
  }, [activeTag, search])

  const [latest, ...rest] = tutorials

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#FAF3E1', marginBottom: '4px' }}>Weekly tutorials</h1>
          <p style={{ fontSize: '13px', color: '#9a8f7a' }}>New tutorial every Monday</p>
        </div>
        {tutorials.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: '#FF6D1F', background: 'rgba(255,109,31,0.08)',
            border: '1px solid rgba(255,109,31,0.2)', padding: '6px 14px', borderRadius: '999px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6D1F', display: 'inline-block' }} />
            New this week
          </span>
        )}
      </div>

      {/* Search + tag filters */}
      <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tutorials..."
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              background: !activeTag ? 'rgba(255,109,31,0.15)' : 'transparent',
              borderColor: !activeTag ? '#FF6D1F' : 'rgba(255,255,255,0.1)',
              color: !activeTag ? '#FF6D1F' : '#9a8f7a',
            }}
          >All</button>
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: activeTag === tag ? 'rgba(255,109,31,0.15)' : 'transparent',
                borderColor: activeTag === tag ? '#FF6D1F' : 'rgba(255,255,255,0.1)',
                color: activeTag === tag ? '#FF6D1F' : '#9a8f7a',
              }}
            >{tag}</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && tutorials.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
          <p style={{ color: '#9a8f7a', fontSize: '15px' }}>
            {search || activeTag ? 'No tutorials match your search.' : 'No tutorials yet — check back soon!'}
          </p>
          {(search || activeTag) && (
            <button onClick={() => { setSearch(''); setActiveTag(null) }}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: '#FF6D1F', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Featured (latest tutorial) */}
      {!loading && latest && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '32px',
            display: 'flex', flexWrap: 'wrap' as const,
          }}>
            {/* Thumbnail */}
            <a
              href={`https://youtube.com/watch?v=${latest.youtube_video_id}`}
              target="_blank" rel="noopener noreferrer"
              style={{ position: 'relative', flex: '0 0 300px', minHeight: '200px', background: '#1a1a1a', display: 'block', textDecoration: 'none' }}
            >
              <img
                src={latest.thumbnail_url || getYouTubeThumbnail(latest.youtube_video_id)}
                alt={latest.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,109,31,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '20px', marginLeft: '4px' }}>▶</span>
                </div>
              </div>
              <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                {latest.duration_minutes} min
              </span>
            </a>

            {/* Info */}
            <div style={{ flex: 1, padding: '24px', minWidth: '240px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,109,31,0.15)', color: '#FF6D1F' }}>Latest</span>
                {latest.tags.slice(0, 3).map(t => (
                  <span key={t} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>{t}</span>
                ))}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', lineHeight: 1.4, marginBottom: '10px' }}>{latest.title}</h2>
              <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '20px' }}>{latest.description}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9a8f7a', marginBottom: '20px' }}>
                <span>👁 {(latest.views_count || 0).toLocaleString()} views</span>
                <span>⏱ {latest.duration_minutes} min</span>
              </div>
              <a
                href={`https://youtube.com/watch?v=${latest.youtube_video_id}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}
              >
                ▶ Watch tutorial
              </a>
            </div>
          </div>

          {/* Rest of tutorials grid */}
          {rest.length > 0 && (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FAF3E1', marginBottom: '16px' }}>
                {search || activeTag ? 'Results' : 'Previous tutorials'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {rest.map((t, i) => (
                  <a
                    key={t.id}
                    href={`https://youtube.com/watch?v=${t.youtube_video_id}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', display: 'block',
                      animation: `fadeIn 0.3s ease ${i * 0.05}s both`, transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#1a1a1a' }}>
                      <img
                        src={t.thumbnail_url || getYouTubeThumbnail(t.youtube_video_id)}
                        alt={t.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,109,31,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                          <span style={{ color: '#fff', fontSize: '16px', marginLeft: '3px' }}>▶</span>
                        </div>
                      </div>
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                        {t.duration_minutes}m
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', lineHeight: 1.4, marginBottom: '6px' }}>{t.title}</h3>
                      <p style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.5, marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {t.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#9a8f7a' }}>
                          <span>👁 {(t.views_count || 0).toLocaleString()}</span>
                          <span>⏱ {t.duration_minutes}m</span>
                        </div>
                        {t.tags.length > 0 && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>
                            {t.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
