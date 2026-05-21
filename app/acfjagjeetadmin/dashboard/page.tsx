'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────
type Stats = { totalUsers: number; totalPosts: number; totalComments: number; totalTickets: number; newUsersThisWeek: number; newPostsThisWeek: number }
type Setting = { key: string; value: string }
type Flag = { id: string; name: string; enabled: boolean; description: string }
type User = { id: string; username: string; full_name: string; avatar_url: string | null; bio: string | null; followers_count: number; posts_count: number; created_at: string; is_verified: boolean; is_official: boolean }
type Post = { id: string; caption: string; media_type: string; likes_count: number; comments_count: number; created_at: string; user: { username: string; full_name: string } }
type Ticket = { id: string; user_email: string; subject: string; message: string; status: string; priority: string; admin_reply: string | null; created_at: string; user: { username: string } | null }

// ── Styles ─────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }
const inp: React.CSSProperties = { background: '#222', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#FAF3E1', outline: 'none', fontFamily: 'inherit', width: '100%' }
const btn = (active = true): React.CSSProperties => ({ background: active ? '#FF6D1F' : '#2a2a2a', color: active ? '#fff' : '#9a8f7a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' })

const SIDEBAR_ITEMS = [
  { key: 'overview',   icon: '📊', label: 'Overview' },
  { key: 'users',      icon: '👥', label: 'Users' },
  { key: 'posts',      icon: '📝', label: 'Posts' },
  { key: 'news',       icon: '📰', label: 'AI News' },
  { key: 'community',  icon: '💬', label: 'Community' },
  { key: 'settings',   icon: '🎨', label: 'Site Settings' },
  { key: 'features',   icon: '🔧', label: 'Features' },
  { key: 'tickets',    icon: '🎫', label: 'Support Tickets' },
  { key: 'logs',       icon: '📋', label: 'Activity Log' },
]

const STATUS_COLORS: Record<string, string> = { open: '#FF6D1F', in_progress: '#facc15', resolved: '#4ade80', closed: '#9a8f7a' }
const PRIORITY_COLORS: Record<string, string> = { low: '#9a8f7a', normal: '#FAF3E1', high: '#facc15', urgent: '#ff8080' }

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [settings, setSettings] = useState<Setting[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [newsItems, setNewsItems] = useState<any[]>([])
  const [showNewsForm, setShowNewsForm] = useState(false)
  const [newsForm, setNewsForm] = useState({ title: '', summary: '', source_name: '', source_url: '', image_url: '', tags: '' })
  const [newsLoading, setNewsLoading] = useState(false)

  // Community state
  const [spaces, setSpaces] = useState<any[]>([])
  const [spacePosts, setSpacePosts] = useState<any[]>([])
  const [selectedSpace, setSelectedSpace] = useState<any>(null)
  const [communityTab, setCommunityTab] = useState<'spaces' | 'posts'>('spaces')
  const [editingSpace, setEditingSpace] = useState<any>(null)
  const [spaceEditForm, setSpaceEditForm] = useState({ display_name: '', description: '', icon: '', cover_color: '', rules: '', is_official: false })
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [ticketFilter, setTicketFilter] = useState('open')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function api(type: string, params = '') {
    const res = await fetch(`/api/admin/data?type=${type}${params}`)
    if (res.status === 401) { router.push('/acfjagjeetadmin'); return null }
    return res.json()
  }

  async function action(act: string, body: object) {
    const res = await fetch(`/api/admin/data?action=${act}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.status === 401) { router.push('/acfjagjeetadmin'); return null }
    return res.json()
  }

  useEffect(() => {
    api('stats').then(d => { if (d) setStats(d); setLoading(false) })
  }, [])

  useEffect(() => {
    if (tab === 'settings') api('settings').then(d => { if (d) { setSettings(d.settings); setFlags(d.flags) } })
    if (tab === 'users') api('users').then(d => { if (d) setUsers(d.users) })
    if (tab === 'posts') api('posts').then(d => { if (d) setPosts(d.posts) })
    if (tab === 'news') api('news_admin').then(d => { if (d) setNewsItems(d.news) })
    if (tab === 'community') api('spaces_admin').then(d => { if (d) setSpaces(d.spaces) })
    if (tab === 'tickets') api('tickets', `&status=${ticketFilter}`).then(d => { if (d) setTickets(d.tickets) })
  }, [tab, ticketFilter])

  async function searchUsers() {
    const d = await api('users', `&search=${userSearch}`)
    if (d) setUsers(d.users)
  }

  async function publishNews() {
    if (!newsForm.title || !newsForm.summary || !newsForm.source_name || !newsForm.source_url) { showToast('Fill all required fields'); return }
    setNewsLoading(true)
    await action('publish_news', { ...newsForm, tags: newsForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) })
    setNewsForm({ title: '', summary: '', source_name: '', source_url: '', image_url: '', tags: '' })
    setShowNewsForm(false)
    const d = await api('news_admin')
    if (d) setNewsItems(d.news)
    showToast('News published!')
    setNewsLoading(false)
  }

  async function deleteNews(id: string) {
    if (!confirm('Delete this news item?')) return
    await action('delete_news', { news_id: id })
    setNewsItems(prev => prev.filter(n => n.id !== id))
    showToast('Deleted')
  }

  async function loadSpacePosts(spaceId: string) {
    const d = await api('space_posts_admin', `&space_id=${spaceId}`)
    if (d) setSpacePosts(d.posts)
  }

  async function handleSelectSpace(space: any) {
    setSelectedSpace(space)
    setCommunityTab('posts')
    loadSpacePosts(space.id)
  }

  async function handleEditSpace(space: any) {
    setEditingSpace(space)
    setSpaceEditForm({ display_name: space.display_name, description: space.description || '', icon: space.icon, cover_color: space.cover_color, rules: space.rules || '', is_official: space.is_official })
  }

  async function saveSpaceEdit() {
    setSaving(true)
    await action('edit_space', { space_id: editingSpace.id, ...spaceEditForm })
    setSpaces(prev => prev.map(s => s.id === editingSpace.id ? { ...s, ...spaceEditForm } : s))
    if (selectedSpace?.id === editingSpace.id) setSelectedSpace((s: any) => ({ ...s, ...spaceEditForm }))
    setEditingSpace(null)
    showToast('Space updated!')
    setSaving(false)
  }

  async function deleteSpace(id: string, name: string) {
    if (!confirm(`Delete space "${name}" and all its posts? This cannot be undone.`)) return
    await action('delete_space', { space_id: id })
    setSpaces(prev => prev.filter(s => s.id !== id))
    if (selectedSpace?.id === id) { setSelectedSpace(null); setCommunityTab('spaces') }
    showToast('Space deleted')
  }

  async function deleteSpacePost(id: string) {
    if (!confirm('Delete this post?')) return
    await action('delete_space_post', { post_id: id })
    setSpacePosts(prev => prev.filter(p => p.id !== id))
    setSpaces(prev => prev.map(s => s.id === selectedSpace?.id ? { ...s, post_count: Math.max(0, s.post_count - 1) } : s))
    showToast('Post deleted')
  }

  async function pinSpacePost(id: string, pinned: boolean) {
    await action('pin_space_post', { post_id: id, is_pinned: !pinned })
    setSpacePosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned: !pinned } : p))
    showToast(!pinned ? '📌 Post pinned' : 'Post unpinned')
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true)
    await action('update_setting', { key, value })
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    showToast('Setting saved!')
    setSaving(false)
  }

  async function toggleFlag(name: string, enabled: boolean) {
    await action('toggle_flag', { name, enabled })
    setFlags(prev => prev.map(f => f.name === name ? { ...f, enabled } : f))
    showToast(`${name} ${enabled ? 'enabled' : 'disabled'}`)
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await action('delete_post', { post_id: id })
    setPosts(prev => prev.filter(p => p.id !== id))
    showToast('Post deleted')
  }

  async function banUser(id: string, unban = false) {
    if (!confirm(`${unban ? 'Unban' : 'Ban'} this user?`)) return
    await action('ban_user', { user_id: id, unban })
    showToast(`User ${unban ? 'unbanned' : 'banned'}`)
  }

  async function toggleVerified(id: string, current: boolean) {
    await action('toggle_verified', { user_id: id, is_verified: !current })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: !current } : u))
    showToast(!current ? '✓ User verified' : 'Verification removed')
  }

  async function replyTicket() {
    if (!selectedTicket || !replyText.trim()) return
    setSaving(true)
    await action('reply_ticket', { ticket_id: selectedTicket.id, reply: replyText })
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved', admin_reply: replyText } : t))
    setSelectedTicket(prev => prev ? { ...prev, status: 'resolved', admin_reply: replyText } : null)
    setReplyText(''); showToast('Reply sent!'); setSaving(false)
  }

  async function updateTicketStatus(id: string, status: string) {
    await action('update_ticket_status', { ticket_id: id, status })
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selectedTicket?.id === id) setSelectedTicket(prev => prev ? { ...prev, status } : null)
    showToast('Status updated')
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/acfjagjeetadmin')
  }

  const settingVal = (key: string) => settings.find(s => s.key === key)?.value || ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,109,31,0.2)', borderTopColor: '#FF6D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#FAF3E1', display: 'flex', fontFamily: 'inherit' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}} @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} * { box-sizing: border-box } scrollbar-width: thin;`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#FF6D1F', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, zIndex: 1000, animation: 'toastIn 0.2s ease', boxShadow: '0 4px 20px rgba(255,109,31,0.4)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#141414', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#FF6D1F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🛡️</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FAF3E1' }}>Admin Panel</div>
              <div style={{ fontSize: '10px', color: '#6b6460' }}>AiCreatorFeed</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '8px', flex: 1 }}>
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: tab === item.key ? 'rgba(255,109,31,0.12)' : 'transparent',
              color: tab === item.key ? '#FF6D1F' : '#9a8f7a',
              fontSize: '13px', fontWeight: tab === item.key ? 600 : 400,
              fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
              {item.label}
              {item.key === 'tickets' && tickets.filter(t => t.status === 'open').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#FF6D1F', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px' }}>
                  {tickets.filter(t => t.status === 'open').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={signOut} style={{ ...btn(false), width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '28px', overflowY: 'auto', maxHeight: '100vh' }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>Overview</h1>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Total Users', value: stats?.totalUsers, sub: `+${stats?.newUsersThisWeek} this week`, icon: '👥', color: '#FF6D1F' },
                { label: 'Total Posts', value: stats?.totalPosts, sub: `+${stats?.newPostsThisWeek} this week`, icon: '📝', color: '#a78bfa' },
                { label: 'Comments', value: stats?.totalComments, sub: 'all time', icon: '💬', color: '#34d399' },
                { label: 'Tickets', value: stats?.totalTickets, sub: 'support requests', icon: '🎫', color: '#facc15' },
              ].map(({ label, value, sub, icon, color }) => (
                <div key={label} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color, marginBottom: '2px' }}>{value?.toLocaleString() || '0'}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ ...card, marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Quick actions</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '👥 Manage users', action: () => setTab('users') },
                  { label: '📝 Review posts', action: () => setTab('posts') },
                  { label: '🎫 Open tickets', action: () => { setTab('tickets'); setTicketFilter('open') } },
                  { label: '🎨 Site settings', action: () => setTab('settings') },
                  { label: '🔧 Features', action: () => setTab('features') },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action} style={btn()}>{label}</button>
                ))}
              </div>
            </div>

            {/* Site status */}
            <div style={{ ...card }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Site status</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Maintenance mode', key: 'maintenance_mode' },
                  { label: 'Signups allowed', key: 'allow_signups' },
                  { label: 'Posts allowed', key: 'allow_posts' },
                  { label: 'Comments allowed', key: 'allow_comments' },
                ].map(({ label, key }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: settingVal(key) === 'true' ? '#4ade80' : '#ff8080' }} />
                    <span style={{ fontSize: '13px', color: '#F5E7C6' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>Users</h1>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
                placeholder="Search by name or username..." style={{ ...inp, flex: 1 }} />
              <button onClick={searchUsers} style={btn()}>Search</button>
            </div>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['User', 'Username', 'Posts', 'Followers', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#9a8f7a', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {user.avatar_url
                            ? <img src={user.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                            : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,109,31,0.2)', color: '#FF6D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{user.full_name?.[0]}</div>
                          }
                          <span style={{ fontWeight: 600, color: '#FAF3E1' }}>{user.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a' }}>@{user.username}</td>
                      <td style={{ padding: '12px 14px', color: '#F5E7C6' }}>{user.posts_count}</td>
                      <td style={{ padding: '12px 14px', color: '#F5E7C6' }}>{user.followers_count}</td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {user.is_verified && <span style={{ fontSize: '14px' }} title="Verified">✓</span>}
                          <a href={`/profile/${user.username}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,109,31,0.3)' }}>View</a>
                          <button onClick={() => toggleVerified(user.id, user.is_verified)} style={{ fontSize: '12px', color: user.is_verified ? '#9a8f7a' : '#4ade80', background: user.is_verified ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.1)', border: `1px solid ${user.is_verified ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {user.is_verified ? 'Unverify' : 'Verify'}
                          </button>
                          <button onClick={() => banUser(user.id)} style={{ fontSize: '12px', color: '#facc15', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Ban</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#9a8f7a' }}>No users found</p>}
            </div>
          </div>
        )}

        {/* ── POSTS ────────────────────────────────────────────────────── */}
        {tab === 'posts' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>Posts</h1>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Caption', 'By', 'Type', 'Likes', 'Comments', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#9a8f7a', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                        <p style={{ margin: 0, color: '#F5E7C6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, fontSize: '12px' }}>{post.caption || '(no caption)'}</p>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>@{post.user?.username}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F', fontWeight: 600 }}>{post.media_type}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#F5E7C6' }}>{post.likes_count}</td>
                      <td style={{ padding: '12px 14px', color: '#F5E7C6' }}>{post.comments_count}</td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`/post/${post.id}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,109,31,0.3)' }}>View</a>
                          <button onClick={() => deletePost(post.id)} style={{ fontSize: '12px', color: '#ff8080', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#9a8f7a' }}>No posts found</p>}
            </div>
          </div>
        )}

        {/* ── SITE SETTINGS ────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>Site Settings</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Brand colors */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#FF6D1F' }}>🎨 Brand Colors</h3>
                {[
                  { key: 'accent_color', label: 'Accent color' },
                  { key: 'bg_color', label: 'Background color' },
                  { key: 'text_primary', label: 'Primary text color' },
                ].map(({ key, label }) => {
                  const val = settingVal(key)
                  return (
                    <div key={key} style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>{label}</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={val} onChange={e => setSettings(prev => prev.map(s => s.key === key ? { ...s, value: e.target.value } : s))}
                          style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent', padding: 0 }} />
                        <input type="text" value={val} onChange={e => setSettings(prev => prev.map(s => s.key === key ? { ...s, value: e.target.value } : s))}
                          style={{ ...inp, flex: 1 }} />
                        <button onClick={() => saveSetting(key, val)} style={btn()} disabled={saving}>Save</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Site identity */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#FF6D1F' }}>✦ Site Identity</h3>
                {[
                  { key: 'site_name', label: 'Site name' },
                  { key: 'tagline', label: 'Tagline' },
                ].map(({ key, label }) => {
                  const val = settingVal(key)
                  return (
                    <div key={key} style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>{label}</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" value={val} onChange={e => setSettings(prev => prev.map(s => s.key === key ? { ...s, value: e.target.value } : s))}
                          style={{ ...inp, flex: 1 }} />
                        <button onClick={() => saveSetting(key, val)} style={btn()} disabled={saving}>Save</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Site controls */}
              <div style={{ ...card, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#FF6D1F' }}>⚙️ Site Controls</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'maintenance_mode', label: 'Maintenance mode', desc: 'Show maintenance page to visitors' },
                    { key: 'allow_signups',    label: 'Allow new signups', desc: 'Let new users register' },
                    { key: 'allow_posts',      label: 'Allow posting',     desc: 'Users can create posts' },
                    { key: 'allow_comments',   label: 'Allow comments',    desc: 'Users can comment on posts' },
                    { key: 'require_approval', label: 'Require approval',  desc: 'Posts need admin approval' },
                  ].map(({ key, label, desc }) => {
                    const enabled = settingVal(key) === 'true'
                    return (
                      <div key={key} style={{ background: '#222', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1' }}>{label}</span>
                          <button onClick={() => saveSetting(key, String(!enabled))} style={{
                            width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: enabled ? '#FF6D1F' : '#333', position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: enabled ? '21px' : '3px', transition: 'left 0.2s' }} />
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: '#9a8f7a', margin: 0 }}>{desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FEATURE FLAGS ────────────────────────────────────────────── */}
        {tab === 'features' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Feature Flags</h1>
            <p style={{ color: '#9a8f7a', fontSize: '14px', marginBottom: '24px' }}>Toggle features on/off without deploying code</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {flags.map(flag => (
                <div key={flag.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', marginBottom: '3px' }}>{flag.name}</div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{flag.description}</div>
                  </div>
                  <button onClick={() => toggleFlag(flag.name, !flag.enabled)} style={{
                    width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: flag.enabled ? '#FF6D1F' : '#333', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: flag.enabled ? '25px' : '3px', transition: 'left 0.2s' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUPPORT TICKETS ──────────────────────────────────────────── */}
        {tab === 'tickets' && (
          <div style={{ animation: 'slideIn 0.2s ease', display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 900 }}>Support Tickets</h1>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['open', 'in_progress', 'resolved', 'all'].map(s => (
                    <button key={s} onClick={() => setTicketFilter(s)} style={{ ...btn(ticketFilter === s), fontSize: '12px', padding: '6px 12px', textTransform: 'capitalize' as any }}>{s.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tickets.map(ticket => (
                  <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{
                    ...card, cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: selectedTicket?.id === ticket.id ? 'rgba(255,109,31,0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,109,31,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = selectedTicket?.id === ticket.id ? 'rgba(255,109,31,0.4)' : 'rgba(255,255,255,0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#FAF3E1', marginBottom: '3px' }}>{ticket.subject}</div>
                        <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{ticket.user_email} · {new Date(ticket.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: `${STATUS_COLORS[ticket.status]}22`, color: STATUS_COLORS[ticket.status] }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: PRIORITY_COLORS[ticket.priority] }}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9a8f7a', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{ticket.message}</p>
                  </div>
                ))}
                {tickets.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#9a8f7a' }}>No {ticketFilter} tickets</div>}
              </div>
            </div>

            {/* Ticket detail panel */}
            {selectedTicket && (
              <div style={{ width: '360px', flexShrink: 0 }}>
                <div style={{ ...card, position: 'sticky', top: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Ticket detail</h3>
                    <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#FAF3E1', marginBottom: '4px' }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '12px' }}>From: {selectedTicket.user_email}</div>
                    <div style={{ background: '#222', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#F5E7C6', lineHeight: 1.6, marginBottom: '12px' }}>
                      {selectedTicket.message}
                    </div>
                    {selectedTicket.admin_reply && (
                      <div style={{ background: 'rgba(255,109,31,0.06)', border: '1px solid rgba(255,109,31,0.15)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF6D1F', marginBottom: '6px' }}>YOUR REPLY</div>
                        <p style={{ fontSize: '13px', color: '#F5E7C6', margin: 0, lineHeight: 1.6 }}>{selectedTicket.admin_reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Update status</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                        <button key={s} onClick={() => updateTicketStatus(selectedTicket.id, s)} style={{
                          fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textTransform: 'capitalize' as any,
                          background: selectedTicket.status === s ? `${STATUS_COLORS[s]}33` : '#222',
                          color: selectedTicket.status === s ? STATUS_COLORS[s] : '#9a8f7a',
                        }}>{s.replace('_', ' ')}</button>
                      ))}
                    </div>
                  </div>

                  {/* Reply */}
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Reply to user</label>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} placeholder="Type your reply..."
                      style={{ ...inp, resize: 'none', lineHeight: 1.6, marginBottom: '8px' }} />
                    <button onClick={replyTicket} disabled={!replyText.trim() || saving} style={{ ...btn(!!replyText.trim()), width: '100%' }}>
                      {saving ? 'Sending...' : 'Send reply & resolve'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI NEWS ──────────────────────────────────────────────────── */}
        {tab === 'news' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900 }}>AI News</h1>
              <button onClick={() => setShowNewsForm(!showNewsForm)} style={btn()}>+ Add news</button>
            </div>

            {/* Add news form */}
            {showNewsForm && (
              <div style={{ ...card, marginBottom: '20px', border: '1px solid rgba(255,109,31,0.2)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Publish news item</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Title *</label>
                    <input value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))} placeholder="Article title..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Source name *</label>
                    <input value={newsForm.source_name} onChange={e => setNewsForm(p => ({ ...p, source_name: e.target.value }))} placeholder="TechCrunch, The Verge..." style={inp} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Summary *</label>
                    <textarea value={newsForm.summary} onChange={e => setNewsForm(p => ({ ...p, summary: e.target.value }))} placeholder="Brief summary of the article..." rows={3} style={{ ...inp, resize: 'none' as any }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Source URL *</label>
                    <input value={newsForm.source_url} onChange={e => setNewsForm(p => ({ ...p, source_url: e.target.value }))} placeholder="https://..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Image URL (optional)</label>
                    <input value={newsForm.image_url} onChange={e => setNewsForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://image.jpg" style={inp} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Tags (comma separated)</label>
                    <input value={newsForm.tags} onChange={e => setNewsForm(p => ({ ...p, tags: e.target.value }))} placeholder="Models, Tools, Research..." style={inp} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNewsForm(false)} style={btn(false)}>Cancel</button>
                  <button onClick={publishNews} disabled={newsLoading} style={btn()}>
                    {newsLoading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            )}

            {/* News list */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Title', 'Source', 'Tags', 'Published', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#9a8f7a', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newsItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
                        <p style={{ margin: 0, color: '#F5E7C6', fontSize: '13px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.title}</p>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>{item.source_name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(item.tags || []).slice(0, 2).map((t: string) => (
                            <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,109,31,0.1)', color: '#FF6D1F' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap', fontSize: '12px' }}>{new Date(item.published_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={item.source_url} target="_blank" rel="noopener" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,109,31,0.3)' }}>View</a>
                          <button onClick={() => deleteNews(item.id)} style={{ fontSize: '12px', color: '#ff8080', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {newsItems.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: '#9a8f7a' }}>No news published yet. Click "+ Add news" to start.</p>}
            </div>
          </div>
        )}

        {/* ── COMMUNITY ────────────────────────────────────────────────── */}
        {tab === 'community' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>Community</h1>

            {/* Space edit modal */}
            {editingSpace && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Edit Space: {editingSpace.display_name}</h3>
                    <button onClick={() => setEditingSpace(null)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Display name', key: 'display_name', type: 'text' },
                      { label: 'Icon (emoji)', key: 'icon', type: 'text' },
                      { label: 'Cover color', key: 'cover_color', type: 'color' },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>{label}</label>
                        <input type={type} value={(spaceEditForm as any)[key]}
                          onChange={e => setSpaceEditForm(p => ({ ...p, [key]: e.target.value }))}
                          style={{ ...inp, ...(type === 'color' ? { height: '40px', padding: '4px', cursor: 'pointer' } : {}) }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Description</label>
                      <textarea value={spaceEditForm.description} onChange={e => setSpaceEditForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' as any }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Rules</label>
                      <textarea value={spaceEditForm.rules} onChange={e => setSpaceEditForm(p => ({ ...p, rules: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' as any }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => setSpaceEditForm(p => ({ ...p, is_official: !p.is_official }))} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: spaceEditForm.is_official ? '#FF6D1F' : '#333', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: spaceEditForm.is_official ? '21px' : '3px', transition: 'left 0.2s' }} />
                      </button>
                      <span style={{ fontSize: '13px', color: '#F5E7C6' }}>Official space (AiCreatorFeed badge)</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '18px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingSpace(null)} style={btn(false)}>Cancel</button>
                    <button onClick={saveSpaceEdit} disabled={saving} style={btn()}>
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', alignItems: 'start' }}>
              {/* Spaces list */}
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Spaces ({spaces.length})</h3>
                </div>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {spaces.map(space => (
                    <div key={space.id}
                      onClick={() => handleSelectSpace(space)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedSpace?.id === space.id ? 'rgba(255,109,31,0.08)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (selectedSpace?.id !== space.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selectedSpace?.id === space.id ? 'rgba(255,109,31,0.08)' : 'transparent' }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${space.cover_color}22`, border: `1px solid ${space.cover_color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{space.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {space.display_name}
                          {space.is_official && <span style={{ fontSize: '9px', color: '#FF6D1F', background: 'rgba(255,109,31,0.1)', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>Official</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{space.member_count} members · {space.post_count} posts</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEditSpace(space)} title="Edit" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9a8f7a', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => deleteSpace(space.id, space.display_name)} title="Delete" style={{ background: 'rgba(255,80,80,0.08)', border: 'none', color: '#ff8080', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '12px' }}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {spaces.length === 0 && <p style={{ textAlign: 'center', padding: '30px', color: '#9a8f7a', fontSize: '13px' }}>No spaces yet</p>}
                </div>
              </div>

              {/* Right panel */}
              <div>
                {!selectedSpace ? (
                  <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
                    <p style={{ color: '#9a8f7a', fontSize: '14px' }}>Select a space to view and manage its posts</p>
                  </div>
                ) : (
                  <div>
                    {/* Space header */}
                    <div style={{ ...card, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${selectedSpace.cover_color}22`, border: `2px solid ${selectedSpace.cover_color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{selectedSpace.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FAF3E1', marginBottom: '2px' }}>{selectedSpace.display_name}</div>
                        <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{selectedSpace.member_count} members · {selectedSpace.post_count} posts · /{selectedSpace.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditSpace(selectedSpace)} style={btn()}>✏️ Edit</button>
                        <a href={`/community/${selectedSpace.name}`} target="_blank" rel="noopener" style={{ ...btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View →</a>
                      </div>
                    </div>

                    {/* Posts table */}
                    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Posts in {selectedSpace.display_name}</h3>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            {['Title', 'By', 'Upvotes', 'Replies', 'Pinned', 'Date', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#9a8f7a', fontWeight: 600, fontSize: '12px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {spacePosts.map(post => (
                            <tr key={post.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: '10px 14px', maxWidth: '200px' }}>
                                <p style={{ margin: 0, color: '#F5E7C6', fontSize: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{post.title}</p>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#9a8f7a', fontSize: '12px', whiteSpace: 'nowrap' }}>@{post.user?.username}</td>
                              <td style={{ padding: '10px 14px', color: '#F5E7C6' }}>▲ {post.upvotes}</td>
                              <td style={{ padding: '10px 14px', color: '#F5E7C6' }}>💬 {post.reply_count}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '12px', color: post.is_pinned ? '#FF6D1F' : '#555' }}>{post.is_pinned ? '📌' : '—'}</span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#9a8f7a', fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button onClick={() => pinSpacePost(post.id, post.is_pinned)} title={post.is_pinned ? 'Unpin' : 'Pin'} style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: post.is_pinned ? 'rgba(255,109,31,0.15)' : 'rgba(255,255,255,0.06)', color: post.is_pinned ? '#FF6D1F' : '#9a8f7a' }}>
                                    {post.is_pinned ? 'Unpin' : '📌 Pin'}
                                  </button>
                                  <a href={`/community/${selectedSpace.name}/post/${post.id}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: '#FF6D1F', textDecoration: 'none', padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,109,31,0.3)' }}>View</a>
                                  <button onClick={() => deleteSpacePost(post.id)} style={{ fontSize: '12px', color: '#ff8080', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Del</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {spacePosts.length === 0 && <p style={{ textAlign: 'center', padding: '30px', color: '#9a8f7a', fontSize: '13px' }}>No posts in this space yet</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG ─────────────────────────────────────────────── */}
        {tab === 'logs' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>Activity Log</h1>
            <AdminLogs />
          </div>
        )}
      </main>
    </div>
  )
}

function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/admin/data?type=logs').then(r => r.json()).then(d => setLogs(d.logs || []))
  }, [])
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
      {logs.length === 0
        ? <p style={{ textAlign: 'center', padding: '40px', color: '#9a8f7a', fontSize: '14px' }}>No activity yet</p>
        : logs.map(log => (
          <div key={log.id} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
            <span style={{ color: '#9a8f7a', whiteSpace: 'nowrap', fontSize: '12px' }}>{new Date(log.created_at).toLocaleString()}</span>
            <span style={{ color: '#F5E7C6' }}>{log.action}</span>
          </div>
        ))
      }
    </div>
  )
}
