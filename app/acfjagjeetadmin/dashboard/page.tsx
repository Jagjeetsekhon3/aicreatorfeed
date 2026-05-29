'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false })
const AnalyticsTab = dynamic(() => import('./AnalyticsTab'), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────
type Stats = { totalUsers: number; totalPosts: number; totalComments: number; totalTickets: number; newUsersThisWeek: number; newPostsThisWeek: number }
type Setting = { key: string; value: string }
type Flag = { id: string; name: string; enabled: boolean; description: string }
type User = { id: string; username: string; full_name: string; avatar_url: string | null; bio: string | null; followers_count: number; posts_count: number; created_at: string; is_verified: boolean; is_official: boolean }
type Post = { id: string; caption: string; media_type: string; likes_count: number; comments_count: number; created_at: string; user: { username: string; full_name: string } }
type Ticket = { id: string; user_email: string; subject: string; message: string; status: string; priority: string; admin_reply: string | null; created_at: string; user: { username: string } | null }

// ── Styles ─────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }
const inp: React.CSSProperties = { background: '#222', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'var(--color-cream)', outline: 'none', fontFamily: 'inherit', width: '100%' }
const btn = (active = true): React.CSSProperties => ({ background: active ? 'var(--color-primary)' : '#2a2a2a', color: active ? '#fff' : '#9a8f7a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' })

const SIDEBAR_ITEMS = [
  { key: 'overview',   icon: '📊', label: 'Overview' },
  { key: 'users',      icon: '👥', label: 'Users' },
  { key: 'posts',      icon: '📝', label: 'Posts' },
  { key: 'tutorials',  icon: '🎬', label: 'Tutorials' },
  { key: 'news',       icon: '📰', label: 'AI News' },
  { key: 'community',  icon: '💬', label: 'Community' },
  { key: 'aitools',    icon: '🤖', label: 'AI Tools' },
  { key: 'payments',   icon: '💳', label: 'Payments' },
  { key: 'ads',        icon: '📢', label: 'Ad Campaigns' },
  { key: 'settings',   icon: '🎨', label: 'Site Settings' },
  { key: 'seo',        icon: '🔍', label: 'SEO & Meta' },
  { key: 'features',   icon: '🔧', label: 'Features' },
  { key: 'tickets',    icon: '🎫', label: 'Support Tickets' },
  { key: 'logs',       icon: '📋', label: 'Activity Log' },
]

const STATUS_COLORS: Record<string, string> = { open: 'var(--color-primary)', in_progress: '#facc15', resolved: '#4ade80', closed: '#9a8f7a' }
const PRIORITY_COLORS: Record<string, string> = { low: '#9a8f7a', normal: 'var(--color-cream)', high: '#facc15', urgent: '#ff8080' }

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
  const [newsForm, setNewsForm] = useState({ title: '', summary: '', content: '', source_name: '', source_url: '', image_url: '', tags: '' })
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsImageUploading, setNewsImageUploading] = useState(false)

  // User edit/delete state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUserForm, setEditUserForm] = useState({ full_name: '', username: '', bio: '', is_verified: false, is_official: false, twitter: '', instagram: '', youtube: '' })
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null)
  const [userActionLoading, setUserActionLoading] = useState(false)

  // AI Tools state
  const [aiToolsList, setAiToolsList] = useState<any[]>([])
  const [newToolName, setNewToolName] = useState('')
  const [newToolColor, setNewToolColor] = useState('#9a8f7a')
  const [toolSaving, setToolSaving] = useState(false)
  const [editingTool, setEditingTool] = useState<any | null>(null)

  // Cloudinary status
  const [cloudinaryStatus, setCloudinaryStatus] = useState<any>(null)

  // Payments & Ads
  const [payments, setPayments] = useState<any[]>([])
  const [adCampaigns, setAdCampaigns] = useState<any[]>([])
  const [razorpayStatus, setRazorpayStatus] = useState<any>(null)
  const [rzpForm, setRzpForm] = useState({ key_id: '', key_secret: '', webhook_secret: '' })
  const [rzpSaving, setRzpSaving] = useState(false)
  const [rzpShowSecret, setRzpShowSecret] = useState(false)
  // Pricing settings
  const [pricingForm, setPricingForm] = useState({
    donation_preset_1_amount: '99',   donation_preset_1_label: 'Buy us a chai ☕',
    donation_preset_2_amount: '199',  donation_preset_2_label: 'Support our servers 🖥',
    donation_preset_3_amount: '499',  donation_preset_3_label: 'Fuel AI creativity 🚀',
    verified_monthly_price: '299',
    verified_yearly_price: '1999',
    ad_basic_price: '999',  ad_basic_days: '7',
    ad_pro_price: '2999',   ad_pro_days: '30',
    donation_page_title: 'Support AiCreatorFeed',
    donation_page_desc: '',
    advertise_page_title: 'Advertise on AiCreatorFeed',
    advertise_page_desc: '',
  })
  const [pricingSaving, setPricingSaving] = useState(false)

  // Tutorials state
  const [tutorials, setTutorials] = useState<any[]>([])
  const [showTutorialForm, setShowTutorialForm] = useState(false)
  const [tutorialForm, setTutorialForm] = useState({ title: '', description: '', youtube_video_id: '', duration_minutes: '', tags: '' })
  const [tutorialLoading, setTutorialLoading] = useState(false)

  // Community state
  const [spaces, setSpaces] = useState<any[]>([])
  const [spacePosts, setSpacePosts] = useState<any[]>([])
  const [selectedSpace, setSelectedSpace] = useState<any>(null)
  const [communityTab, setCommunityTab] = useState<'spaces' | 'posts'>('spaces')
  const [editingSpace, setEditingSpace] = useState<any>(null)
  const [spaceEditForm, setSpaceEditForm] = useState({ display_name: '', description: '', icon: '', cover_color: '', rules: '', is_official: false })
  const [showCreateSpace, setShowCreateSpace] = useState(false)
  const [createSpaceForm, setCreateSpaceForm] = useState({ name: '', display_name: '', description: '', icon: '✨', cover_color: 'var(--color-primary)', rules: '', is_official: false })
  const [createSpaceLoading, setCreateSpaceLoading] = useState(false)

  // SEO state
  const [seoSettings, setSeoSettings] = useState({
    meta_title: '', meta_description: '', meta_keywords: '',
    og_title: '', og_description: '', favicon_url: '',
  })

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
    if (tab === 'settings') {
      api('settings').then(d => { if (d) { setSettings(d.settings); setFlags(d.flags) } })
      fetch('/api/admin/cloudinary-check').then(r => r.json()).then(d => setCloudinaryStatus(d)).catch(() => {})
    }
    if (tab === 'users')     api('users').then(d => { if (d) setUsers(d.users) })
    if (tab === 'posts')     api('posts').then(d => { if (d) setPosts(d.posts) })
    if (tab === 'news')      api('news_admin').then(d => { if (d) setNewsItems(d.news) })
    if (tab === 'tutorials') fetch('/api/tutorials').then(r => r.json()).then(d => setTutorials(d.tutorials || []))
    if (tab === 'community') api('spaces_admin').then(d => { if (d) setSpaces(d.spaces) })
    if (tab === 'aitools')   fetch('/api/ai-tools').then(r => r.json()).then(d => setAiToolsList(d.tools || []))
    if (tab === 'tickets')   api('tickets', `&status=${ticketFilter}`).then(d => { if (d) setTickets(d.tickets) })
    if (tab === 'payments')  api('payments_admin').then(d => {
      if (d) {
        setPayments(d.payments || [])
        setRazorpayStatus(d.razorpay_status)
        setRzpForm({
          key_id: d.razorpay_status?.key_id_saved || '',
          key_secret: d.razorpay_status?.key_secret_saved ? '••••••••••••••••' : '',
          webhook_secret: d.razorpay_status?.webhook_secret_saved ? '••••••••••••••••' : '',
        })
        // Load pricing from settings
        if (d.pricing) {
          setPricingForm(prev => ({ ...prev, ...d.pricing }))
        }
      }
    })
    if (tab === 'ads')       api('ads_admin').then(d => { if (d) setAdCampaigns(d.ads || []) })
    if (tab === 'seo')       api('settings').then(d => {
      if (d?.settings) {
        const s = (d.settings as Setting[]).reduce((acc: any, s) => { acc[s.key] = s.value; return acc }, {} as any)
        setSeoSettings({
          meta_title: s.meta_title || '',
          meta_description: s.meta_description || '',
          meta_keywords: s.meta_keywords || '',
          og_title: s.og_title || '',
          og_description: s.og_description || '',
          favicon_url: s.favicon_url || '',
        })
      }
    })
  }, [tab, ticketFilter])

  async function searchUsers() {
    const d = await api('users', `&search=${userSearch}`)
    if (d) setUsers(d.users)
  }

  function openEditUser(user: User) {
    setEditingUser(user)
    setEditUserForm({
      full_name: user.full_name || '',
      username: user.username || '',
      bio: (user as any).bio || '',
      is_verified: user.is_verified || false,
      is_official: user.is_official || false,
      twitter: (user as any).twitter || '',
      instagram: (user as any).instagram || '',
      youtube: (user as any).youtube || '',
    })
  }

  async function saveEditUser() {
    if (!editingUser) return
    if (!editUserForm.full_name.trim() || !editUserForm.username.trim()) { showToast('Name and username are required'); return }
    setUserActionLoading(true)
    await action('edit_user', { user_id: editingUser.id, ...editUserForm })
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editUserForm } : u))
    setEditingUser(null)
    showToast('User updated!')
    setUserActionLoading(false)
  }

  async function deleteUser(user: User) {
    setUserActionLoading(true)
    await action('delete_user', { user_id: user.id })
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setDeleteConfirmUser(null)
    showToast('User deleted')
    setUserActionLoading(false)
  }

  async function publishNews() {
    if (!newsForm.title || !newsForm.summary || !newsForm.source_name || !newsForm.source_url) { showToast('Fill all required fields'); return }
    setNewsLoading(true)
    await action('publish_news', { ...newsForm, tags: newsForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) })
    setNewsForm({ title: '', summary: '', content: '', source_name: '', source_url: '', image_url: '', tags: '' })
    setShowNewsForm(false)
    const d = await api('news_admin')
    if (d) setNewsItems(d.news)
    showToast('News published!')
    setNewsLoading(false)
  }

  async function publishTutorial() {
    if (!tutorialForm.title || !tutorialForm.youtube_video_id) { showToast('Title and YouTube ID are required'); return }
    setTutorialLoading(true)
    const res = await fetch('/api/tutorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...tutorialForm,
        duration_minutes: parseInt(tutorialForm.duration_minutes) || 0,
        tags: tutorialForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      setTutorialForm({ title: '', description: '', youtube_video_id: '', duration_minutes: '', tags: '' })
      setShowTutorialForm(false)
      const d = await fetch('/api/tutorials').then(r => r.json())
      setTutorials(d.tutorials || [])
      showToast('Tutorial added!')
    } else showToast('Failed to add tutorial')
    setTutorialLoading(false)
  }

  async function deleteTutorial(id: string) {
    if (!confirm('Delete this tutorial?')) return
    await fetch('/api/tutorials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setTutorials(prev => prev.filter((t: any) => t.id !== id))
    showToast('Deleted')
  }

  async function addAiTool() {
    if (!newToolName.trim()) { showToast('Enter a tool name'); return }
    setToolSaving(true)
    const res = await fetch('/api/ai-tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newToolName.trim(), color: newToolColor, sort_order: aiToolsList.length }),
    })
    const d = await res.json()
    if (d.tool) {
      setAiToolsList(prev => [...prev, d.tool])
      setNewToolName('')
      setNewToolColor('#9a8f7a')
      showToast('Tool added!')
    } else showToast(d.error || 'Failed')
    setToolSaving(false)
  }

  async function deleteAiTool(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the tools list?`)) return
    await fetch('/api/ai-tools', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setAiToolsList(prev => prev.filter(t => t.id !== id))
    showToast('Tool removed')
  }

  async function saveAiToolEdit(tool: any) {
    const res = await fetch('/api/ai-tools', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tool.id, name: tool.name, color: tool.color, sort_order: tool.sort_order }),
    })
    if (res.ok) { setEditingTool(null); showToast('Saved') }
  }

  async function moveAiTool(id: string, direction: 'up' | 'down') {
    const idx = aiToolsList.findIndex(t => t.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === aiToolsList.length - 1) return
    const newList = [...aiToolsList]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]]
    // update sort_order values
    const updated = newList.map((t, i) => ({ ...t, sort_order: i }))
    setAiToolsList(updated)
    // save both swapped items
    await Promise.all([
      fetch('/api/ai-tools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: updated[idx].id, sort_order: idx }) }),
      fetch('/api/ai-tools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: updated[swapIdx].id, sort_order: swapIdx }) }),
    ])
  }

  async function createSpace() {
    if (!createSpaceForm.name || !createSpaceForm.display_name) { showToast('Slug and display name are required'); return }
    setCreateSpaceLoading(true)
    await action('create_space', createSpaceForm)
    setCreateSpaceForm({ name: '', display_name: '', description: '', icon: '✨', cover_color: 'var(--color-primary)', rules: '', is_official: false })
    setShowCreateSpace(false)
    const d = await api('spaces_admin')
    if (d) setSpaces(d.spaces)
    showToast('Space created!')
    setCreateSpaceLoading(false)
  }

  async function saveSeoSetting(key: string, value: string) {
    setSaving(true)
    await action('update_setting', { key, value })
    showToast('Saved!')
    setSaving(false)
  }

  async function saveAllSeo() {
    setSaving(true)
    for (const [key, value] of Object.entries(seoSettings)) {
      await action('update_setting', { key, value })
    }
    showToast('SEO settings saved!')
    setSaving(false)
  }

  async function savePricingSettings() {
    setPricingSaving(true)
    for (const [key, value] of Object.entries(pricingForm)) {
      await action('update_setting', { key: `pricing_${key}`, value: String(value) })
    }
    showToast('Pricing settings saved!')
    setPricingSaving(false)
  }

  async function saveRazorpayKeys() {
    setRzpSaving(true)
    const updates: {key: string; value: string}[] = []
    if (rzpForm.key_id && !rzpForm.key_id.startsWith('•'))
      updates.push({ key: 'razorpay_key_id', value: rzpForm.key_id.trim() })
    if (rzpForm.key_secret && !rzpForm.key_secret.startsWith('•'))
      updates.push({ key: 'razorpay_key_secret', value: rzpForm.key_secret.trim() })
    if (rzpForm.webhook_secret && !rzpForm.webhook_secret.startsWith('•'))
      updates.push({ key: 'razorpay_webhook_secret', value: rzpForm.webhook_secret.trim() })

    for (const u of updates) await action('update_setting', u)

    // Refresh status
    const d = await api('payments_admin')
    if (d) setRazorpayStatus(d.razorpay_status)
    showToast('Razorpay keys saved!')
    setRzpSaving(false)
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
      <div style={{ width: '36px', height: '36px', border: '3px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: 'var(--color-cream)', display: 'flex', fontFamily: 'inherit' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}} @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} * { box-sizing: border-box } scrollbar-width: thin;`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--color-primary)', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, zIndex: 1000, animation: 'toastIn 0.2s ease', boxShadow: '0 4px 20px color-mix(in srgb, var(--color-primary) 40%, transparent)' }}>
          ✓ {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#141414', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🛡️</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-cream)' }}>Admin Panel</div>
              <div style={{ fontSize: '10px', color: '#6b6460' }}>AiCreatorFeed</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '8px', flex: 1 }}>
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: tab === item.key ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
              color: tab === item.key ? 'var(--color-primary)' : '#9a8f7a',
              fontSize: '13px', fontWeight: tab === item.key ? 600 : 400,
              fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '15px' }}>{item.icon}</span>
              {item.label}
              {item.key === 'tickets' && tickets.filter(t => t.status === 'open').length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--color-primary)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px' }}>
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
        {tab === 'overview' && <AnalyticsTab />}

        {/* ── USERS ────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px' }}>Users</h1>

            {/* Edit User Modal */}
            {editingUser && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    {editingUser.avatar_url
                      ? <img src={editingUser.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>{editingUser.full_name?.[0]}</div>
                    }
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Edit User</h3>
                      <div style={{ fontSize: '12px', color: '#9a8f7a' }}>ID: {editingUser.id.slice(0, 8)}…</div>
                    </div>
                    <button onClick={() => setEditingUser(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '20px' }}>×</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Full Name *</label>
                      <input value={editUserForm.full_name} onChange={e => setEditUserForm(p => ({ ...p, full_name: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Username *</label>
                      <input value={editUserForm.username} onChange={e => setEditUserForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} style={inp} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Bio</label>
                      <textarea value={editUserForm.bio} onChange={e => setEditUserForm(p => ({ ...p, bio: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' as any }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Twitter handle</label>
                      <input value={editUserForm.twitter} onChange={e => setEditUserForm(p => ({ ...p, twitter: e.target.value }))} placeholder="username" style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Instagram handle</label>
                      <input value={editUserForm.instagram} onChange={e => setEditUserForm(p => ({ ...p, instagram: e.target.value }))} placeholder="username" style={inp} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>YouTube channel URL</label>
                      <input value={editUserForm.youtube} onChange={e => setEditUserForm(p => ({ ...p, youtube: e.target.value }))} placeholder="https://youtube.com/@..." style={inp} />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', gap: '20px', marginTop: '16px', padding: '14px', background: '#222', borderRadius: '10px' }}>
                    {[
                      { key: 'is_verified', label: 'Verified', desc: 'Orange ✓ badge' },
                      { key: 'is_official', label: 'Official', desc: 'Filled ● badge' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <button
                          onClick={() => setEditUserForm(p => ({ ...p, [key]: !(p as any)[key] }))}
                          style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: (editUserForm as any)[key] ? 'var(--color-primary)' : '#333', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                        >
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: (editUserForm as any)[key] ? '21px' : '3px', transition: 'left 0.2s' }} />
                        </button>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)' }}>{label}</div>
                          <div style={{ fontSize: '11px', color: '#9a8f7a' }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { setEditingUser(null); setDeleteConfirmUser(editingUser) }} style={{ ...btn(false), color: '#ff8080', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}>
                      🗑 Delete user
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingUser(null)} style={btn(false)}>Cancel</button>
                      <button onClick={saveEditUser} disabled={userActionLoading} style={btn()}>
                        {userActionLoading ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirmUser && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '8px' }}>Delete @{deleteConfirmUser.username}?</h3>
                  <p style={{ fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6, marginBottom: '24px' }}>
                    This will permanently delete their account, all posts, comments, and data. <strong style={{ color: '#ff8080' }}>This cannot be undone.</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => setDeleteConfirmUser(null)} style={btn(false)}>Cancel</button>
                    <button onClick={() => deleteUser(deleteConfirmUser)} disabled={userActionLoading} style={{ ...btn(), background: '#dc2626' }}>
                      {userActionLoading ? 'Deleting...' : 'Yes, delete permanently'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                            : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{user.full_name?.[0]}</div>
                          }
                          <span style={{ fontWeight: 600, color: 'var(--color-cream)' }}>{user.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a' }}>@{user.username}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-beige)' }}>{user.posts_count}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-beige)' }}>{user.followers_count}</td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {user.is_verified && <span style={{ fontSize: '14px' }} title="Verified">✓</span>}
                          {user.is_official && <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>Official</span>}
                          <a href={`/profile/${user.username}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: '#9a8f7a', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>View</a>
                          <button onClick={() => openEditUser(user)} style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>✏️ Edit</button>
                          <button onClick={() => setDeleteConfirmUser(user)} style={{ fontSize: '12px', color: '#ff8080', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
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
                        <p style={{ margin: 0, color: 'var(--color-beige)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, fontSize: '12px' }}>{post.caption || '(no caption)'}</p>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>@{post.user?.username}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)', fontWeight: 600 }}>{post.media_type}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-beige)' }}>{post.likes_count}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-beige)' }}>{post.comments_count}</td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={`/post/${post.id}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>View</a>
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

        {/* ── PAYMENTS ─────────────────────────────────────────────────── */}
        {tab === 'payments' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>💳 Payments & Razorpay</h1>

            {/* ── Razorpay Key Settings ── */}
            <div style={{ ...card, marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💳</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-cream)' }}>Razorpay Configuration</div>
                    {!razorpayStatus ? (
                      <div style={{ fontSize: '12px', color: '#9a8f7a' }}>Checking connection...</div>
                    ) : razorpayStatus.configured ? (
                      <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        ● Connected &nbsp;·&nbsp;
                        {razorpayStatus.mode === 'live'
                          ? <span style={{ color: '#4ade80', fontWeight: 700 }}>🟢 Live mode</span>
                          : <span style={{ color: '#facc15', fontWeight: 700 }}>🟡 Test mode</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#ff8080' }}>● Not connected — enter your keys below</div>
                    )}
                  </div>
                </div>
                <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener"
                  style={{ ...btn(false), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                  Razorpay Dashboard ↗
                </a>
              </div>

              {/* Key fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Key ID */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>
                    Key ID
                    <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: '#555' }}>starts with rzp_test_ or rzp_live_</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={rzpForm.key_id}
                      onChange={e => setRzpForm(p => ({ ...p, key_id: e.target.value }))}
                      placeholder="rzp_test_xxxxxxxxxxxx"
                      style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                    />
                    {razorpayStatus?.configured && (
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', fontSize: '11px', color: '#4ade80', whiteSpace: 'nowrap' }}>
                        ✓ Saved
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Secret */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>
                    Key Secret
                    <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: '#ff8080' }}>⚠ Never share this</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type={rzpShowSecret ? 'text' : 'password'}
                        value={rzpForm.key_secret}
                        onChange={e => setRzpForm(p => ({ ...p, key_secret: e.target.value }))}
                        placeholder="Enter your secret key"
                        style={{ ...inp, width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px', paddingRight: '70px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setRzpShowSecret(v => !v)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9a8f7a', fontFamily: 'inherit' }}
                      >{rzpShowSecret ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>
                    Webhook Secret
                    <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: '#555' }}>optional — from Razorpay → Webhooks</span>
                  </label>
                  <input
                    type="password"
                    value={rzpForm.webhook_secret}
                    onChange={e => setRzpForm(p => ({ ...p, webhook_secret: e.target.value }))}
                    placeholder="Leave blank if not using webhooks"
                    style={{ ...inp, width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>

                {/* Save button */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
                  <button onClick={saveRazorpayKeys} disabled={rzpSaving} style={btn()}>
                    {rzpSaving ? 'Saving...' : '💾 Save Razorpay keys'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#555' }}>Keys are stored securely in site_settings</span>
                </div>
              </div>

              {/* Mode indicator & tip */}
              <div style={{ marginTop: '18px', padding: '14px', background: rzpForm.key_id.startsWith('rzp_live') ? 'rgba(74,222,128,0.05)' : 'rgba(250,204,21,0.05)', border: `1px solid ${rzpForm.key_id.startsWith('rzp_live') ? 'rgba(74,222,128,0.15)' : 'rgba(250,204,21,0.15)'}`, borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: rzpForm.key_id.startsWith('rzp_live') ? '#4ade80' : '#facc15', marginBottom: '6px' }}>
                  {rzpForm.key_id.startsWith('rzp_live') ? '🟢 Live mode — real payments will be processed' : '🟡 Test mode — use test cards, no real money'}
                </div>
                <p style={{ fontSize: '11px', color: '#9a8f7a', margin: 0, lineHeight: 1.7 }}>
                  Test card: <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '3px' }}>4111 1111 1111 1111</code> · Any future expiry · CVV: <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '3px' }}>123</code> · OTP: <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '3px' }}>123456</code>
                </p>
              </div>
            </div>

            {/* Revenue summary */}
            {payments.length > 0 && (() => {
              const paid = payments.filter(p => p.status === 'paid')
              const total = paid.reduce((sum, p) => sum + (p.amount || 0), 0)
              const byType = paid.reduce((acc: any, p) => { acc[p.type] = (acc[p.type] || 0) + p.amount; return acc }, {})
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <div style={card}><div style={{ fontSize: '20px', fontWeight: 900, color: '#4ade80' }}>₹{(total / 100).toLocaleString('en-IN')}</div><div style={{ fontSize: '12px', color: '#9a8f7a' }}>Total revenue</div></div>
                  <div style={card}><div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-primary)' }}>₹{((byType.donation || 0) / 100).toLocaleString('en-IN')}</div><div style={{ fontSize: '12px', color: '#9a8f7a' }}>Donations</div></div>
                  <div style={card}><div style={{ fontSize: '20px', fontWeight: 900, color: '#a78bfa' }}>₹{((byType.subscription || 0) / 100).toLocaleString('en-IN')}</div><div style={{ fontSize: '12px', color: '#9a8f7a' }}>Subscriptions</div></div>
                  <div style={card}><div style={{ fontSize: '20px', fontWeight: 900, color: '#facc15' }}>₹{((byType.ad || 0) / 100).toLocaleString('en-IN')}</div><div style={{ fontSize: '12px', color: '#9a8f7a' }}>Ad revenue</div></div>
                </div>
              )
            })()}

            {/* ── Pricing Settings ── */}
            <div style={{ ...card, marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-cream)' }}>🏷 Pricing & Package Settings</div>
                  <div style={{ fontSize: '12px', color: '#9a8f7a', marginTop: '2px' }}>Edit prices and labels — live on your donation, verify, and advertise pages instantly</div>
                </div>
                <button onClick={savePricingSettings} disabled={pricingSaving} style={btn()}>
                  {pricingSaving ? 'Saving...' : '💾 Save all pricing'}
                </button>
              </div>

              {/* DONATION SETTINGS */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#facc15', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💛</span> DONATION PAGE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Page title</label>
                    <input value={pricingForm.donation_page_title} onChange={e => setPricingForm(p => ({ ...p, donation_page_title: e.target.value }))} style={inp} placeholder="Support AiCreatorFeed" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Page subtitle</label>
                    <input value={pricingForm.donation_page_desc} onChange={e => setPricingForm(p => ({ ...p, donation_page_desc: e.target.value }))} style={inp} placeholder="Short description shown on the page" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {([1, 2, 3] as const).map(n => (
                    <div key={n} style={{ background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.12)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#facc15', fontWeight: 700, marginBottom: '8px' }}>PRESET {n}</div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                        <span style={{ color: '#9a8f7a', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>₹</span>
                        <input
                          type="number"
                          value={(pricingForm as any)[`donation_preset_${n}_amount`]}
                          onChange={e => setPricingForm(p => ({ ...p, [`donation_preset_${n}_amount`]: e.target.value }))}
                          style={{ ...inp, padding: '7px 8px', fontSize: '13px', fontWeight: 700 }}
                          placeholder="99"
                        />
                      </div>
                      <input
                        value={(pricingForm as any)[`donation_preset_${n}_label`]}
                        onChange={e => setPricingForm(p => ({ ...p, [`donation_preset_${n}_label`]: e.target.value }))}
                        style={{ ...inp, padding: '7px 8px', fontSize: '12px' }}
                        placeholder="Label..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* VERIFIED SUBSCRIPTION SETTINGS */}
              <div style={{ marginBottom: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f472b6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> VERIFIED BADGE SUBSCRIPTION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(244,114,182,0.04)', border: '1px solid rgba(244,114,182,0.12)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#f472b6', fontWeight: 700, marginBottom: '10px' }}>MONTHLY PLAN</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#9a8f7a', fontSize: '14px', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        value={pricingForm.verified_monthly_price}
                        onChange={e => setPricingForm(p => ({ ...p, verified_monthly_price: e.target.value }))}
                        style={{ ...inp, fontSize: '16px', fontWeight: 800 }}
                        placeholder="299"
                      />
                      <span style={{ color: '#555', fontSize: '12px', flexShrink: 0 }}>/month</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(244,114,182,0.04)', border: '1px solid rgba(244,114,182,0.12)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#f472b6', fontWeight: 700, marginBottom: '10px' }}>YEARLY PLAN</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#9a8f7a', fontSize: '14px', fontWeight: 700 }}>₹</span>
                      <input
                        type="number"
                        value={pricingForm.verified_yearly_price}
                        onChange={e => setPricingForm(p => ({ ...p, verified_yearly_price: e.target.value }))}
                        style={{ ...inp, fontSize: '16px', fontWeight: 800 }}
                        placeholder="1999"
                      />
                      <span style={{ color: '#555', fontSize: '12px', flexShrink: 0 }}>/year</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AD CAMPAIGN PACKAGE SETTINGS */}
              <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📢</span> AD CAMPAIGN PACKAGES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { key: 'basic', label: 'BASIC PACKAGE', color: '#34d399' },
                    { key: 'pro',   label: 'PRO PACKAGE',   color: '#60a5fa' },
                  ].map(({ key, label, color }) => (
                    <div key={key} style={{ background: `rgba(${color === '#34d399' ? '52,211,153' : '96,165,250'},0.04)`, border: `1px solid rgba(${color === '#34d399' ? '52,211,153' : '96,165,250'},0.12)`, borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '11px', color, fontWeight: 700, marginBottom: '10px' }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ color: '#9a8f7a', fontSize: '14px', fontWeight: 700 }}>₹</span>
                        <input
                          type="number"
                          value={(pricingForm as any)[`ad_${key}_price`]}
                          onChange={e => setPricingForm(p => ({ ...p, [`ad_${key}_price`]: e.target.value }))}
                          style={{ ...inp, fontSize: '16px', fontWeight: 800 }}
                          placeholder={key === 'basic' ? '999' : '2999'}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          value={(pricingForm as any)[`ad_${key}_days`]}
                          onChange={e => setPricingForm(p => ({ ...p, [`ad_${key}_days`]: e.target.value }))}
                          style={{ ...inp, fontSize: '13px', width: '60px', padding: '7px 8px' }}
                          placeholder="7"
                        />
                        <span style={{ color: '#9a8f7a', fontSize: '12px' }}>days duration</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advertise page settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Advertise page title</label>
                    <input value={pricingForm.advertise_page_title} onChange={e => setPricingForm(p => ({ ...p, advertise_page_title: e.target.value }))} style={inp} placeholder="Advertise on AiCreatorFeed" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Advertise page subtitle</label>
                    <input value={pricingForm.advertise_page_desc} onChange={e => setPricingForm(p => ({ ...p, advertise_page_desc: e.target.value }))} style={inp} placeholder="Short description" />
                  </div>
                </div>
              </div>

              {/* Save button (bottom) */}
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={savePricingSettings} disabled={pricingSaving} style={btn()}>
                  {pricingSaving ? 'Saving...' : '💾 Save all pricing'}
                </button>
              </div>
            </div>

            {/* Payments table */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>All payments ({payments.length})</span>
              </div>
              {payments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9a8f7a' }}>No payments yet</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['User', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#9a8f7a', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--color-cream)' }}>{p.user?.full_name || 'Guest'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, background: p.type === 'donation' ? 'rgba(74,222,128,0.1)' : p.type === 'subscription' ? 'rgba(167,139,250,0.1)' : 'rgba(250,204,21,0.1)', color: p.type === 'donation' ? '#4ade80' : p.type === 'subscription' ? '#a78bfa' : '#facc15' }}>{p.type}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-cream)', fontWeight: 600 }}>₹{(p.amount / 100).toFixed(0)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: p.status === 'paid' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', color: p.status === 'paid' ? '#4ade80' : '#9a8f7a' }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#9a8f7a' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── AD CAMPAIGNS ─────────────────────────────────────────────── */}
        {tab === 'ads' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>📢 Ad Campaigns</h1>
              <a href="/advertise" target="_blank" rel="noopener" style={{ ...btn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '13px' }}>+ New campaign ↗</a>
            </div>

            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              {adCampaigns.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📢</div>
                  <p style={{ color: '#9a8f7a', fontSize: '14px' }}>No ad campaigns yet.<br/>When advertisers book campaigns they'll appear here for review.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Ad', 'Advertiser', 'Slot', 'Period', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#9a8f7a', fontSize: '11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adCampaigns.map(ad => (
                      <tr key={ad.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {ad.image_url && <img src={ad.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                            <div>
                              <div style={{ color: 'var(--color-cream)', fontWeight: 600, fontSize: '12px' }}>{ad.title}</div>
                              {ad.description && <div style={{ color: '#9a8f7a', fontSize: '11px' }}>{ad.description?.slice(0, 40)}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#9a8f7a' }}>{ad.user?.full_name || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px', color: '#9a8f7a' }}>{ad.slot}</span></td>
                        <td style={{ padding: '10px 14px', color: '#9a8f7a', fontSize: '11px' }}>
                          {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'} →{' '}
                          {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, background: ad.status === 'active' ? 'rgba(74,222,128,0.1)' : ad.status === 'pending' ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.05)', color: ad.status === 'active' ? '#4ade80' : ad.status === 'pending' ? '#facc15' : '#9a8f7a' }}>{ad.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {ad.status === 'pending' && (
                              <button onClick={() => { action('update_ad_status', { ad_id: ad.id, status: 'active' }); setAdCampaigns(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'active' } : a)); showToast('Ad approved!') }}
                                style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Approve</button>
                            )}
                            {ad.status === 'active' && (
                              <button onClick={() => { action('update_ad_status', { ad_id: ad.id, status: 'paused' }); setAdCampaigns(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'paused' } : a)); showToast('Ad paused') }}
                                style={{ fontSize: '11px', color: '#facc15', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Pause</button>
                            )}
                            {ad.status === 'paused' && (
                              <button onClick={() => { action('update_ad_status', { ad_id: ad.id, status: 'active' }); setAdCampaigns(prev => prev.map(a => a.id === ad.id ? { ...a, status: 'active' } : a)); showToast('Ad resumed') }}
                                style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Resume</button>
                            )}
                            <a href={ad.link_url} target="_blank" rel="noopener" style={{ fontSize: '11px', color: '#9a8f7a', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 8px', textDecoration: 'none' }}>↗</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── AI TOOLS ─────────────────────────────────────────────────── */}
        {tab === 'aitools' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>AI Tools</h1>
              <p style={{ fontSize: '13px', color: '#9a8f7a', margin: 0 }}>
                These tools appear in the post creation form, edit form, and explore filters across the entire site.
              </p>
            </div>

            {/* Add new tool */}
            <div style={{ ...card, marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-primary)' }}>➕ Add new tool</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Tool name *</label>
                  <input
                    value={newToolName}
                    onChange={e => setNewToolName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAiTool()}
                    placeholder="e.g. Adobe Firefly, Ideogram, Grok..."
                    style={inp}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Badge color</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="color" value={newToolColor} onChange={e => setNewToolColor(e.target.value)}
                      style={{ width: '40px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent', padding: 0 }} />
                    <span style={{ fontSize: '11px', color: '#9a8f7a', fontFamily: 'monospace' }}>{newToolColor}</span>
                  </div>
                </div>
                {/* Preview badge */}
                {newToolName && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: `${newToolColor}22`, color: newToolColor, border: `1px solid ${newToolColor}44` }}>
                      {newToolName}
                    </span>
                  </div>
                )}
                <button onClick={addAiTool} disabled={toolSaving || !newToolName.trim()} style={btn()}>
                  {toolSaving ? 'Adding...' : '+ Add tool'}
                </button>
              </div>
            </div>

            {/* Tools list */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#9a8f7a' }}>{aiToolsList.length} tools active</span>
                <span style={{ fontSize: '12px', color: '#555' }}>Use ↑↓ arrows to reorder</span>
              </div>

              {aiToolsList.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9a8f7a' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                  No tools yet. Add one above!
                </div>
              )}

              {aiToolsList.map((tool, idx) => (
                <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Reorder arrows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                    <button onClick={() => moveAiTool(tool.id, 'up')} disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#333' : '#9a8f7a', fontSize: '11px', padding: '1px 4px', lineHeight: 1 }}>▲</button>
                    <button onClick={() => moveAiTool(tool.id, 'down')} disabled={idx === aiToolsList.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === aiToolsList.length - 1 ? 'default' : 'pointer', color: idx === aiToolsList.length - 1 ? '#333' : '#9a8f7a', fontSize: '11px', padding: '1px 4px', lineHeight: 1 }}>▼</button>
                  </div>

                  {/* Color dot */}
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: tool.color, flexShrink: 0 }} />

                  {/* Name / edit inline */}
                  {editingTool?.id === tool.id ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={editingTool.name}
                        onChange={e => setEditingTool((p: any) => ({ ...p, name: e.target.value }))}
                        style={{ ...inp, flex: 1, minWidth: '120px', padding: '6px 10px', fontSize: '13px' }}
                        autoFocus
                      />
                      <input type="color" value={editingTool.color}
                        onChange={e => setEditingTool((p: any) => ({ ...p, color: e.target.value }))}
                        style={{ width: '34px', height: '34px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                      <button onClick={() => saveAiToolEdit(editingTool)} style={{ ...btn(), padding: '6px 12px', fontSize: '12px' }}>Save</button>
                      <button onClick={() => setEditingTool(null)} style={{ ...btn(false), padding: '6px 10px', fontSize: '12px' }}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)' }}>{tool.name}</span>
                        <span style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', borderRadius: '5px', background: `${tool.color}22`, color: tool.color, border: `1px solid ${tool.color}33`, fontWeight: 700 }}>{tool.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>#{idx + 1}</span>
                      <button onClick={() => setEditingTool({ ...tool })}
                        style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteAiTool(tool.id, tool.name)}
                        style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🗑
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '14px', padding: '12px 16px', background: 'color-mix(in srgb, var(--color-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 12%, transparent)', borderRadius: '12px', fontSize: '13px', color: '#9a8f7a', lineHeight: 1.6 }}>
              💡 Changes apply <strong style={{ color: 'var(--color-cream)' }}>immediately</strong> — users will see the updated list next time they open the post form or explore page.
            </div>
          </div>
        )}

        {/* ── SITE SETTINGS ────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '24px' }}>Site Settings</h1>

            {/* Cloudinary Status */}
            <div style={{ ...card, marginBottom: '16px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>☁️</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '2px' }}>Cloudinary — Image Storage</div>
                    {!cloudinaryStatus ? (
                      <div style={{ fontSize: '12px', color: '#9a8f7a' }}>Checking connection...</div>
                    ) : cloudinaryStatus.configured ? (
                      <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>●</span> Connected — cloud: <strong>{cloudinaryStatus.cloud_name}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#ff8080', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>●</span> {cloudinaryStatus.status} {cloudinaryStatus.error ? `— ${cloudinaryStatus.error}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => fetch('/api/admin/cloudinary-check').then(r => r.json()).then(d => setCloudinaryStatus(d))}
                  style={{ ...btn(false), padding: '6px 14px', fontSize: '12px' }}>↺ Recheck</button>
              </div>

              {/* Missing vars guide */}
              {cloudinaryStatus && !cloudinaryStatus.configured && (
                <div style={{ marginTop: '14px', padding: '14px', background: '#1a1a1a', borderRadius: '10px', border: '1px solid rgba(255,80,80,0.15)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff8080', marginBottom: '10px' }}>
                    {cloudinaryStatus.missing?.length > 0 ? '⚠️ Missing environment variables:' : '⚠️ Connection error — check your credentials'}
                  </div>
                  {cloudinaryStatus.missing?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {cloudinaryStatus.missing.map((v: string) => (
                        <code key={v} style={{ fontSize: '12px', background: 'rgba(255,80,80,0.1)', color: '#ff8080', padding: '3px 8px', borderRadius: '5px', fontFamily: 'monospace' }}>{v}</code>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.8 }}>
                    <strong style={{ color: 'var(--color-cream)' }}>How to fix:</strong><br/>
                    1. Go to <a href="https://cloudinary.com/console" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>cloudinary.com/console</a> → Dashboard<br/>
                    2. Copy your Cloud name, API Key, and API Secret<br/>
                    3. Add them in <a href="https://vercel.com/dashboard" target="_blank" rel="noopener" style={{ color: 'var(--color-primary)' }}>Vercel</a> → Your project → Settings → Environment Variables<br/>
                    4. Redeploy (Vercel → Deployments → Redeploy)
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Brand colors */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>🎨 Brand Colors</h3>
                <p style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '14px' }}>Changes apply site-wide on next page load.</p>
                {[
                  { key: 'brand_primary',    label: 'Primary / Accent',  default: '#FF6D1F' },
                  { key: 'brand_background', label: 'Background',         default: '#222222' },
                  { key: 'brand_cream',      label: 'Cream (text)',       default: '#FAF3E1' },
                  { key: 'brand_beige',      label: 'Beige (secondary)',  default: '#F5E7C6' },
                ].map(({ key, label, default: def }) => {
                  const val = settingVal(key) || def
                  return (
                    <div key={key} style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>{label}</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={val} onChange={e => setSettings(prev => prev.map(s => s.key === key ? { ...s, value: e.target.value } : s.key === key ? { key, value: e.target.value } : s))}
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
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>✦ Site Identity</h3>
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
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>⚙️ Site Controls</h3>
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
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)' }}>{label}</span>
                          <button onClick={() => saveSetting(key, String(!enabled))} style={{
                            width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: enabled ? 'var(--color-primary)' : '#333', position: 'relative', transition: 'background 0.2s',
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

              {/* Social Links */}
              <div style={{ ...card, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)' }}>📣 Social Links</h3>
                <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '16px', marginTop: 0 }}>These appear on the Contact page. Leave blank to hide.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {[
                    { key: 'social_twitter',          label: '𝕏 Twitter / X',   placeholder: 'username (no @)' },
                    { key: 'social_instagram',        label: '📸 Instagram',      placeholder: 'username (no @)' },
                    { key: 'social_discord',          label: '💬 Discord URL',    placeholder: 'https://discord.gg/...' },
                    { key: 'social_discord_label',    label: '💬 Discord label',  placeholder: 'Join our server' },
                    { key: 'social_youtube',          label: '▶ YouTube URL',    placeholder: 'https://youtube.com/@...' },
                    { key: 'social_youtube_label',    label: '▶ YouTube label',  placeholder: 'Watch tutorials' },
                    { key: 'social_tiktok',           label: '♪ TikTok',          placeholder: 'username (no @)' },
                    { key: 'social_linkedin',         label: 'in LinkedIn URL',   placeholder: 'https://linkedin.com/company/...' },
                    { key: 'social_linkedin_label',   label: 'in LinkedIn label', placeholder: 'Connect with us' },
                  ].map(({ key, label, placeholder }) => {
                    const val = settingVal(key)
                    return (
                      <div key={key}>
                        <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>{label}</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input value={val} placeholder={placeholder}
                            onChange={e => setSettings(prev => {
                              const exists = prev.find(s => s.key === key)
                              return exists ? prev.map(s => s.key === key ? { ...s, value: e.target.value } : s)
                                           : [...prev, { key, value: e.target.value }]
                            })}
                            style={{ ...inp, flex: 1 }} />
                          <button onClick={() => saveSetting(key, val)} style={btn()} disabled={saving}>✓</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Contact info */}
              <div style={{ ...card, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)' }}>✉️ Contact Page Info</h3>
                <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '16px', marginTop: 0 }}>Shown on the /contact page above the form.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Contact email</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={settingVal('contact_email')} placeholder="hello@aicreatorfeed.com"
                        onChange={e => setSettings(prev => {
                          const exists = prev.find(s => s.key === 'contact_email')
                          return exists ? prev.map(s => s.key === 'contact_email' ? { ...s, value: e.target.value } : s)
                                       : [...prev, { key: 'contact_email', value: e.target.value }]
                        })}
                        style={{ ...inp, flex: 1 }} />
                      <button onClick={() => saveSetting('contact_email', settingVal('contact_email'))} style={btn()} disabled={saving}>Save</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px', fontWeight: 600 }}>Contact page intro message</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea value={settingVal('contact_message')} rows={2} placeholder="Have a question? We'd love to hear from you…"
                        onChange={e => setSettings(prev => {
                          const exists = prev.find(s => s.key === 'contact_message')
                          return exists ? prev.map(s => s.key === 'contact_message' ? { ...s, value: e.target.value } : s)
                                       : [...prev, { key: 'contact_message', value: e.target.value }]
                        })}
                        style={{ ...inp, flex: 1, resize: 'none' as any }} />
                      <button onClick={() => saveSetting('contact_message', settingVal('contact_message'))} style={btn()} disabled={saving}>Save</button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <a href="/contact" target="_blank" rel="noopener" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    → Preview contact page ↗
                  </a>
                </div>
              </div>

              {/* Favicon */}
              <div style={{ ...card, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)' }}>🌐 Favicon</h3>
                <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '16px', marginTop: 0 }}>The small icon shown in browser tabs and bookmarks.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#333', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {settingVal('favicon_url')
                        ? <img src={settingVal('favicon_url')} alt="favicon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
                        : <span style={{ fontSize: '28px' }}>✦</span>
                      }
                    </div>
                    <span style={{ fontSize: '10px', color: settingVal('favicon_url') ? '#4ade80' : '#9a8f7a', fontWeight: 600 }}>
                      {settingVal('favicon_url') ? '✓ Set' : 'Default'}
                    </span>
                  </div>

                  {/* Input */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>
                      Favicon URL <span style={{ color: '#555' }}>(.ico, .png, or .svg — 32×32px recommended)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={settingVal('favicon_url')}
                        onChange={e => setSettings(prev => {
                          const exists = prev.find(s => s.key === 'favicon_url')
                          return exists
                            ? prev.map(s => s.key === 'favicon_url' ? { ...s, value: e.target.value } : s)
                            : [...prev, { key: 'favicon_url', value: e.target.value }]
                        })}
                        placeholder="https://yourdomain.com/favicon.png"
                        style={{ ...inp, flex: 1 }}
                      />
                      <button onClick={() => saveSetting('favicon_url', settingVal('favicon_url'))} style={btn()} disabled={saving}>
                        Save
                      </button>
                    </div>

                    <div style={{ marginTop: '12px', padding: '12px', background: '#222', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>HOW TO ADD A FAVICON</div>
                      <ol style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
                        <li>Create a 32×32 or 64×64px icon (PNG works great)</li>
                        <li>Upload it to <strong style={{ color: 'var(--color-cream)' }}>Cloudinary</strong> (same account you use for posts)</li>
                        <li>Copy the Cloudinary URL and paste above</li>
                        <li>Click Save — takes effect on next page load</li>
                      </ol>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#555' }}>
                        Alternative: drop favicon.ico into your /public folder and redeploy on Vercel
                      </div>
                    </div>
                  </div>
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
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-cream)', marginBottom: '3px' }}>{flag.name}</div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a' }}>{flag.description}</div>
                  </div>
                  <button onClick={() => toggleFlag(flag.name, !flag.enabled)} style={{
                    width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: flag.enabled ? 'var(--color-primary)' : '#333', position: 'relative', transition: 'background 0.2s',
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
                    borderColor: selectedTicket?.id === ticket.id ? 'color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'rgba(255,255,255,0.08)',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 30%, transparent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = selectedTicket?.id === ticket.id ? 'color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'rgba(255,255,255,0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-cream)', marginBottom: '3px' }}>{ticket.subject}</div>
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
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '4px' }}>{selectedTicket.subject}</div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '12px' }}>From: {selectedTicket.user_email}</div>
                    <div style={{ background: '#222', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--color-beige)', lineHeight: 1.6, marginBottom: '12px' }}>
                      {selectedTicket.message}
                    </div>
                    {selectedTicket.admin_reply && (
                      <div style={{ background: 'color-mix(in srgb, var(--color-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>YOUR REPLY</div>
                        <p style={{ fontSize: '13px', color: 'var(--color-beige)', margin: 0, lineHeight: 1.6 }}>{selectedTicket.admin_reply}</p>
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

        {/* ── TUTORIALS ────────────────────────────────────────────────── */}
        {tab === 'tutorials' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900 }}>Tutorials</h1>
              <button onClick={() => setShowTutorialForm(!showTutorialForm)} style={btn()}>+ Add tutorial</button>
            </div>

            {/* Add tutorial form */}
            {showTutorialForm && (
              <div style={{ ...card, marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>🎬 New Tutorial</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Title *</label>
                    <input value={tutorialForm.title} onChange={e => setTutorialForm(p => ({ ...p, title: e.target.value }))} placeholder="Mastering Midjourney v7..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>YouTube Video ID * (e.g. dQw4w9WgXcQ)</label>
                    <input value={tutorialForm.youtube_video_id} onChange={e => setTutorialForm(p => ({ ...p, youtube_video_id: e.target.value.trim() }))} placeholder="dQw4w9WgXcQ" style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Duration (minutes)</label>
                    <input type="number" value={tutorialForm.duration_minutes} onChange={e => setTutorialForm(p => ({ ...p, duration_minutes: e.target.value }))} placeholder="25" style={inp} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Description</label>
                    <textarea value={tutorialForm.description} onChange={e => setTutorialForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What will viewers learn..." style={{ ...inp, resize: 'none' as any }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Tags (comma separated)</label>
                    <input value={tutorialForm.tags} onChange={e => setTutorialForm(p => ({ ...p, tags: e.target.value }))} placeholder="Midjourney, prompting, workflow" style={inp} />
                  </div>
                </div>
                {tutorialForm.youtube_video_id && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={`https://img.youtube.com/vi/${tutorialForm.youtube_video_id}/hqdefault.jpg`} alt="Preview" style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '12px', color: '#9a8f7a' }}>Thumbnail preview</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowTutorialForm(false)} style={btn(false)}>Cancel</button>
                  <button onClick={publishTutorial} disabled={tutorialLoading} style={btn()}>
                    {tutorialLoading ? 'Adding...' : 'Add tutorial'}
                  </button>
                </div>
              </div>
            )}

            {/* Tutorials list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tutorials.length === 0 && (
                <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#9a8f7a' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                  No tutorials yet. Add your first one above!
                </div>
              )}
              {tutorials.map((t: any) => (
                <div key={t.id} style={{ ...card, display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img src={t.thumbnail_url || `https://img.youtube.com/vi/${t.youtube_video_id}/hqdefault.jpg`} alt={t.title} style={{ width: '100px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-cream)', marginBottom: '3px' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: '#9a8f7a', display: 'flex', gap: '12px' }}>
                      <span>⏱ {t.duration_minutes}m</span>
                      <span>👁 {(t.views_count || 0).toLocaleString()}</span>
                      {t.tags?.length > 0 && <span>{t.tags.slice(0, 3).join(', ')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <a href={`https://youtube.com/watch?v=${t.youtube_video_id}`} target="_blank" rel="noopener" style={{ ...btn(false), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '6px 10px' }}>▶ View</a>
                    <button onClick={() => deleteTutorial(t.id)} style={{ ...btn(false), color: '#ff8080', background: 'rgba(255,80,80,0.08)', padding: '6px 10px' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
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
              <div style={{ ...card, marginBottom: '20px', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
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
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Summary * <span style={{ color: '#555', fontWeight: 400 }}>(shown on the news card — keep it to 1-2 sentences)</span></label>
                    <textarea value={newsForm.summary} onChange={e => setNewsForm(p => ({ ...p, summary: e.target.value }))} placeholder="Brief summary shown in the news feed card..." rows={2} style={{ ...inp, resize: 'none' as any }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '8px' }}>
                      Full article content <span style={{ color: '#555', fontWeight: 400 }}>(optional — shown when user clicks "Read more")</span>
                    </label>
                    <RichTextEditor
                      value={newsForm.content}
                      onChange={v => setNewsForm(p => ({ ...p, content: v }))}
                      placeholder="Write the full article here... Use the toolbar for H2, H3, bold, italic, bullet lists, numbered lists, links, and blockquotes."
                      minHeight={220}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Source URL *</label>
                    <input value={newsForm.source_url} onChange={e => setNewsForm(p => ({ ...p, source_url: e.target.value }))} placeholder="https://..." style={inp} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                      🖼 Thumbnail / Banner <span style={{ color: '#555', fontWeight: 400 }}>(optional — shown on the news card and article header)</span>
                    </label>

                    {/* Preview */}
                    {newsForm.image_url ? (
                      <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={newsForm.image_url} alt="Thumbnail preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)', display: 'flex', alignItems: 'flex-end', padding: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>✓ Thumbnail set</span>
                        </div>
                        <button
                          onClick={() => setNewsForm(p => ({ ...p, image_url: '' }))}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >✕ Remove</button>
                      </div>
                    ) : (
                      /* Upload drop zone */
                      <label style={{ display: 'block', cursor: 'pointer' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return }
                          setNewsImageUploading(true)
                          const form = new FormData()
                          form.append('file', file)
                          form.append('folder', 'news')
                          form.append('type', 'thumbnail')
                          const res = await fetch('/api/upload', { method: 'POST', body: form })
                          const data = await res.json()
                          if (data.secure_url) setNewsForm(p => ({ ...p, image_url: data.secure_url }))
                          else alert(data.error || 'Upload failed')
                          setNewsImageUploading(false)
                          e.target.value = ''
                        }} />
                        <div style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '10px', padding: '24px', textAlign: 'center', transition: 'border-color 0.15s, background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'color-mix(in srgb, var(--color-primary) 40%, transparent)'; (e.currentTarget as HTMLDivElement).style.background = 'color-mix(in srgb, var(--color-primary) 3%, transparent)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                        >
                          {newsImageUploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '24px', height: '24px', border: '3px solid color-mix(in srgb, var(--color-primary) 30%, transparent)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                              <span style={{ fontSize: '13px', color: '#9a8f7a' }}>Uploading to Cloudinary...</span>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼</div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', margin: '0 0 4px' }}>Click to upload image</p>
                              <p style={{ fontSize: '11px', color: '#9a8f7a', margin: 0 }}>JPG, PNG, WebP — max 10MB • 16:9 recommended</p>
                            </>
                          )}
                        </div>
                      </label>
                    )}

                    {/* Or paste URL */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                      <span style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>or paste URL</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        value={newsForm.image_url}
                        onChange={e => setNewsForm(p => ({ ...p, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        style={{ ...inp, flex: 1 }}
                      />
                      {newsForm.image_url && (
                        <button onClick={() => setNewsForm(p => ({ ...p, image_url: '' }))} style={{ ...btn(false), padding: '8px 12px', fontSize: '12px' }}>Clear</button>
                      )}
                    </div>
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
                        <p style={{ margin: 0, color: 'var(--color-beige)', fontSize: '13px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.title}</p>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap' }}>{item.source_name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(item.tags || []).slice(0, 2).map((t: string) => (
                            <span key={t} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9a8f7a', whiteSpace: 'nowrap', fontSize: '12px' }}>{new Date(item.published_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={item.source_url} target="_blank" rel="noopener" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', padding: '4px 8px', borderRadius: '6px', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>View</a>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900 }}>Community</h1>
              <button onClick={() => setShowCreateSpace(true)} style={btn()}>+ Create space</button>
            </div>

            {/* Create Space modal */}
            {showCreateSpace && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Create New Space</h3>
                    <button onClick={() => setShowCreateSpace(false)} style={{ background: 'none', border: 'none', color: '#9a8f7a', cursor: 'pointer', fontSize: '20px' }}>×</button>
                  </div>

                  {/* Live preview */}
                  {createSpaceForm.display_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${createSpaceForm.cover_color}22`, border: `2px solid ${createSpaceForm.cover_color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{createSpaceForm.icon}</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)' }}>{createSpaceForm.display_name}</div>
                        <div style={{ fontSize: '12px', color: '#9a8f7a' }}>/{createSpaceForm.name || 'slug'}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Display Name *</label>
                      <input value={createSpaceForm.display_name} onChange={e => setCreateSpaceForm(p => ({ ...p, display_name: e.target.value }))} placeholder="AI Image Generation" style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>URL Slug * (letters, numbers, hyphens)</label>
                      <input value={createSpaceForm.name} onChange={e => setCreateSpaceForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ai-image-generation" style={inp} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Icon (emoji)</label>
                        <input value={createSpaceForm.icon} onChange={e => setCreateSpaceForm(p => ({ ...p, icon: e.target.value }))} placeholder="✨" style={{ ...inp }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Cover color</label>
                        <input type="color" value={createSpaceForm.cover_color} onChange={e => setCreateSpaceForm(p => ({ ...p, cover_color: e.target.value }))} style={{ ...inp, width: '60px', height: '38px', padding: '4px', cursor: 'pointer' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Description</label>
                      <textarea value={createSpaceForm.description} onChange={e => setCreateSpaceForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What is this space about..." style={{ ...inp, resize: 'none' as any }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Rules (optional)</label>
                      <textarea value={createSpaceForm.rules} onChange={e => setCreateSpaceForm(p => ({ ...p, rules: e.target.value }))} rows={2} placeholder="1. Be respectful..." style={{ ...inp, resize: 'none' as any }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => setCreateSpaceForm(p => ({ ...p, is_official: !p.is_official }))} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: createSpaceForm.is_official ? 'var(--color-primary)' : '#333', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: createSpaceForm.is_official ? '21px' : '3px', transition: 'left 0.2s' }} />
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--color-beige)' }}>Official space</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowCreateSpace(false)} style={btn(false)}>Cancel</button>
                    <button onClick={createSpace} disabled={createSpaceLoading} style={btn()}>
                      {createSpaceLoading ? 'Creating...' : 'Create space'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                      <button onClick={() => setSpaceEditForm(p => ({ ...p, is_official: !p.is_official }))} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: spaceEditForm.is_official ? 'var(--color-primary)' : '#333', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: spaceEditForm.is_official ? '21px' : '3px', transition: 'left 0.2s' }} />
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--color-beige)' }}>Official space (AiCreatorFeed badge)</span>
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
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: selectedSpace?.id === space.id ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (selectedSpace?.id !== space.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selectedSpace?.id === space.id ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent' }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${space.cover_color}22`, border: `1px solid ${space.cover_color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{space.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-cream)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {space.display_name}
                          {space.is_official && <span style={{ fontSize: '9px', color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', padding: '1px 5px', borderRadius: '999px', fontWeight: 700 }}>Official</span>}
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
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-cream)', marginBottom: '2px' }}>{selectedSpace.display_name}</div>
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
                                <p style={{ margin: 0, color: 'var(--color-beige)', fontSize: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{post.title}</p>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#9a8f7a', fontSize: '12px', whiteSpace: 'nowrap' }}>@{post.user?.username}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--color-beige)' }}>▲ {post.upvotes}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--color-beige)' }}>💬 {post.reply_count}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '12px', color: post.is_pinned ? 'var(--color-primary)' : '#555' }}>{post.is_pinned ? '📌' : '—'}</span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#9a8f7a', fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button onClick={() => pinSpacePost(post.id, post.is_pinned)} title={post.is_pinned ? 'Unpin' : 'Pin'} style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: post.is_pinned ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'rgba(255,255,255,0.06)', color: post.is_pinned ? 'var(--color-primary)' : '#9a8f7a' }}>
                                    {post.is_pinned ? 'Unpin' : '📌 Pin'}
                                  </button>
                                  <a href={`/community/${selectedSpace.name}/post/${post.id}`} target="_blank" rel="noopener" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', padding: '3px 8px', borderRadius: '5px', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>View</a>
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

        {/* ── SEO & META ───────────────────────────────────────────────── */}
        {tab === 'seo' && (
          <div style={{ animation: 'slideIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '4px' }}>SEO & Meta Tags</h1>
                <p style={{ fontSize: '13px', color: '#9a8f7a', margin: 0 }}>These settings control how AiCreatorFeed appears in search results and social shares.</p>
              </div>
              <button onClick={saveAllSeo} disabled={saving} style={btn()}>
                {saving ? 'Saving...' : '💾 Save all SEO settings'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Page title & description */}
              <div style={{ ...card, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>🔍 Search Engine (Google)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Meta Title <span style={{ color: '#555' }}>(recommended: 50–60 chars)</span></label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={seoSettings.meta_title} onChange={e => setSeoSettings(p => ({ ...p, meta_title: e.target.value }))} placeholder="AiCreatorFeed — Where AI Creators Connect" style={{ ...inp, flex: 1 }} maxLength={70} />
                      <button onClick={() => saveSeoSetting('meta_title', seoSettings.meta_title)} style={btn()} disabled={saving}>Save</button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '4px' }}>{seoSettings.meta_title.length}/70 characters</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Meta Description <span style={{ color: '#555' }}>(recommended: 150–160 chars)</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea value={seoSettings.meta_description} onChange={e => setSeoSettings(p => ({ ...p, meta_description: e.target.value }))} rows={2} placeholder="Follow AI creators, share image & video prompts, discover AI tools, news, and tutorials." style={{ ...inp, flex: 1, resize: 'none' as any }} maxLength={200} />
                      <button onClick={() => saveSeoSetting('meta_description', seoSettings.meta_description)} style={btn()} disabled={saving}>Save</button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '4px' }}>{seoSettings.meta_description.length}/200 characters</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Keywords <span style={{ color: '#555' }}>(comma separated)</span></label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={seoSettings.meta_keywords} onChange={e => setSeoSettings(p => ({ ...p, meta_keywords: e.target.value }))} placeholder="AI creators, AI prompts, Midjourney, Stable Diffusion, AI art" style={{ ...inp, flex: 1 }} />
                      <button onClick={() => saveSeoSetting('meta_keywords', seoSettings.meta_keywords)} style={btn()} disabled={saving}>Save</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Graph */}
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>📣 Open Graph (Social Sharing)</h3>
                <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '14px' }}>Controls how pages look when shared on Twitter, Facebook, Discord etc. Leave blank to use meta title/description.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>OG Title</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={seoSettings.og_title} onChange={e => setSeoSettings(p => ({ ...p, og_title: e.target.value }))} placeholder="Same as meta title..." style={{ ...inp, flex: 1 }} />
                      <button onClick={() => saveSeoSetting('og_title', seoSettings.og_title)} style={btn()} disabled={saving}>Save</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>OG Description</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea value={seoSettings.og_description} onChange={e => setSeoSettings(p => ({ ...p, og_description: e.target.value }))} rows={2} placeholder="Same as meta description..." style={{ ...inp, flex: 1, resize: 'none' as any }} />
                      <button onClick={() => saveSeoSetting('og_description', seoSettings.og_description)} style={btn()} disabled={saving}>Save</button>
                    </div>
                  </div>
                </div>

                {/* OG Image preview */}
                <div style={{ marginTop: '14px', padding: '12px', background: '#222', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '11px', color: '#9a8f7a', marginBottom: '8px', fontWeight: 600 }}>OG IMAGE PREVIEW</div>
                  <img src="/api/og" alt="OG preview" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <p style={{ fontSize: '11px', color: '#9a8f7a', marginTop: '8px', margin: '8px 0 0' }}>Auto-generated at /api/og — no upload needed.</p>
                </div>
              </div>

              {/* Favicon */}
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--color-primary)' }}>🌐 Favicon</h3>
                <p style={{ fontSize: '12px', color: '#9a8f7a', marginBottom: '16px' }}>The small icon shown in browser tabs. Paste a URL to an .ico, .png, or .svg file (32×32 recommended).</p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  {seoSettings.favicon_url ? (
                    <img src={seoSettings.favicon_url} alt="favicon" style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#333', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#333', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✦</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: seoSettings.favicon_url ? '#4ade80' : '#9a8f7a' }}>
                      {seoSettings.favicon_url ? '✓ Favicon set' : 'No favicon set — using default'}
                    </div>
                  </div>
                </div>

                <label style={{ fontSize: '12px', color: '#9a8f7a', display: 'block', marginBottom: '5px' }}>Favicon URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={seoSettings.favicon_url} onChange={e => setSeoSettings(p => ({ ...p, favicon_url: e.target.value }))} placeholder="https://yourdomain.com/favicon.ico" style={{ ...inp, flex: 1 }} />
                  <button onClick={() => saveSeoSetting('favicon_url', seoSettings.favicon_url)} style={btn()} disabled={saving}>Save</button>
                </div>

                <div style={{ marginTop: '14px', padding: '12px', background: '#222', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '6px' }}>HOW TO ADD A FAVICON</div>
                  <ol style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.7, paddingLeft: '16px', margin: 0 }}>
                    <li>Create a 32×32px or 64×64px icon (PNG or ICO)</li>
                    <li>Upload it to Cloudinary or any CDN</li>
                    <li>Paste the URL above and click Save</li>
                    <li>Add it to your Next.js layout: place favicon.ico in the /public folder — Vercel serves it automatically</li>
                  </ol>
                </div>
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
            <span style={{ color: 'var(--color-beige)' }}>{log.action}</span>
          </div>
        ))
      }
    </div>
  )
}
