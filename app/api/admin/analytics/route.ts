import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function checkAdmin() {
  const token = cookies().get('acf_admin_token')?.value
  return token === `admin_${process.env.ADMIN_PASSWORD}`
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString()
}

export async function GET() {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  const [
    // Core counts
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: totalLikes },
    { count: totalBookmarks },
    { count: totalFollows },
    { count: openTickets },
    { count: totalSpaces },
    { count: totalTutorials },
    { count: totalNews },
    // This week
    { count: newUsersWeek },
    { count: newPostsWeek },
    { count: newCommentsWeek },
    { count: newLikesWeek },
    // Today
    { count: newUsersToday },
    { count: newPostsToday },
    { count: newCommentsToday },
    { count: newLikesToday },
    { count: newFollowsToday },
    // Yesterday (for delta)
    { count: newUsersYesterday },
    { count: newPostsYesterday },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('posts').select('*', { count: 'exact', head: true }),
    db.from('comments').select('*', { count: 'exact', head: true }),
    db.from('likes').select('*', { count: 'exact', head: true }),
    db.from('bookmarks').select('*', { count: 'exact', head: true }),
    db.from('follows').select('*', { count: 'exact', head: true }),
    db.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('spaces').select('*', { count: 'exact', head: true }),
    db.from('tutorials').select('*', { count: 'exact', head: true }),
    db.from('news_items').select('*', { count: 'exact', head: true }),
    // This week
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    db.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    db.from('likes').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    // Today
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(1)),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(1)),
    db.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(1)),
    db.from('likes').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(1)),
    db.from('follows').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(1)),
    // Yesterday
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(2)).lt('created_at', daysAgo(1)),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(2)).lt('created_at', daysAgo(1)),
  ])

  // 30-day growth (daily user signups)
  const { data: userGrowth30 } = await db
    .from('profiles')
    .select('created_at')
    .gte('created_at', daysAgo(30))
    .order('created_at', { ascending: true })

  // 30-day posts activity
  const { data: postActivity30 } = await db
    .from('posts')
    .select('created_at')
    .gte('created_at', daysAgo(30))
    .order('created_at', { ascending: true })

  // Post types breakdown
  const { data: postTypes } = await db
    .from('posts')
    .select('media_type')

  // Top AI tools
  const { data: aiToolData } = await db
    .from('posts')
    .select('ai_tool')
    .not('ai_tool', 'is', null)

  // Top creators (by likes this week)
  const { data: topCreators } = await db
    .from('profiles')
    .select('id, username, full_name, avatar_url, followers_count, posts_count, is_verified, is_official')
    .order('followers_count', { ascending: false })
    .limit(10)

  // Top posts (most liked)
  const { data: topPosts } = await db
    .from('posts')
    .select('id, caption, prompt_text, media_type, image_url, ai_tool, likes_count, comments_count, created_at, user:profiles!posts_user_id_fkey(username, full_name)')
    .order('likes_count', { ascending: false })
    .limit(5)

  // Tags leaderboard
  const { data: tagData } = await db
    .from('posts')
    .select('tags')
    .not('tags', 'eq', '{}')
    .limit(500)

  // Countries breakdown
  const { data: countryData } = await db
    .from('profiles')
    .select('country, country_code')
    .not('country', 'is', null)

  // Posting activity by hour (for heatmap)
  const { data: hourData } = await db
    .from('posts')
    .select('created_at')
    .gte('created_at', daysAgo(30))

  // Active spaces (by post count)
  const { data: topSpaces } = await db
    .from('spaces')
    .select('id, name, display_name, icon, member_count, post_count')
    .order('post_count', { ascending: false })
    .limit(5)

  // ── Process ────────────────────────────────────────────────────────────────

  // Daily buckets for 30 days
  function bucketByDay(rows: any[], dateField = 'created_at') {
    const buckets: Record<string, number> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    ;(rows || []).forEach(r => {
      const day = r[dateField]?.slice(0, 10)
      if (day && buckets[day] !== undefined) buckets[day]++
    })
    return buckets
  }

  const userDailyBuckets = bucketByDay(userGrowth30 || [])
  const postDailyBuckets = bucketByDay(postActivity30 || [])

  // Running total for cumulative users
  let runningTotal = (totalUsers || 0) - (userGrowth30?.length || 0)
  const userCumulative = Object.entries(userDailyBuckets).map(([date, count]) => {
    runningTotal += count
    return { date, count: runningTotal }
  })

  // Post types
  const typeCounts: Record<string, number> = { image: 0, video: 0, text: 0 }
  ;(postTypes || []).forEach((p: any) => { if (typeCounts[p.media_type] !== undefined) typeCounts[p.media_type]++ })

  // AI tools
  const toolCounts: Record<string, number> = {}
  ;(aiToolData || []).forEach((p: any) => {
    if (p.ai_tool) toolCounts[p.ai_tool] = (toolCounts[p.ai_tool] || 0) + 1
  })
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Tags
  const tagCounts: Record<string, number> = {}
  ;(tagData || []).forEach((p: any) => {
    ;(p.tags || []).forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1 })
  })
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Countries
  const countryCounts: Record<string, { name: string; code: string; count: number }> = {}
  ;(countryData || []).forEach((p: any) => {
    if (!p.country) return
    const key = p.country_code || p.country
    if (!countryCounts[key]) countryCounts[key] = { name: p.country, code: p.country_code || '', count: 0 }
    countryCounts[key].count++
  })
  const topCountries = Object.values(countryCounts).sort((a, b) => b.count - a.count).slice(0, 15)

  // Heatmap: hour × weekday
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  ;(hourData || []).forEach((p: any) => {
    const d = new Date(p.created_at)
    const day = (d.getDay() + 6) % 7 // 0 = Mon
    const hour = d.getHours()
    heatmap[day][hour]++
  })

  // Engagement rate = likes / (posts * avg_followers) — approximate
  const engagementRate = totalPosts && totalLikes
    ? Math.round((totalLikes / Math.max(totalPosts, 1)) * 10) / 10
    : 0

  return NextResponse.json({
    // KPIs
    totalUsers: totalUsers || 0,
    totalPosts: totalPosts || 0,
    totalComments: totalComments || 0,
    totalLikes: totalLikes || 0,
    totalBookmarks: totalBookmarks || 0,
    totalFollows: totalFollows || 0,
    openTickets: openTickets || 0,
    totalSpaces: totalSpaces || 0,
    totalTutorials: totalTutorials || 0,
    totalNews: totalNews || 0,
    // Deltas
    newUsersWeek: newUsersWeek || 0,
    newPostsWeek: newPostsWeek || 0,
    newCommentsWeek: newCommentsWeek || 0,
    newLikesWeek: newLikesWeek || 0,
    newUsersToday: newUsersToday || 0,
    newPostsToday: newPostsToday || 0,
    newCommentsToday: newCommentsToday || 0,
    newLikesToday: newLikesToday || 0,
    newFollowsToday: newFollowsToday || 0,
    newUsersYesterday: newUsersYesterday || 0,
    newPostsYesterday: newPostsYesterday || 0,
    // Computed
    engagementRate,
    // Charts
    userCumulative,
    postDailyBuckets: Object.entries(postDailyBuckets).map(([date, count]) => ({ date, count })),
    postTypes: typeCounts,
    topTools,
    topTags,
    topCountries,
    heatmap,
    // Tables
    topCreators: topCreators || [],
    topPosts: topPosts || [],
    topSpaces: topSpaces || [],
  })
}
