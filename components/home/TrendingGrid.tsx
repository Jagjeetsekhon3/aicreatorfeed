'use client'

export default function TrendingGrid({ posts }: { posts: any[] }) {
  if (!posts.length) return null
  return (
    <>
      <style>{`
        .trending-card { transition: border-color 0.15s, transform 0.15s; }
        .trending-card:hover { border-color: rgba(255,109,31,0.4) !important; transform: translateY(-2px); }
        .trending-overlay { opacity: 0; transition: opacity 0.2s; }
        .trending-card:hover .trending-overlay { opacity: 1; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {posts.map((post: any) => {
          const user = Array.isArray(post.user) ? post.user[0] : post.user
          return (
          <a key={post.id} href={`/post/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="trending-card" style={{
              background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', overflow: 'hidden', aspectRatio: '1', position: 'relative',
            }}>
              {post.image_url && (
                <img src={post.image_url} alt={post.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div className="trending-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '12px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {post.caption || post.prompt_text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {user?.avatar_url
                    ? <img src={user.avatar_url} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,109,31,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>{user?.full_name?.[0]}</div>
                  }
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>@{user?.username}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>♥ {post.likes_count}</span>
                </div>
              </div>
              {post.ai_tool && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: 700, color: '#FF8540' }}>
                  {post.ai_tool}
                </div>
              )}
              {post.prompt_text && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,109,31,0.8)', borderRadius: '4px', padding: '2px 5px', fontSize: '9px', fontWeight: 700, color: '#fff' }}>✦</div>
              )}
            </div>
          </a>
        )})}
      </div>
    </>
  )
}
