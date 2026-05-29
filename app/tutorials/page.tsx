'use client'
import { useState, useEffect } from 'react'
import { getYouTubeThumbnail } from '@/lib/youtube'
import YouTubePlayer from '@/components/ui/YouTubePlayer'

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
  const [playing, setPlaying] = useState<Tutorial | null>(null)

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

  // Scroll to top of player when a video starts
  function openVideo(t: Tutorial) {
    setPlaying(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function TagPill({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
    return (
      <button onClick={onClick} style={{
        padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        background: active ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
        borderColor: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
        color: active ? 'var(--color-primary)' : '#9a8f7a',
      }}>{tag}</button>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Inline player ── */}
      {playing && (
        <div style={{ marginBottom: '32px', animation: 'fadeIn 0.25s ease' }}>
          {/* Player */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <YouTubePlayer videoId={playing.youtube_video_id} />
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-cream)', marginBottom: '6px', lineHeight: 1.3 }}>{playing.title}</h2>
              <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, margin: '0 0 10px' }}>{playing.description}</p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9a8f7a', flexWrap: 'wrap' }}>
                <span>⏱ {playing.duration_minutes} min</span>
                <span>👁 {(playing.views_count || 0).toLocaleString()} views</span>
                {playing.tags.map(t => (
                  <span key={t} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>#{t}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setPlaying(null)}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9a8f7a', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}
            >✕ Close</button>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginTop: '24px', marginBottom: '32px' }} />
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-cream)', marginBottom: '4px' }}>Weekly tutorials</h1>
          <p style={{ fontSize: '13px', color: '#9a8f7a' }}>New tutorial every Monday • Watch right here</p>
        </div>
        {tutorials.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', padding: '6px 14px', borderRadius: '999px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
            New this week
          </span>
        )}
      </div>

      {/* ── Search + filters ── */}
      <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tutorials..."
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px', color: 'var(--color-cream)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <TagPill tag="All" active={!activeTag} onClick={() => setActiveTag(null)} />
          {ALL_TAGS.map(tag => (
            <TagPill key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} />
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && tutorials.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
          <p style={{ color: '#9a8f7a', fontSize: '15px' }}>
            {search || activeTag ? 'No tutorials match your search.' : 'No tutorials yet — check back soon!'}
          </p>
          {(search || activeTag) && (
            <button onClick={() => { setSearch(''); setActiveTag(null) }}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Featured (latest) ── */}
      {!loading && latest && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            background: '#2f2f2f', border: `2px solid ${playing?.id === latest.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '16px', overflow: 'hidden', marginBottom: '32px',
            display: 'flex', flexWrap: 'wrap' as const, cursor: 'pointer', transition: 'border-color 0.15s',
          }}
            onClick={() => openVideo(latest)}
          >
            {/* Thumbnail */}
            <div style={{ position: 'relative', flex: '0 0 300px', minHeight: '200px', background: '#1a1a1a' }}>
              <img
                src={latest.thumbnail_url || getYouTubeThumbnail(latest.youtube_video_id)}
                alt={latest.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: playing?.id === latest.id ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-primary) 90%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '20px', marginLeft: '4px' }}>{playing?.id === latest.id ? '■' : '▶'}</span>
                </div>
              </div>
              <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                {latest.duration_minutes} min
              </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, padding: '24px', minWidth: '240px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}>Latest</span>
                {latest.tags.slice(0, 3).map(t => (
                  <span key={t} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>{t}</span>
                ))}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-cream)', lineHeight: 1.4, marginBottom: '10px' }}>{latest.title}</h2>
              <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '20px' }}>{latest.description}</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9a8f7a', marginBottom: '20px' }}>
                <span>👁 {(latest.views_count || 0).toLocaleString()} views</span>
                <span>⏱ {latest.duration_minutes} min</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>
                {playing?.id === latest.id ? '■ Now playing' : '▶ Watch now'}
              </div>
            </div>
          </div>

          {/* Rest — grid */}
          {rest.length > 0 && (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '16px' }}>
                {search || activeTag ? 'Results' : 'Previous tutorials'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {rest.map((t, i) => (
                  <div
                    key={t.id}
                    onClick={() => openVideo(t)}
                    style={{
                      background: '#2f2f2f', border: `1px solid ${playing?.id === t.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                      animation: `fadeIn 0.3s ease ${i * 0.05}s both`, transition: 'border-color 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--color-primary) 40%, transparent)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = playing?.id === t.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#1a1a1a' }}>
                      <img
                        src={t.thumbnail_url || getYouTubeThumbnail(t.youtube_video_id)}
                        alt={t.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: playing?.id === t.id ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-primary) 85%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '16px', marginLeft: playing?.id === t.id ? '0' : '3px' }}>{playing?.id === t.id ? '■' : '▶'}</span>
                        </div>
                      </div>
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                        {t.duration_minutes}m
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-cream)', lineHeight: 1.4, marginBottom: '6px' }}>{t.title}</h3>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
