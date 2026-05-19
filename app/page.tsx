import Link from 'next/link'

const features = [
  { emoji: '🎨', title: 'Share AI prompts',   desc: 'Post your image & video prompts with previews. Copy prompts in one click.' },
  { emoji: '📰', title: 'AI news daily',       desc: 'Curated updates from the world of AI — models, tools, research, all in one place.' },
  { emoji: '🎬', title: 'Weekly tutorials',    desc: 'New tutorials every Monday covering Midjourney, Sora, Runway, and more.' },
  { emoji: '👥', title: 'Follow creators',     desc: 'Build your feed around the creators whose work inspires you.' },
]

const stats = [
  { num: '12.4K', label: 'Members' },
  { num: '38K',   label: 'Prompts shared' },
  { num: '240+',  label: 'AI news weekly' },
  { num: '52',    label: 'Tutorials' },
]

export default function HomePage() {
  return (
    <div style={{ padding: '60px 16px', textAlign: 'center', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.25)',
        color: '#FF6D1F', fontSize: '13px', padding: '6px 16px',
        borderRadius: '999px', marginBottom: '32px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6D1F', display: 'inline-block' }} />
        Now in beta · Join 12,400+ AI creators
      </div>

      {/* Hero */}
      <h1 style={{ fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '20px', color: '#FAF3E1' }}>
        Where AI Creators<br />
        <span style={{ color: '#FF6D1F' }}>Connect</span>
      </h1>
      <p style={{ fontSize: '17px', color: '#F5E7C6', maxWidth: '520px', margin: '0 auto 12px', lineHeight: 1.7 }}>
        Share prompts. Follow creators. Get the latest AI news and level up with weekly tutorials.
      </p>
      <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '40px', letterSpacing: '0.05em' }}>
        Feed Your AI Obsession.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
        <Link href="/auth/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#FF6D1F', color: '#fff', fontWeight: 700,
          padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px',
        }}>
          Join free →
        </Link>
        <Link href="/feed" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.2)',
          color: '#F5E7C6', fontWeight: 500,
          padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px',
        }}>
          Browse prompts
        </Link>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', maxWidth: '700px', margin: '0 auto 64px',
      }}>
        {stats.map(({ num, label }) => (
          <div key={label} style={{
            background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '20px 16px',
          }}>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#FF6D1F', marginBottom: '4px' }}>{num}</div>
            <div style={{ fontSize: '13px', color: '#9a8f7a' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', textAlign: 'left',
      }}>
        {features.map(({ emoji, title, desc }) => (
          <div key={title} style={{
            background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '20px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', marginBottom: '16px',
            }}>
              {emoji}
            </div>
            <h3 style={{ fontWeight: 700, color: '#FAF3E1', marginBottom: '8px', fontSize: '15px' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
