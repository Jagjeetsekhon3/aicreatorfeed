import Link from 'next/link'
import { Image, Newspaper, BookOpen, Users, ArrowRight } from 'lucide-react'

const features = [
  { icon: Image,     title: 'Share AI prompts',   desc: 'Post your image & video prompts with previews. Copy prompts in one click.' },
  { icon: Newspaper, title: 'AI news daily',       desc: 'Curated updates from the world of AI — models, tools, research, all in one place.' },
  { icon: BookOpen,  title: 'Weekly tutorials',    desc: 'New tutorials every Monday covering Midjourney, Sora, Runway, and more.' },
  { icon: Users,     title: 'Follow creators',     desc: 'Build your feed around the creators whose work inspires you.' },
]

export default function HomePage() {
  return (
    <div className="py-16 text-center">

      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-8 border"
        style={{
          background: 'rgba(255,109,31,0.08)',
          borderColor: 'rgba(255,109,31,0.25)',
          color: '#FF6D1F',
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF6D1F' }} />
        Now in beta · Join 12,400+ AI creators
      </div>

      {/* Hero */}
      <h1
        className="text-5xl md:text-6xl font-black tracking-tight mb-5 leading-none"
        style={{ color: '#FAF3E1' }}
      >
        Where AI Creators<br />
        <span style={{ color: '#FF6D1F' }}>Connect</span>
      </h1>
      <p className="text-lg max-w-xl mx-auto mb-4 leading-relaxed" style={{ color: '#F5E7C6' }}>
        Share prompts. Follow creators. Get the latest AI news and level up with weekly tutorials.
      </p>
      <p className="text-sm mb-10 font-medium tracking-wide" style={{ color: '#9a8f7a' }}>
        Feed Your AI Obsession.
      </p>

      {/* CTAs */}
      <div className="flex gap-3 justify-center mb-20 flex-wrap">
        <Link
          href="/auth/signup"
          className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl transition-all text-sm"
          style={{ background: '#FF6D1F' }}
        >
          Join free <ArrowRight size={15} />
        </Link>
        <Link
          href="/feed"
          className="flex items-center gap-2 font-medium px-7 py-3.5 rounded-xl transition-all text-sm border"
          style={{
            background: 'rgba(255,109,31,0.08)',
            borderColor: 'rgba(255,109,31,0.2)',
            color: '#F5E7C6',
          }}
        >
          Browse prompts
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-20">
        {[
          { num: '12.4K', label: 'Members' },
          { num: '38K',   label: 'Prompts shared' },
          { num: '240+',  label: 'AI news weekly' },
          { num: '52',    label: 'Tutorials' },
        ].map(({ num, label }) => (
          <div
            key={label}
            className="rounded-2xl p-5 border"
            style={{ background: '#2f2f2f', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="text-3xl font-black mb-1"
              style={{ color: '#FF6D1F' }}
            >{num}</div>
            <div className="text-sm" style={{ color: '#9a8f7a' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl p-5 border hover:border-opacity-50 transition-all"
            style={{ background: '#2f2f2f', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
              style={{
                background: 'rgba(255,109,31,0.1)',
                borderColor: 'rgba(255,109,31,0.2)',
              }}
            >
              <Icon size={18} style={{ color: '#FF6D1F' }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: '#FAF3E1' }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#9a8f7a' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
