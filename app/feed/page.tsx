import Link from 'next/link'

const MOCK_POSTS = [
  {
    id: '1', author: 'Rahul Kumar', handle: 'rahul_ai', initials: 'RK', time: '2h ago',
    caption: 'Cosmic nebula cityscape — took 40+ iterations to get the lighting right!',
    prompt: 'Cosmic nebula cityscape at night, cinematic wide shot, neon purple and blue atmosphere, ultra-detailed skyscrapers, hyperrealistic 8K render, volumetric fog, Blade Runner aesthetic',
    tool: 'Midjourney', tags: ['cinematic', 'space', 'scifi'], likes: 284, comments: 42,
    image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600',
  },
  {
    id: '2', author: 'Sneha Agarwal', handle: 'sneha_creates', initials: 'SA', time: '5h ago',
    caption: 'Portrait series using negative space — the prompt is everything here',
    prompt: 'Minimalist portrait, extreme negative space, soft studio lighting, fine art photography, black and white, high contrast, medium format film grain',
    tool: 'DALL·E 3', tags: ['portrait', 'minimalist', 'bnw'], likes: 197, comments: 28,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
  },
  {
    id: '3', author: 'Vikram Desai', handle: 'vikram_design', initials: 'VD', time: '1d ago',
    caption: 'Abstract macro world — different result every single time',
    prompt: 'Extreme macro photography of abstract colorful liquid, soap bubble interference patterns, iridescent surface tension, shallow depth of field, vibrant spectrum colors',
    tool: 'Stable Diffusion', tags: ['macro', 'abstract', 'colorful'], likes: 156, comments: 19,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  },
]

export default function FeedPage() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

      {/* Main feed */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['Trending', 'Latest', 'Hot today'].map((f, i) => (
            <button key={f} style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: i === 0 ? '#FF6D1F' : '#2f2f2f',
              color: i === 0 ? '#fff' : '#9a8f7a',
            }}>{f}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {['All', 'Images', 'Videos'].map((f, i) => (
              <button key={f} style={{
                padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: 'none', cursor: 'pointer',
                background: i === 0 ? 'rgba(255,109,31,0.1)' : 'transparent',
                color: i === 0 ? '#FF6D1F' : '#9a8f7a',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Posts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {MOCK_POSTS.map(post => (
            <div key={post.id} style={{
              background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              {/* Image */}
              <div style={{ position: 'relative', paddingBottom: '100%', background: '#1a1a1a' }}>
                <img src={post.image} alt={post.caption} style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                }} />
                <span style={{
                  position: 'absolute', top: '10px', left: '10px',
                  background: 'rgba(255,109,31,0.85)', color: '#fff',
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                }}>{post.tool}</span>
              </div>

              <div style={{ padding: '14px' }}>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,109,31,0.2)', color: '#FF6D1F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                  }}>{post.initials}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1' }}>{post.author}</div>
                    <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{post.time}</div>
                  </div>
                </div>

                {/* Caption */}
                <p style={{ fontSize: '13px', color: '#F5E7C6', marginBottom: '10px', lineHeight: 1.5 }}>
                  {post.caption}
                </p>

                {/* Prompt */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                  padding: '10px', marginBottom: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{ fontSize: '12px', color: '#9a8f7a', fontFamily: 'monospace', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    "{post.prompt}"
                  </p>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
                      background: 'rgba(255,255,255,0.05)', color: '#9a8f7a',
                    }}>#{tag}</span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#9a8f7a' }}>
                    ♡ {post.likes}
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#9a8f7a' }}>
                    💬 {post.comments}
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', fontSize: '12px', color: '#FF6D1F', fontWeight: 600 }}>
                    Copy prompt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>Trending tools</h3>
          {['Midjourney v6', 'Sora 2', 'DALL·E 3', 'Stable Diffusion XL'].map((tool, i) => (
            <div key={tool} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ fontSize: '13px', color: '#F5E7C6' }}>{tool}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6D1F' }}>#{i + 1}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#FAF3E1', marginBottom: '12px' }}>Suggested creators</h3>
          {['Priya Sharma', 'Arjun Mehta', 'Meera Rao'].map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,109,31,0.15)', color: '#FF6D1F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}>{name[0]}</div>
                <span style={{ fontSize: '13px', color: '#F5E7C6' }}>{name}</span>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#FF6D1F' }}>Follow</button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
