'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

const FILTERS = [
  { key: 'all',       label: 'All',       icon: '✦' },
  { key: 'users',     label: 'People',    icon: '👤' },
  { key: 'posts',     label: 'Posts',     icon: '📝' },
  { key: 'spaces',    label: 'Spaces',    icon: '💬' },
  { key: 'news',      label: 'News',      icon: '📰' },
  { key: 'tutorials', label: 'Tutorials', icon: '🎬' },
  { key: 'tags',      label: 'Tags',      icon: '#' },
]

const TRENDING_SEARCHES = ['midjourney', 'sora', 'stable diffusion', 'prompt engineering', 'runway', 'ai art', 'flux', 'dalle']

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filter, setFilter] = useState(searchParams.get('type') || 'all')
  const [results, setResults] = useState<Record<string, any[]>>({ users: [], posts: [], spaces: [], news: [], tutorials: [], tags: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Run initial search if query in URL
  useEffect(() => {
    const q = searchParams.get('q')
    const t = searchParams.get('type') || 'all'
    if (q) { setQuery(q); setFilter(t); runSearch(q, t) }
  }, [])

  const runSearch = useCallback(async (q: string, type: string) => {
    if (!q.trim()) { setResults({ users: [], posts: [], spaces: [], news: [], tutorials: [], tags: [] }); setSearched(false); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&type=${type}`)
    const data = await res.json()
    setResults(data.results || {})
    setTotal(data.total || 0)
    setSearched(true)
    setLoading(false)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(value, filter)
      // Update URL without navigation
      const url = value ? `/search?q=${encodeURIComponent(value)}&type=${filter}` : '/search'
      window.history.replaceState({}, '', url)
    }, 280)
  }

  function handleFilter(type: string) {
    setFilter(type)
    if (query.trim()) runSearch(query, type)
  }

  const hasResults = Object.values(results).some(arr => arr.length > 0)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0 80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', padding: '4px 16px 4px 16px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        >
          {loading
            ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,109,31,0.3)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="5.5" stroke="#9a8f7a" strokeWidth="1.6"/>
                <path d="M12.5 12.5L16 16" stroke="#9a8f7a" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search people, posts, spaces, news, tags..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '16px', color: '#FAF3E1', fontFamily: 'inherit', padding: '13px 0',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearched(false); window.history.replaceState({}, '', '/search'); inputRef.current?.focus() }}
              style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '18px', padding: '4px', flexShrink: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {FILTERS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => handleFilter(key)} style={{
            padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            border: `1px solid ${filter === key ? '#FF6D1F' : 'rgba(255,255,255,0.08)'}`,
            background: filter === key ? 'rgba(255,109,31,0.12)' : 'transparent',
            color: filter === key ? '#FF6D1F' : '#9a8f7a',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ fontSize: '12px' }}>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Empty / trending state */}
      {!searched && !loading && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9a8f7a', marginBottom: '12px', letterSpacing: '0.05em' }}>TRENDING SEARCHES</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TRENDING_SEARCHES.map(term => (
                <button key={term} onClick={() => { setQuery(term); handleInput(term) }} style={{
                  padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F5E7C6', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,109,31,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,109,31,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF6D1F' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#F5E7C6' }}
                >
                  🔍 {term}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#9a8f7a', marginBottom: '14px', letterSpacing: '0.05em' }}>SEARCH ACROSS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {[
                { icon: '👤', label: 'People', desc: 'Find creators by name or username' },
                { icon: '📝', label: 'Posts', desc: 'Search captions and AI prompts' },
                { icon: '💬', label: 'Spaces', desc: 'Find community spaces' },
                { icon: '📰', label: 'News', desc: 'Search AI news articles' },
                { icon: '🎬', label: 'Tutorials', desc: 'Find video tutorials' },
                { icon: '#',  label: 'Tags', desc: 'Browse posts by hashtag' },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px 12px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a', lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && !hasResults && (
        <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FAF3E1', marginBottom: '8px' }}>No results for "{query}"</h3>
          <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '20px' }}>Try a different keyword or browse trending searches</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {TRENDING_SEARCHES.slice(0, 4).map(term => (
              <button key={term} onClick={() => { setQuery(term); handleInput(term) }} style={{ padding: '7px 14px', borderRadius: '999px', fontSize: '13px', background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.2)', color: '#FF6D1F', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && hasResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.2s ease' }}>

          {/* Results count */}
          <p style={{ fontSize: '13px', color: '#9a8f7a', margin: 0 }}>
            {total} result{total !== 1 ? 's' : ''} for <strong style={{ color: '#FAF3E1' }}>"{query}"</strong>
          </p>

          {/* Users */}
          {results.users?.length > 0 && (filter === 'all' || filter === 'users') && (
            <Section title="People" icon="👤" total={results.users.length} filter={filter} type="users" query={query}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.users.map((user: any) => (
                  <Link key={user.id} href={`/profile/${user.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', background: '#2f2f2f', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, flexShrink: 0 }}>{user.full_name?.[0]}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1' }}>{user.full_name}</span>
                        {(user.is_official || user.is_verified) && <VerifiedBadge isOfficial={user.is_official} size={14} />}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9a8f7a' }}>@{user.username}</div>
                      {user.bio && <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.bio}</div>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a', flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#FAF3E1', fontSize: '14px' }}>{user.followers_count?.toLocaleString()}</div>
                      <div>followers</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Posts */}
          {results.posts?.length > 0 && (filter === 'all' || filter === 'posts') && (
            <Section title="Posts" icon="📝" total={results.posts.length} filter={filter} type="posts" query={query}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.posts.map((post: any) => (
                  <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none', display: 'flex', gap: '12px', background: '#2f2f2f', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    {post.image_url && <img src={post.image_url} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a' }}>@{post.user?.username}</span>
                        {(post.user?.is_official || post.user?.is_verified) && <VerifiedBadge isOfficial={post.user.is_official} size={12} />}
                        {post.ai_tool && <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F', fontWeight: 700 }}>{post.ai_tool}</span>}
                      </div>
                      <p style={{ fontSize: '13px', color: '#F5E7C6', margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, lineHeight: 1.5 }}>{post.caption || post.prompt_text || '(no caption)'}</p>
                      <div style={{ fontSize: '11px', color: '#9a8f7a' }}>♥ {post.likes_count} · {post.media_type}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Spaces */}
          {results.spaces?.length > 0 && (filter === 'all' || filter === 'spaces') && (
            <Section title="Spaces" icon="💬" total={results.spaces.length} filter={filter} type="spaces" query={query}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {results.spaces.map((space: any) => (
                  <Link key={space.id} href={`/community/${space.name}`} style={{ textDecoration: 'none', background: '#2f2f2f', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', display: 'block', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    <div style={{ height: '4px', background: space.cover_color || '#FF6D1F' }} />
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${space.cover_color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{space.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1' }}>{space.display_name}</span>
                          {space.is_official && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F' }}>Official</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{space.member_count?.toLocaleString()} members</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* News */}
          {results.news?.length > 0 && (filter === 'all' || filter === 'news') && (
            <Section title="News" icon="📰" total={results.news.length} filter={filter} type="news" query={query}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.news.map((item: any) => (
                  <a key={item.id} href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', gap: '12px', background: '#2f2f2f', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#FF6D1F', fontWeight: 600, marginBottom: '4px' }}>{item.source_name}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', marginBottom: '4px', lineHeight: 1.4 }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#9a8f7a', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.summary}</div>
                      <div style={{ fontSize: '11px', color: '#6b6460', marginTop: '6px' }}>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#FF6D1F', fontWeight: 600, flexShrink: 0, alignSelf: 'center' }}>Read →</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Tutorials */}
          {results.tutorials?.length > 0 && (filter === 'all' || filter === 'tutorials') && (
            <Section title="Tutorials" icon="🎬" total={results.tutorials.length} filter={filter} type="tutorials" query={query}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {results.tutorials.map((tut: any) => (
                  <Link key={tut.id} href={`/tutorials`} style={{ textDecoration: 'none', background: '#2f2f2f', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', display: 'block', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    <div style={{ background: '#111', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={tut.thumbnail_url || `https://img.youtube.com/vi/${tut.youtube_video_id}/mqdefault.jpg`} alt={tut.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{tut.title}</div>
                      <div style={{ fontSize: '11px', color: '#9a8f7a' }}>🎬 {tut.duration_minutes} min · {tut.views_count} views</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Tags */}
          {results.tags?.length > 0 && (filter === 'all' || filter === 'tags') && (
            <Section title={`Posts tagged #${query.replace(/^#/, '')}`} icon="#" total={results.tags.length} filter={filter} type="tags" query={query}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {results.tags.map((post: any) => (
                  <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none', background: '#2f2f2f', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', display: 'block', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                  >
                    {post.image_url && <img src={post.image_url} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />}
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontSize: '12px', color: '#F5E7C6', margin: '0 0 4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{post.caption}</p>
                      <span style={{ fontSize: '11px', color: '#9a8f7a' }}>@{post.user?.username} · ♥ {post.likes_count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, total, filter, type, query, children }: any) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FAF3E1', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span>{icon}</span> {title}
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#9a8f7a' }}>({total})</span>
        </h2>
        {filter === 'all' && total >= 4 && (
          <Link href={`/search?q=${encodeURIComponent(query)}&type=${type}`} style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>
            See all →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
