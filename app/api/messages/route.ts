import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: { user } } = await admin.auth.getUser(token)
    if (user) return user
  }
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

function adminClient() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Ensure consistent user ordering for conversation lookup
function orderedUsers(a: string, b: string) {
  return a < b ? { user1_id: a, user2_id: b } : { user1_id: b, user2_id: a }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const admin = adminClient()

  // Get all conversations (inbox)
  if (type === 'inbox') {
    const { data } = await admin
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, username, full_name, avatar_url),
        user2:profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    return NextResponse.json({ conversations: data || [] })
  }

  // Get messages in a conversation
  if (type === 'messages') {
    const conv_id = searchParams.get('conv_id')
    if (!conv_id) return NextResponse.json({ error: 'conv_id required' }, { status: 400 })

    // Verify user is in this conversation
    const { data: conv } = await admin.from('conversations').select('user1_id, user2_id, status')
      .eq('id', conv_id).single()
    if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data } = await admin.from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)')
      .eq('conversation_id', conv_id)
      .order('created_at', { ascending: true })

    // Mark as read
    await admin.from('messages').update({ read: true })
      .eq('conversation_id', conv_id).neq('sender_id', user.id)

    // Reset unread count for this user
    const isUser1 = conv.user1_id === user.id
    await admin.from('conversations').update(
      isUser1 ? { user1_unread: 0 } : { user2_unread: 0 }
    ).eq('id', conv_id)

    return NextResponse.json({ messages: data || [], conversation: conv })
  }

  // Get or check conversation with a specific user
  if (type === 'conversation') {
    const other_id = searchParams.get('user_id')
    if (!other_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    const { user1_id, user2_id } = orderedUsers(user.id, other_id)
    const { data } = await admin.from('conversations')
      .select(`*, user1:profiles!conversations_user1_id_fkey(id, username, full_name, avatar_url), user2:profiles!conversations_user2_id_fkey(id, username, full_name, avatar_url)`)
      .eq('user1_id', user1_id).eq('user2_id', user2_id).maybeSingle()
    return NextResponse.json({ conversation: data })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const admin = adminClient()
  const body = await req.json()

  // Start a conversation (sends first message as request)
  if (action === 'start') {
    const { other_user_id, message } = body
    if (!other_user_id || !message?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { user1_id, user2_id } = orderedUsers(user.id, other_user_id)

    // Check if conversation already exists
    let { data: existing } = await admin.from('conversations')
      .select('*').eq('user1_id', user1_id).eq('user2_id', user2_id).maybeSingle()

    let conv_id: string

    if (existing) {
      conv_id = existing.id
    } else {
      // Check if they follow each other
      const { data: follow } = await admin.from('follows')
        .select('follower_id').eq('follower_id', user.id).eq('following_id', other_user_id).maybeSingle()

      const { data: followBack } = await admin.from('follows')
        .select('follower_id').eq('follower_id', other_user_id).eq('following_id', user.id).maybeSingle()

      // Followers can chat directly, others need request accepted
      const status = (follow && followBack) ? 'accepted' : 'pending'

      const { data: newConv } = await admin.from('conversations').insert({
        user1_id, user2_id, status,
        requested_by: user.id,
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
      }).select().single()
      conv_id = newConv!.id
    }

    // Send message
    await admin.from('messages').insert({
      conversation_id: conv_id,
      sender_id: user.id,
      content: message.trim(),
    })

    // Update last message + increment unread for recipient
    const { data: conv } = await admin.from('conversations').select('user1_id, user2_id, user1_unread, user2_unread').eq('id', conv_id).single()
    if (conv) {
      const isUser1 = conv.user1_id === user.id
      await admin.from('conversations').update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
        ...(isUser1 ? { user2_unread: (conv.user2_unread || 0) + 1 } : { user1_unread: (conv.user1_unread || 0) + 1 }),
      }).eq('id', conv_id)
    }

    return NextResponse.json({ conversation_id: conv_id })
  }

  // Send message in existing conversation
  if (action === 'send') {
    const { conv_id, content } = body
    if (!conv_id || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Verify access + accepted status
    const { data: conv } = await admin.from('conversations')
      .select('user1_id, user2_id, status, user1_unread, user2_unread').eq('id', conv_id).single()
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (conv.user1_id !== user.id && conv.user2_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (conv.status !== 'accepted') return NextResponse.json({ error: 'Request not accepted yet' }, { status: 403 })

    const { data: msg } = await admin.from('messages').insert({
      conversation_id: conv_id, sender_id: user.id, content: content.trim(),
    }).select('*, sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)').single()

    const isUser1 = conv.user1_id === user.id
    await admin.from('conversations').update({
      last_message: content.trim(),
      last_message_at: new Date().toISOString(),
      ...(isUser1 ? { user2_unread: (conv.user2_unread || 0) + 1 } : { user1_unread: (conv.user1_unread || 0) + 1 }),
    }).eq('id', conv_id)

    return NextResponse.json({ message: msg })
  }

  // Accept message request
  if (action === 'accept') {
    const { conv_id } = body
    const { data: conv } = await admin.from('conversations').select('user1_id, user2_id, requested_by').eq('id', conv_id).single()
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (conv.user1_id !== user.id && conv.user2_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (conv.requested_by === user.id) return NextResponse.json({ error: 'Cannot accept own request' }, { status: 400 })
    await admin.from('conversations').update({ status: 'accepted' }).eq('id', conv_id)
    return NextResponse.json({ success: true })
  }

  // Decline / delete conversation
  if (action === 'decline') {
    const { conv_id } = body
    await admin.from('conversations').delete().eq('id', conv_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
