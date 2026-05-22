# AiCreatorFeed — Project Status
Last updated: May 22, 2026

## Stack
- Next.js 14, Supabase, Cloudinary, Vercel
- Pure inline CSS (no Tailwind)
- Live at: aicreatorfeed.vercel.app / aicreatorfeed.com

## Brand
- Colors: #222222 bg, #FF6D1F orange, #FAF3E1 cream
- Logo: SVG "A" + dot (V8)
- Admin URL: /acfjagjeetadmin

## ENV VARS (set in Vercel)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL
- ADMIN_SECRET_PATH=acfjagjeetadmin
- ADMIN_PASSWORD
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

## Database Tables (all in Supabase)
- profiles (+ is_verified, is_official, twitter, instagram, youtube)
- posts, likes, comments, follows
- tutorials, news_items (+ image_url)
- site_settings, feature_flags, support_tickets, admin_logs
- conversations, messages (DMs)
- spaces, space_members, space_posts, space_replies, space_post_votes, space_reply_votes
- notifications ← run supabase-notifications-schema.sql if not done

## Features Built ✅
- Auth: signup/login (email OR username), email confirmation, password reset
- Feed: followers-only + official posts, filters, follow suggestions
- Posts: text/image/video(YouTube inline)/AI prompt, likes, inline comments, edit/delete
- Explore: search, sort trending/top/latest, tool filters, tag filters
- Search: /search page, live results, covers users/posts/spaces/news/tutorials/tags
- Profile: followers/following counts, bio, links, verified badge, 3-col grid
- Follow system: /api/follow route with exact count recalculation
- Settings: 3 tabs (profile/account/password), avatar upload
- DMs: message requests, real-time chat, inbox with unread counts
- Community: spaces listing, space page, post+replies, upvotes, create space
- AI News: curated feed, tag filters, featured story, admin manages
- Notifications: follow/like/comment, bell with unread badge, real-time
- Admin panel: users(verify/ban), posts, news, community, settings, feature flags, tickets, logs
- Verified badges: orange checkmark (verified) / filled circle (official)
- Burger menu: all nav links in dropdown
- Navbar: desktop + mobile bottom nav + mobile top bar
- Tutorials page: live Supabase data, search, tag filters, featured latest ← NEW
- Followers/Following modal: click counts on profile to see full list ← NEW
- SEO: full Open Graph + Twitter cards on all pages, dynamic OG per profile/post ← NEW
- Dynamic OG image: /api/og route generates SVG-based share images ← NEW

## Files changed in last session
- app/api/tutorials/route.ts (NEW — GET/POST/DELETE)
- app/api/og/route.ts (NEW — dynamic OG image SVG)
- app/tutorials/page.tsx (REWRITTEN — live Supabase data, search, tag filters)
- app/api/follow/route.ts (UPDATED — added type=followers/following list query)
- app/profile/[username]/page.tsx (UPDATED — followers/following modal on count click)
- app/layout.tsx (UPDATED — full SEO metadata, OG, Twitter cards)
- app/profile/[username]/layout.tsx (NEW — dynamic OG per profile)
- app/post/[id]/layout.tsx (NEW — dynamic OG per post)
- app/feed/layout.tsx (NEW)
- app/explore/layout.tsx (NEW)
- app/news/layout.tsx (NEW)
- app/tutorials/layout.tsx (NEW)
- app/community/layout.tsx (NEW)
- app/search/layout.tsx (NEW)

## Pending / TODO
- [ ] Run supabase-notifications-schema.sql in Supabase (if not done)
- [ ] Connect domain aicreatorfeed.com in Vercel → Settings → Domains
- [ ] Add tutorials via Admin panel (currently empty — hardcoded data removed)
- [ ] Weekly Challenges (Community Phase 2)
- [ ] Q&A threads (Community Phase 3)
- [ ] Paid verification subscription flow
- [ ] Email notifications (optional)
- [ ] Post page /post/[id] — add Suspense boundary (low priority, works fine)
- [ ] Admin panel: add Tutorials tab to manage tutorials from dashboard

## Key Patterns (IMPORTANT for next session)
1. ALL API routes use Bearer token auth — never cookies
2. Use getSession() not getUser() — getUser() hangs on Vercel
3. No .catch() on .rpc() calls — TypeScript error
4. No custom exports from route.ts files — Next.js only allows GET/POST/etc
5. All styling is pure inline CSS style={{}} — no Tailwind
6. Admin uses service role key to bypass RLS
7. Follow counts use exact COUNT query, not triggers
8. All 'use client' pages use per-route layout.tsx for metadata (server component)

## Project location on Claude's machine
/home/claude/nexusai/
