import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import TrendingGrid from '@/components/home/TrendingGrid'

const features = [
  { emoji: '🎨', title: 'Share AI prompts',   desc: 'Post your image & video prompts with previews. Copy prompts in one click.' },
  { emoji: '📰', title: 'AI news daily',       desc: 'Curated updates from the world of AI — models, tools, research, all in one place.' },
  { emoji: '🎬', title: 'Weekly tutorials',    desc: 'New tutorials every Monday covering Midjourney, Sora, Runway, and more.' },
  { emoji: '👥', title: 'Follow creators',     desc: 'Build your feed around the creators whose work inspires you.' },
]

async function getLiveStats() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const [{ count: users }, { count: posts }, { count: tutorials }, { count: news }] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('posts').select('*', { count: 'exact', head: true }),
      db.from('tutorials').select('*', { count: 'exact', head: true }),
      db.from('news_items').select('*', { count: 'exact', head: true }),
    ])
    return { users: users || 0, posts: posts || 0, tutorials: tutorials || 0, news: news || 0 }
  } catch { return { users: 0, posts: 0, tutorials: 0, news: 0 } }
}

async function getTrendingPosts() {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await db
      .from('posts')
      .select('id, caption, prompt_text, media_type, image_url, ai_tool, likes_count, user:profiles!posts_user_id_fkey(username, full_name, avatar_url)')
      .not('image_url', 'is', null)
      .order('likes_count', { ascending: false })
      .limit(6)
    return data || []
  } catch { return [] }
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n || '—')
}

export default async function HomePage() {
  const [stats, trendingPosts] = await Promise.all([getLiveStats(), getTrendingPosts()])

  const statCards = [
    { num: formatNum(stats.users),     label: 'Members' },
    { num: formatNum(stats.posts),     label: 'Posts & prompts' },
    { num: formatNum(stats.news),      label: 'AI news articles' },
    { num: String(stats.tutorials || '—'), label: 'Tutorials' },
  ]

  return (
    <div style={{ padding: '60px 0 80px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Hero section */}
      <div style={{ textAlign: 'center', marginBottom: '72px', padding: '0 16px' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.25)',
          color: '#FF6D1F', fontSize: '13px', padding: '6px 16px',
          borderRadius: '999px', marginBottom: '28px',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF6D1F', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          Community for AI creators
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(36px, 8vw, 68px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: '20px', color: '#FAF3E1' }}>
          Where AI Creators<br />
          <span style={{ color: '#FF6D1F' }}>Connect</span>
        </h1>
        <p style={{ fontSize: '17px', color: '#F5E7C6', maxWidth: '480px', margin: '0 auto 12px', lineHeight: 1.7 }}>
          Share prompts. Follow creators. Get the latest AI news and level up with weekly tutorials.
        </p>
        <p style={{ fontSize: '13px', color: '#9a8f7a', marginBottom: '40px', letterSpacing: '0.04em' }}>
          Feed Your AI Obsession.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
          <Link href="/auth/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#FF6D1F', color: '#fff', fontWeight: 700,
            padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px',
            boxShadow: '0 4px 20px rgba(255,109,31,0.35)',
          }}>
            Join free →
          </Link>
          <Link href="/explore" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#F5E7C6', fontWeight: 500,
            padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px',
          }}>
            Browse prompts
          </Link>
        </div>

        {/* Live stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px', maxWidth: '680px', margin: '0 auto',
        }}>
          {statCards.map(({ num, label }) => (
            <div key={label} style={{
              background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '18px 12px',
            }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#FF6D1F', marginBottom: '3px', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
              <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending posts preview */}
      {trendingPosts.length > 0 && (
        <div style={{ marginBottom: '72px', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FAF3E1', margin: 0 }}>🔥 Trending now</h2>
              <p style={{ fontSize: '13px', color: '#9a8f7a', marginTop: '3px' }}>Most liked posts from the community</p>
            </div>
            <Link href="/explore" style={{ fontSize: '13px', color: '#FF6D1F', textDecoration: 'none', fontWeight: 600 }}>
              See all →
            </Link>
          </div>

          <TrendingGrid posts={trendingPosts} />
        </div>
      )}

      {/* Features grid */}
      <div style={{ padding: '0 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FAF3E1', marginBottom: '20px', textAlign: 'center' }}>Everything an AI creator needs</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}>
          {features.map(({ emoji, title, desc }) => (
            <div key={title} style={{
              background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '22px',
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(255,109,31,0.1)', border: '1px solid rgba(255,109,31,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '16px',
              }}>
                {emoji}
              </div>
              <h3 style={{ fontWeight: 700, color: '#FAF3E1', marginBottom: '8px', fontSize: '15px' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '40px 20px', background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.12)', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FAF3E1', marginBottom: '10px' }}>Ready to join the community?</h3>
          <p style={{ fontSize: '14px', color: '#9a8f7a', marginBottom: '24px' }}>Free to join. No credit card needed.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{ background: '#FF6D1F', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
              Create free account →
            </Link>
            <Link href="/feed" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6', fontWeight: 500, padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
              Browse the feed
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
