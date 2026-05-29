'use client'
import { useState, useEffect, useRef } from 'react'

type AnalyticsData = {
  totalUsers: number; totalPosts: number; totalComments: number; totalLikes: number
  totalBookmarks: number; totalFollows: number; openTickets: number; totalSpaces: number
  totalTutorials: number; totalNews: number; engagementRate: number
  newUsersWeek: number; newPostsWeek: number; newCommentsWeek: number; newLikesWeek: number
  newUsersToday: number; newPostsToday: number; newCommentsToday: number; newLikesToday: number
  newFollowsToday: number; newUsersYesterday: number; newPostsYesterday: number
  userCumulative: { date: string; count: number }[]
  postDailyBuckets: { date: string; count: number }[]
  postTypes: { image: number; video: number; text: number }
  topTools: [string, number][]; topTags: [string, number][]
  topCountries: { name: string; code: string; count: number }[]
  heatmap: number[][]; topCreators: any[]; topPosts: any[]; topSpaces: any[]
  // Revenue
  revenue: { total: number; donation: number; subscription: number; ad: number; thisMonth: number; thisWeek: number; today: number; transactionCount: number }
  revenueDailyBuckets: { date: string; amount: number }[]
  recentPayments: any[]
  adCampaigns: any[]
  adStats: { activeAds: number; pendingAds: number; totalImpressions: number; totalClicks: number }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p']

// World country code → approximate map position (x%, y% on equirectangular 2:1 map)
const COUNTRY_POSITIONS: Record<string, [number, number]> = {
  US: [20, 35], CA: [18, 25], MX: [20, 44], BR: [32, 62], AR: [28, 75],
  GB: [46, 25], FR: [48, 28], DE: [50, 25], IT: [51, 33], ES: [45, 33],
  IN: [68, 43], CN: [75, 35], JP: [82, 33], KR: [80, 33], AU: [79, 68],
  RU: [65, 20], NG: [51, 52], ZA: [54, 70], EG: [56, 40], KE: [58, 55],
  SA: [60, 43], AE: [63, 44], TR: [57, 34], PK: [66, 40], ID: [78, 55],
  TH: [74, 47], VN: [76, 48], PH: [80, 48], NZ: [85, 72], SG: [76, 53],
  MY: [76, 51], BD: [70, 43], PL: [52, 25], SE: [51, 18], NL: [48, 24],
  BE: [48, 25], CH: [49, 29], PT: [44, 35], GR: [53, 35], CZ: [51, 27],
  CO: [27, 55], CL: [25, 70], PE: [25, 60], VE: [29, 52],
}

function delta(today: number, yesterday: number) {
  const d = today - yesterday
  if (d === 0) return <span style={{ color: '#9a8f7a', fontSize: '11px' }}>→ same</span>
  return <span style={{ color: d > 0 ? '#4ade80' : '#ff8080', fontSize: '11px' }}>{d > 0 ? '↑' : '↓'} {Math.abs(d)} vs yesterday</span>
}

function weekDelta(val: number, label: string) {
  if (!val) return <span style={{ color: '#9a8f7a', fontSize: '11px' }}>—</span>
  return <span style={{ color: '#4ade80', fontSize: '11px' }}>+{val.toLocaleString()} {label}</span>
}

function Bar({ value, max, color = 'var(--color-primary)' }: { value: number; max: number; color?: string }) {
  return (
    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${max ? Math.round((value / max) * 100) : 0}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState<'users' | 'posts'>('users')
  const [primaryRgb, setPrimaryRgb] = useState('255,109,31') // fallback orange
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(d => {
      setData(d); setLoading(false)
    })
    // Read current brand primary color from CSS var for dynamic rgba usage
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#FF6D1F'
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    if (!isNaN(r)) setPrimaryRgb(`${r},${g},${b}`)
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!data) return <div style={{ color: '#9a8f7a', padding: '40px', textAlign: 'center' }}>Failed to load analytics</div>

  const card = { background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px' }

  // Mini line chart
  const chartData = chartMode === 'users' ? data.userCumulative : data.postDailyBuckets
  const maxVal = Math.max(...chartData.map(d => d.count), 1)
  const W = 480, H = 120
  const pts = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * W
    const y = H - (d.count / maxVal) * (H - 16) - 4
    return `${x},${y}`
  }).join(' ')
  const fillPts = `0,${H} ${pts} ${W},${H}`

  // Heatmap max
  const hmMax = Math.max(...data.heatmap.flat(), 1)

  // Country totals for width bar
  const maxCountry = data.topCountries[0]?.count || 1

  return (
    <div style={{ animation: 'slideIn 0.2s ease' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>Analytics</h1>
        <span style={{ fontSize: '12px', color: '#9a8f7a' }}>Live data from Supabase</span>
      </div>

      {/* ── KPI GRID ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total users',      value: data.totalUsers,      sub: delta(data.newUsersToday, data.newUsersYesterday),     accent: 'var(--color-primary)' },
          { label: 'Total posts',      value: data.totalPosts,      sub: delta(data.newPostsToday, data.newPostsYesterday),     accent: '#a78bfa' },
          { label: 'Total likes',      value: data.totalLikes,      sub: weekDelta(data.newLikesWeek, 'this week'),             accent: '#f472b6' },
          { label: 'Total comments',   value: data.totalComments,   sub: weekDelta(data.newCommentsWeek, 'this week'),         accent: '#34d399' },
          { label: 'Avg likes / post', value: data.engagementRate,  sub: <span style={{ fontSize: '11px', color: '#9a8f7a' }}>all time avg</span>, accent: '#facc15' },
          { label: 'Bookmarks',        value: data.totalBookmarks,  sub: <span style={{ fontSize: '11px', color: '#9a8f7a' }}>saved posts</span>,  accent: 'var(--color-primary)' },
          { label: 'Follows',          value: data.totalFollows,    sub: weekDelta(data.newFollowsToday, 'today'),              accent: '#60a5fa' },
          { label: 'Open tickets',     value: data.openTickets,     sub: <span style={{ fontSize: '11px', color: data.openTickets > 5 ? '#ff8080' : '#4ade80' }}>{data.openTickets > 5 ? 'needs attention' : 'looking good'}</span>, accent: '#facc15' },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ ...card, padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: accent, marginBottom: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-cream)', marginBottom: '3px' }}>{label}</div>
            <div>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── GROWTH CHART ─────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>30-day trend</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['users', 'posts'] as const).map(m => (
              <button key={m} onClick={() => setChartMode(m)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: chartMode === m ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent', borderColor: chartMode === m ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: chartMode === m ? 'var(--color-primary)' : '#9a8f7a' }}>
                {m === 'users' ? 'Users' : 'Posts'}
              </button>
            ))}
          </div>
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', height: '140px' }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={fillPts} fill="url(#lineGrad)" />
          <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
          {/* Labels: first, mid, last */}
          {[0, Math.floor(chartData.length / 2), chartData.length - 1].map(i => (
            <text key={i} x={(i / (chartData.length - 1)) * W} y={H + 18} textAnchor="middle" fontSize="10" fill="#9a8f7a">
              {chartData[i]?.date?.slice(5)}
            </text>
          ))}
          {/* Y axis labels */}
          <text x="4" y="14" fontSize="10" fill="#9a8f7a">{maxVal.toLocaleString()}</text>
          <text x="4" y={H - 2} fontSize="10" fill="#9a8f7a">0</text>
        </svg>
      </div>

      {/* ── CONTENT + TOOLS ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        {/* Post types donut */}
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Post types</h3>
          {(() => {
            const total = (data.postTypes.image || 0) + (data.postTypes.video || 0) + (data.postTypes.text || 0) || 1
            const types = [
              { label: 'Images', value: data.postTypes.image || 0, color: 'var(--color-primary)' },
              { label: 'Prompts / Text', value: data.postTypes.text || 0, color: '#a78bfa' },
              { label: 'Videos', value: data.postTypes.video || 0, color: '#34d399' },
            ]
            return types.map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-beige)' }}>{label}</span>
                  <span style={{ color: '#9a8f7a' }}>{value.toLocaleString()} · {Math.round(value / total * 100)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round(value / total * 100)}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))
          })()}
        </div>

        {/* Top AI tools */}
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Top AI tools</h3>
          {data.topTools.length === 0 && <p style={{ color: '#9a8f7a', fontSize: '13px' }}>No tool data yet</p>}
          {data.topTools.slice(0, 6).map(([tool, count], i) => {
            const max = data.topTools[0]?.[1] || 1
            const colors = ['var(--color-primary)','#FF8540','#a78bfa','#34d399','#60a5fa','#facc15']
            return (
              <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#9a8f7a', width: '14px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-cream)', width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool}</span>
                <Bar value={count} max={max} color={colors[i]} />
                <span style={{ fontSize: '11px', color: '#9a8f7a', width: '36px', textAlign: 'right', flexShrink: 0 }}>{count.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HEATMAP ──────────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>
          Posting activity heatmap
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#9a8f7a', marginLeft: '8px' }}>last 30 days · hour × day</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '560px' }}>
            {/* Hour labels */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px', paddingLeft: '32px' }}>
              {HOURS.map((h, i) => (
                <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: i % 3 === 0 ? '#9a8f7a' : 'transparent', minWidth: '18px' }}>{h}</div>
              ))}
            </div>
            {data.heatmap.map((row, di) => (
              <div key={di} style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ width: '28px', fontSize: '10px', color: '#9a8f7a', textAlign: 'right', paddingRight: '6px', flexShrink: 0 }}>{DAYS[di]}</div>
                {row.map((v, hi) => {
                  const intensity = hmMax > 0 ? v / hmMax : 0
                  const bg = intensity === 0
                    ? 'rgba(255,255,255,0.04)'
                    : ``rgba(${primaryRgb},${(intensity * 0.85 + 0.1).toFixed(2)})`
                  return (
                    <div key={hi} title={`${DAYS[di]} ${HOURS[hi]}: ${v} posts`}
                      style={{ flex: 1, height: '18px', borderRadius: '3px', background: bg, minWidth: '18px', cursor: 'default', transition: 'opacity 0.15s' }} />
                  )
                })}
              </div>
            ))}
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingLeft: '32px' }}>
              <span style={{ fontSize: '10px', color: '#9a8f7a' }}>Less</span>
              {[0.05, 0.2, 0.4, 0.65, 0.9].map(op => (
                <div key={op} style={{ width: '14px', height: '14px', borderRadius: '3px', background: ``rgba(${primaryRgb},${op})` }} />
              ))}
              <span style={{ fontSize: '10px', color: '#9a8f7a' }}>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── WORLD MAP ────────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>
            🌍 Users worldwide
            <span style={{ fontSize: '11px', fontWeight: 400, color: '#9a8f7a', marginLeft: '8px' }}>{data.topCountries.length} countries</span>
          </h3>
          {data.topCountries.length === 0 && (
            <span style={{ fontSize: '12px', color: '#9a8f7a', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
              ⚠️ No country data yet — see setup tip below
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* SVG world map with dots */}
          <div>
            <svg viewBox="0 0 500 250" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Simple world outline approximation */}
              <rect x="0" y="0" width="500" height="250" fill="rgba(255,255,255,0.02)" rx="8" />
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(f => (
                <g key={f}>
                  <line x1={f * 500} y1="0" x2={f * 500} y2="250" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  <line x1="0" y1={f * 250} x2="500" y2={f * 250} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                </g>
              ))}
              {/* Equator */}
              <line x1="0" y1="125" x2="500" y2="125" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" strokeDasharray="4,4" />
              {/* Country dots */}
              {data.topCountries.map((c, i) => {
                const pos = COUNTRY_POSITIONS[c.code]
                if (!pos) return null
                const cx = (pos[0] / 100) * 500
                const cy = (pos[1] / 100) * 250
                const r = Math.max(4, Math.min(14, 4 + (c.count / maxCountry) * 10))
                const opacity = 0.4 + (c.count / maxCountry) * 0.6
                return (
                  <g key={c.code}>
                    <circle cx={cx} cy={cy} r={r + 3} fill={``rgba(${primaryRgb},${(opacity * 0.3).toFixed(2)})`} />
                    <circle cx={cx} cy={cy} r={r} fill={``rgba(${primaryRgb},${opacity.toFixed(2)})`} />
                    {i < 3 && (
                      <text x={cx + r + 3} y={cy + 4} fontSize="9" fill="var(--color-cream)" fontWeight="500">{c.code}</text>
                    )}
                  </g>
                )
              })}
              {/* Fallback if no data */}
              {data.topCountries.length === 0 && (
                <text x="250" y="130" textAnchor="middle" fontSize="12" fill="#555">No location data yet</text>
              )}
            </svg>
          </div>

          {/* Country leaderboard */}
          <div>
            {data.topCountries.length === 0 ? (
              <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)', borderRadius: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 6px' }}>How to collect country data</p>
                <ol style={{ fontSize: '11px', color: '#9a8f7a', margin: 0, paddingLeft: '16px', lineHeight: 1.8 }}>
                  <li>Add a Country field to your signup form in Settings</li>
                  <li>Or use Supabase Edge Function to detect from IP on sign-up</li>
                  <li>Store as <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: '3px' }}>country_code</code> (ISO 2-letter, e.g. "IN")</li>
                  <li>This map updates automatically once data exists</li>
                </ol>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.topCountries.slice(0, 8).map((c, i) => (
                  <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9a8f7a', width: '16px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', width: '20px', flexShrink: 0 }}>{getFlagEmoji(c.code)}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-cream)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <Bar value={c.count} max={maxCountry} color="var(--color-primary)" />
                    <span style={{ fontSize: '11px', color: '#9a8f7a', width: '32px', textAlign: 'right', flexShrink: 0 }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TOP CREATORS ─────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Top creators</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['#','Creator','Posts','Followers','Verified'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: h === '#' || h === 'Posts' || h === 'Followers' ? 'center' : 'left', fontWeight: 600, color: '#9a8f7a', fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.topCreators.slice(0, 8).map((c, i) => (
              <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: '#9a8f7a' }}>{i + 1}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {c.avatar_url
                      ? <img src={c.avatar_url} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{c.full_name?.[0]}</div>
                    }
                    <div>
                      <div style={{ color: 'var(--color-cream)', fontWeight: 600 }}>{c.full_name}</div>
                      <div style={{ color: '#9a8f7a', fontSize: '11px' }}>@{c.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-cream)' }}>{(c.posts_count || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-cream)' }}>{(c.followers_count || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  {c.is_official ? <span style={{ color: 'var(--color-primary)', fontSize: '13px' }}>●</span> : c.is_verified ? <span style={{ color: 'var(--color-primary)', fontSize: '13px' }}>✓</span> : <span style={{ color: '#333' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── TOP POSTS + TOP TAGS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        {/* Top posts */}
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Most liked posts</h3>
          {data.topPosts.length === 0 && <p style={{ color: '#9a8f7a', fontSize: '12px' }}>No posts yet</p>}
          {data.topPosts.map((p, i) => {
            const user = Array.isArray(p.user) ? p.user[0] : p.user
            return (
              <div key={p.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: i < data.topPosts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: '11px', color: '#9a8f7a', width: '14px', flexShrink: 0 }}>{i + 1}</span>
                {p.image_url && <img src={p.image_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || p.prompt_text || 'No caption'}</div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a' }}>@{user?.username} · ♥ {(p.likes_count || 0).toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top tags */}
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Trending tags</h3>
          {data.topTags.length === 0 && <p style={{ color: '#9a8f7a', fontSize: '12px' }}>No tag data yet</p>}
          {data.topTags.map(([tag, count], i) => {
            const max = data.topTags[0]?.[1] || 1
            return (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#9a8f7a', width: '14px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', width: '100px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>#{tag}</span>
                <Bar value={count} max={max} />
                <span style={{ fontSize: '11px', color: '#9a8f7a', width: '32px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── REVENUE OVERVIEW ─────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>💰 Revenue</h3>
          <span style={{ fontSize: '12px', color: '#9a8f7a' }}>{data.revenue.transactionCount} paid transactions</span>
        </div>

        {data.revenue.total === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9a8f7a', fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>💳</div>
            No payments yet. Set up Razorpay in Admin → Payments to start collecting.
          </div>
        ) : (
          <>
            {/* Revenue KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total revenue',   value: data.revenue.total,        color: '#4ade80' },
                { label: 'This month',      value: data.revenue.thisMonth,     color: 'var(--color-primary)' },
                { label: 'This week',       value: data.revenue.thisWeek,      color: '#a78bfa' },
                { label: 'Today',           value: data.revenue.today,         color: '#60a5fa' },
                { label: 'From donations',  value: data.revenue.donation,      color: '#facc15' },
                { label: 'Subscriptions',   value: data.revenue.subscription,  color: '#f472b6' },
                { label: 'Ad revenue',      value: data.revenue.ad,            color: '#34d399' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color, marginBottom: '3px' }}>
                    ₹{(value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Revenue breakdown bars */}
            {data.revenue.total > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '8px', fontWeight: 600 }}>REVENUE BREAKDOWN</div>
                {[
                  { label: 'Donations',      value: data.revenue.donation,     color: '#facc15' },
                  { label: 'Subscriptions',  value: data.revenue.subscription, color: '#f472b6' },
                  { label: 'Ad campaigns',   value: data.revenue.ad,           color: '#34d399' },
                ].filter(r => r.value > 0).map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-cream)', width: '110px', flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((value / data.revenue.total) * 100)}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#9a8f7a', width: '80px', textAlign: 'right', flexShrink: 0 }}>
                      ₹{(value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })} · {Math.round((value / data.revenue.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 30-day revenue chart */}
            {(() => {
              const maxRev = Math.max(...data.revenueDailyBuckets.map(d => d.amount), 1)
              const W = 480, H = 80
              const pts = data.revenueDailyBuckets.map((d, i) => {
                const x = (i / (data.revenueDailyBuckets.length - 1)) * W
                const y = H - (d.amount / maxRev) * (H - 10) - 4
                return `${x},${y}`
              }).join(' ')
              const fillPts = `0,${H} ${pts} ${W},${H}`
              return (
                <div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '6px', fontWeight: 600 }}>30-DAY REVENUE TREND</div>
                  <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: '100%', height: '80px' }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={fillPts} fill="url(#revGrad)" />
                    <polyline points={pts} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" />
                    <text x="0" y={H + 14} fontSize="9" fill="#9a8f7a">{data.revenueDailyBuckets[0]?.date?.slice(5)}</text>
                    <text x={W} y={H + 14} fontSize="9" fill="#9a8f7a" textAnchor="end">{data.revenueDailyBuckets[data.revenueDailyBuckets.length - 1]?.date?.slice(5)}</text>
                  </svg>
                </div>
              )
            })()}

            {/* Recent payments table */}
            {data.recentPayments.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '8px', fontWeight: 600 }}>RECENT PAYMENTS</div>
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
                  {data.recentPayments.map((p: any, i: number) => {
                    const user = Array.isArray(p.user) ? p.user[0] : p.user
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        {user?.avatar_url
                          ? <img src={user.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>
                              {user?.full_name?.[0] || '?'}
                            </div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-cream)' }}>{user?.full_name || 'Guest'}</div>
                          <div style={{ fontSize: '11px', color: '#9a8f7a' }}>@{user?.username || '—'}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', flexShrink: 0, background: p.type === 'donation' ? 'rgba(250,204,21,0.1)' : p.type === 'subscription' ? 'rgba(244,114,182,0.1)' : 'rgba(52,211,153,0.1)', color: p.type === 'donation' ? '#facc15' : p.type === 'subscription' ? '#f472b6' : '#34d399' }}>
                          {p.type}
                        </span>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ade80' }}>₹{(p.amount / 100).toFixed(0)}</div>
                          <div style={{ fontSize: '10px', color: '#9a8f7a' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── AD CAMPAIGNS ─────────────────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>📢 Ad Campaigns</h3>
          <a href="/acfjagjeetadmin/dashboard?tab=ads" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Manage ads →</a>
        </div>

        {/* Ad stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Active campaigns', value: data.adStats.activeAds,       color: '#4ade80' },
            { label: 'Pending review',   value: data.adStats.pendingAds,       color: '#facc15' },
            { label: 'Total impressions',value: data.adStats.totalImpressions, color: '#60a5fa' },
            { label: 'Total clicks',     value: data.adStats.totalClicks,      color: 'var(--color-primary)' },
            { label: 'Avg CTR',          value: data.adStats.totalImpressions > 0 ? parseFloat(((data.adStats.totalClicks / data.adStats.totalImpressions) * 100).toFixed(1)) : 0, color: '#a78bfa', suffix: '%' },
          ].map(({ label, value, color, suffix }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color, marginBottom: '3px' }}>{value.toLocaleString()}{suffix || ''}</div>
              <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Campaigns table */}
        {data.adCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9a8f7a', fontSize: '13px' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📢</div>
            No ad campaigns yet
          </div>
        ) : (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
            {data.adCampaigns.slice(0, 8).map((ad: any, i: number) => {
              const user = Array.isArray(ad.user) ? ad.user[0] : ad.user
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0'
              return (
                <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', flexWrap: 'wrap' }}>
                  {/* Status dot */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: ad.status === 'active' ? '#4ade80' : ad.status === 'pending' ? '#facc15' : '#555' }} />

                  {/* Ad title + advertiser */}
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</div>
                    <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{user?.full_name || 'Unknown'} · {ad.slot}</div>
                  </div>

                  {/* Impressions / Clicks / CTR */}
                  <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>{(ad.impressions || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#9a8f7a' }}>views</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>{(ad.clicks || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#9a8f7a' }}>clicks</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa' }}>{ctr}%</div>
                      <div style={{ fontSize: '10px', color: '#9a8f7a' }}>CTR</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>₹{((ad.budget_paise || 0) / 100).toFixed(0)}</div>
                      <div style={{ fontSize: '10px', color: '#9a8f7a' }}>budget</div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div style={{ fontSize: '10px', color: '#555', flexShrink: 0, textAlign: 'right' }}>
                    {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── COMMUNITY HEALTH ─────────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>Community health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Spaces', value: data.totalSpaces, icon: '👥' },
            { label: 'Tutorials', value: data.totalTutorials, icon: '🎬' },
            { label: 'News articles', value: data.totalNews, icon: '📰' },
            { label: 'Total follows', value: data.totalFollows, icon: '🔔' },
            { label: 'Saved posts', value: data.totalBookmarks, icon: '🔖' },
            { label: 'Open tickets', value: data.openTickets, icon: '🎫' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-cream)' }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getFlagEmoji(code: string) {
  if (!code || code.length !== 2) return '🌐'
  const chars = Array.from(code.toUpperCase()).map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  return String.fromCodePoint(chars[0], chars[1])
}
