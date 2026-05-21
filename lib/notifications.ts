import { createClient as createAdmin } from '@supabase/supabase-js'

export async function createNotification({
  user_id, actor_id, type, post_id, comment_id, message
}: {
  user_id: string; actor_id: string; type: string;
  post_id?: string; comment_id?: string; message?: string
}) {
  if (user_id === actor_id) return
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Avoid duplicates within 1 hour
  if (post_id) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existing } = await admin.from('notifications')
      .select('id').eq('user_id', user_id).eq('actor_id', actor_id)
      .eq('type', type).eq('post_id', post_id).gte('created_at', oneHourAgo)
      .maybeSingle()
    if (existing) return
  }

  await admin.from('notifications').insert({
    user_id, actor_id, type,
    post_id: post_id || null,
    comment_id: comment_id || null,
    message: message || null,
  })
}
