'use client'
import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'

const SOURCE_COLORS: Record<string, string> = {
  'TechCrunch': '#0f9d58', 'The Verge': '#fa4454', 'Wired': '#000',
  'VentureBeat': '#e5202e', 'MIT Tech Review': '#a31f34', 'ArsTechnica': '#ff6600',
  'OpenAI': '#10a37f', 'Anthropic': '#c9602a', 'Google': '#4285f4',
  'Meta': '#0866ff', 'Microsoft': '#00a4ef', 'default': '#FF6D1F',
}

const ALL_TAGS = ['All', 'Models', 'Tools', 'Research', 'Products', 'Business', 'Video AI', 'Image AI', 'Open Source']

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tag, setTag] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(0); setNews([]); loadNews(0, true)
  }, [tag])

  async function loadNews(p = 0, reset = false) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '12' })
    if (tag !== 'All') params.set('tag', tag)
    if (search.trim()) params.set('search', search.trim())
    const res = await fetch(`/api/news?${params}`)
    const data = await res.json()
    const items = data.news || []
    if (reset) setNews(items); else setNews(prev => [...prev, ...items])
    setHasMore(items.length === 12)
    setPage(p + 1)
    setLoading(false)
  }

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(0); setNews([]); loadNews(0, true) }

  const sourceColor = (source: string) => SOURCE_COLORS[source] || SOURCE_COLORS.default

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#FAF3E1', marginBottom: '4px' }}>AI News</h1>
        <p style={{ fontSize: '14px', color: '#9a8f7a' }}>Curated updates from the world of AI — handpicked by AiCreatorFeed</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 14px' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="#9a8f7a" strokeWidth="1.3"/>
              <path d="M10.5 10.5L13 13" stroke="#9a8f7a" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#FAF3E1', fontFamily: 'inherit', padding: '12px 0' }} />
          </div>
          <button type="submit" style={{ background: '#FF6D1F', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
        </div>
      </form>

      {/* Tag filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {ALL_TAGS.map(t => (
          <button key={t} onClick={() => setTag(t)} style={{
            padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${tag === t ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`,
            background: tag === t ? 'rgba(255,109,31,0.12)' : 'transparent',
            color: tag === t ? '#FF6D1F' : '#9a8f7a', cursor: 'pointer', fontFamily: 'inherit',
          }}>{t}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && news.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && news.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📰</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>No news yet</h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px' }}>Check back soon — we post AI news daily</p>
        </div>
      )}

      {/* Featured top story */}
      {news.length > 0 && (
        <>
          <a href={news[0].source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              {news[0].image_url && (
                <div style={{ height: '220px', overflow: 'hidden', background: '#1a1a1a' }}>
                  <img src={news[0].image_url} alt={news[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: `${sourceColor(news[0].source_name)}22`, color: sourceColor(news[0].source_name) }}>{news[0].source_name}</span>
                  <span style={{ fontSize: '11px', color: '#9a8f7a' }}>{formatDistanceToNow(new Date(news[0].published_at), { addSuffix: true })}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F' }}>Featured</span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FAF3E1', lineHeight: 1.35, marginBottom: '10px' }}>{news[0].title}</h2>
                <p style={{ fontSize: '14px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '12px' }}>{news[0].summary}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(news[0].tags || []).map((t: string) => (
                    <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </a>

          {/* Rest of news grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
            {news.slice(1).map((item, i) => (
              <a key={item.id} href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}>
                <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', height: '100%', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  {item.image_url && (
                    <div style={{ height: '140px', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                      <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    </div>
                  )}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sourceColor(item.source_name), flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9a8f7a' }}>{item.source_name}</span>
                      <span style={{ fontSize: '11px', color: '#6b6460', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</span>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', lineHeight: 1.45, marginBottom: '8px', flex: 1 }}>{item.title}</h3>
                    <p style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.5, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.summary}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(item.tags || []).slice(0, 2).map((t: string) => (
                          <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9a8f7a' }}>{t}</span>
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: '#FF6D1F', fontWeight: 600, flexShrink: 0 }}>Read →</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '28px' }}>
              <button onClick={() => loadNews(page)} disabled={loading} style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6', padding: '10px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {loading ? <><div style={{ width: '14px', height: '14px', border: '2px solid #FF6D1F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Loading...</> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
