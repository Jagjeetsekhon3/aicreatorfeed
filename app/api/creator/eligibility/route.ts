import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Requirements
const REQUIREMENTS = {
  account_age_days: 60,   // 2 months
  total_likes:      500,
  total_comments:   200,
  total_posts:      50,
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user from token
  const { data: { user }, error: authError } = await admin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // Get profile
  const { data: profile } = await db
    .from('profiles')
    .select('id, created_at, is_creator, creator_applied_at, creator_approved_at')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Already a creator
  if (profile.is_creator) {
    return NextResponse.json({ is_creator: true, eligible: true, requirements: null, application: null })
  }

  // Calculate account age
  const accountAgeMs = Date.now() - new Date(profile.created_at).getTime()
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24))

  // Count posts
  const { count: totalPosts } = await db
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Count total likes received on all user posts
  const { data: likesData } = await db
    .from('posts')
    .select('likes_count')
    .eq('user_id', user.id)

  const totalLikes = (likesData || []).reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0)

  // Count total comments received
  const { data: commentsData } = await db
    .from('posts')
    .select('comments_count')
    .eq('user_id', user.id)

  const totalComments = (commentsData || []).reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0)

  // Check existing application
  const { data: application } = await db
    .from('creator_applications')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Build requirements status
  const requirements = {
    account_age: {
      label: 'Account Age',
      current: accountAgeDays,
      required: REQUIREMENTS.account_age_days,
      unit: 'days',
      met: accountAgeDays >= REQUIREMENTS.account_age_days,
    },
    total_likes: {
      label: 'Post Likes Received',
      current: totalLikes,
      required: REQUIREMENTS.total_likes,
      unit: 'likes',
      met: totalLikes >= REQUIREMENTS.total_likes,
    },
    total_comments: {
      label: 'Comments Received',
      current: totalComments,
      required: REQUIREMENTS.total_comments,
      unit: 'comments',
      met: totalComments >= REQUIREMENTS.total_comments,
    },
    total_posts: {
      label: 'Posts Created',
      current: totalPosts || 0,
      required: REQUIREMENTS.total_posts,
      unit: 'posts',
      met: (totalPosts || 0) >= REQUIREMENTS.total_posts,
    },
  }

  const eligible = Object.values(requirements).every(r => r.met)

  return NextResponse.json({
    is_creator: false,
    eligible,
    requirements,
    stats: { accountAgeDays, totalLikes, totalComments, totalPosts: totalPosts || 0 },
    application: application || null,
  })
}

// POST — submit application
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await admin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // Re-verify eligibility server-side before accepting application
  const { data: profile } = await db.from('profiles').select('id, created_at, is_creator').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.is_creator) return NextResponse.json({ error: 'Already a creator' }, { status: 400 })

  const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

  const { count: totalPosts } = await db.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  const { data: likesData } = await db.from('posts').select('likes_count').eq('user_id', user.id)
  const totalLikes = (likesData || []).reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0)
  const { data: commentsData } = await db.from('posts').select('comments_count').eq('user_id', user.id)
  const totalComments = (commentsData || []).reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0)

  const eligible =
    accountAgeDays >= REQUIREMENTS.account_age_days &&
    totalLikes     >= REQUIREMENTS.total_likes &&
    totalComments  >= REQUIREMENTS.total_comments &&
    (totalPosts || 0) >= REQUIREMENTS.total_posts

  if (!eligible) return NextResponse.json({ error: 'Requirements not met' }, { status: 400 })

  // Check for existing pending/rejected application
  const { data: existing } = await db.from('creator_applications').select('id, status, reviewed_at').eq('user_id', user.id).single()

  if (existing) {
    if (existing.status === 'pending') return NextResponse.json({ error: 'Application already pending' }, { status: 400 })
    // Rejected — can reapply after 30 days
    if (existing.status === 'rejected') {
      const daysSinceReview = existing.reviewed_at
        ? Math.floor((Date.now() - new Date(existing.reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      if (daysSinceReview < 30) return NextResponse.json({ error: `Can reapply in ${30 - daysSinceReview} days` }, { status: 400 })
    }
  }

  // Auto-approve (since requirements are verified server-side)
  const { error: upsertErr } = await db.from('creator_applications').upsert({
    user_id:          user.id,
    account_age_days: accountAgeDays,
    total_likes:      totalLikes,
    total_comments:   totalComments,
    total_posts:      totalPosts || 0,
    status:           'approved',
    reviewed_at:      new Date().toISOString(),
    reviewed_by:      'auto',
    applied_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (upsertErr) return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })

  // Grant creator status
  await db.from('profiles').update({
    is_creator:           true,
    creator_applied_at:   new Date().toISOString(),
    creator_approved_at:  new Date().toISOString(),
  }).eq('id', user.id)

  // Send notification
  await db.from('notifications').insert({
    user_id:   user.id,
    type:      'creator_approved',
    message:   '🎉 Congratulations! You are now a Creator. You can now create paid tutorials, sell prompt packs, and receive tips.',
    is_read:   false,
  }).catch(() => {}) // don't fail if notifications table schema differs

  return NextResponse.json({ success: true, message: 'Congratulations! You are now a Creator.' })
}
