import { getYouTubeThumbnail } from '@/lib/youtube'

const TUTORIALS = [
  {
    id: '1', title: 'Mastering Midjourney v6: Lighting & Composition',
    description: 'Learn how to control lighting, mood, and composition in Midjourney v6.',
    youtube_video_id: 'dQw4w9WgXcQ', duration_minutes: 28, views_count: 1247,
    tags: ['Midjourney', 'lighting'],
  },
  {
    id: '2', title: 'Build AI Video Workflows: Runway + Sora Together',
    description: 'A practical guide to combining Runway Gen-3 and Sora in your video workflow.',
    youtube_video_id: 'jNQXAC9IVRw', duration_minutes: 42, views_count: 892,
    tags: ['Runway', 'Sora', 'video'],
  },
  {
    id: '3', title: 'The Complete Prompt Engineering Guide for 2025',
    description: 'Everything you need to know about writing prompts that actually work.',
    youtube_video_id: 'kJQP7kiw5Fk', duration_minutes: 55, views_count: 2419,
    tags: ['prompting', 'guide'],
  },
]

export default function TutorialsPage() {
  const [latest, ...rest] = TUTORIALS
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#FAF3E1', marginBottom: '4px' }}>Weekly tutorials</h1>
          <p style={{ fontSize: '13px', color: '#9a8f7a' }}>New tutorial every Monday</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px',
          color: '#FF6D1F', background: 'rgba(255,109,31,0.08)',
          border: '1px solid rgba(255,109,31,0.2)', padding: '6px 14px', borderRadius: '999px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6D1F', display: 'inline-block' }} />
          New this week
        </span>
      </div>

      {/* Featured */}
      <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', display: 'flex', flexWrap: 'wrap' as const }}>
        <div style={{ position: 'relative', flex: '0 0 300px', minHeight: '200px', background: '#1a1a1a' }}>
          <img src={getYouTubeThumbnail(latest.youtube_video_id)} alt={latest.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '48px', color: '#fff', opacity: 0.9 }}>▶</span>
          </div>
          <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
            {latest.duration_minutes} min
          </span>
        </div>
        <div style={{ flex: 1, padding: '24px', minWidth: '240px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,109,31,0.15)', color: '#FF6D1F' }}>Latest</span>
            {latest.tags.map(t => (
              <span key={t} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>{t}</span>
            ))}
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', lineHeight: 1.4, marginBottom: '10px' }}>{latest.title}</h2>
          <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '20px' }}>{latest.description}</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9a8f7a', marginBottom: '20px' }}>
            <span>👁 {latest.views_count.toLocaleString()} views</span>
            <span>⏱ {latest.duration_minutes} min</span>
          </div>
          <a href={`https://youtube.com/watch?v=${latest.youtube_video_id}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', fontSize: '13px', textDecoration: 'none' }}>
            ▶ Watch tutorial
          </a>
        </div>
      </div>

      {/* Rest */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FAF3E1', marginBottom: '16px' }}>Previous tutorials</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {rest.map(t => (
          <div key={t.id} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#1a1a1a' }}>
              <img src={getYouTubeThumbnail(t.youtube_video_id)} alt={t.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>{t.duration_minutes}m</span>
            </div>
            <div style={{ padding: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', lineHeight: 1.4, marginBottom: '8px' }}>{t.title}</h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9a8f7a' }}>
                <span>👁 {t.views_count.toLocaleString()}</span>
                <span>⏱ {t.duration_minutes}m</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
