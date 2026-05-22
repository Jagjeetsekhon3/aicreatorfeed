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
- bookmarks ← NEW — run supabase-bookmarks-schema.sql

## site_settings keys used
- accent_color, bg_color, text_primary, site_name, tagline
- maintenance_mode, allow_signups, allow_posts, allow_comments, require_approval
- meta_title, meta_description, meta_keywords
- og_title, og_description
- favicon_url

## Features Built ✅
- Auth: signup/login (email OR username), email confirmation, password reset
- Feed: followers-only + official posts, filters, follow suggestions, bookmark state
- Posts: text/image/video(YouTube inline)/AI prompt, likes, inline comments, edit/delete
- Post actions: like, comment, copy link (share), bookmark/save ← NEW
- Explore: search, sort trending/top/latest, tool filters, tag filters
- Search: /search page, live results, covers users/posts/spaces/news/tutorials/tags
- Profile: followers/following modal on click, bio, links, verified badge, 3-col grid
- Follow system: /api/follow route with exact count recalculation
- Settings: 3 tabs (profile/account/password), avatar upload
- DMs: message requests, real-time chat, inbox with unread counts
- Community: spaces listing, space page, post+replies, upvotes, create space
- AI News: curated feed, tag filters, featured story, admin manages
- Notifications: follow/like/comment, bell with unread badge, real-time
- Admin panel: users(verify/ban), posts, news, tutorials, community+create space, settings, SEO, features, tickets, logs
- Verified badges: orange checkmark (verified) / filled circle (official)
- Post detail page: edit/delete menu for owner (3-dot ⋯ menu)
- Tutorials: live Supabase data, search, tag filters, featured latest
- Followers/Following modal on profile
- SEO: full Open Graph + Twitter cards, dynamic per profile/post, admin-managed
- Favicon: dynamic from site_settings.favicon_url
- Bookmarks/Saved posts: save any post, /saved page, 🔖 icon in PostCard ← NEW
- Homepage: live stats from Supabase, trending posts grid, bottom CTA ← NEW
- Copy link button on every PostCard (shares /post/[id] URL) ← NEW

## Files changed in last session
- app/page.tsx (REWRITTEN — live stats + trending posts preview)
- app/api/bookmarks/route.ts (NEW — GET list/check, POST toggle)
- app/saved/page.tsx (NEW — bookmarked posts page)
- app/saved/layout.tsx (NEW — metadata)
- components/feed/PostCard.tsx (UPDATED — bookmark + copy link buttons wired up)
- app/feed/page.tsx (UPDATED — bookmarkedIds state, passes initialBookmarked)
- components/layout/Navbar.tsx (UPDATED — Saved link in burger menu)
- supabase-bookmarks-schema.sql (NEW — run this in Supabase!)

## ⚠️ ACTION REQUIRED
1. Run supabase-bookmarks-schema.sql in Supabase SQL editor (creates bookmarks table)
2. Run supabase-notifications-schema.sql if not done yet

## Pending / TODO
- [ ] Connect domain aicreatorfeed.com in Vercel → Settings → Domains
- [ ] Upload favicon.ico to /public folder (or set URL in Admin → SEO & Meta)
- [ ] Weekly Challenges (Community Phase 2)
- [ ] Q&A threads (Community Phase 3)
- [ ] Paid verification subscription flow
- [ ] Email notifications (optional)
- [ ] Bookmark button in Explore page ExploreCard (currently only on PostCard/Feed)
- [ ] Profile page — "Saved" tab (own profile only)

## Key Patterns (IMPORTANT for next session)
1. ALL API routes use Bearer token auth — never cookies
2. Use getSession() not getUser() — getUser() hangs on Vercel
3. No .catch() on .rpc() calls — TypeScript error
4. No custom exports from route.ts files — Next.js only allows GET/POST/etc
5. All styling is pure inline CSS style={{}} — no Tailwind
6. Admin uses service role key to bypass RLS
7. Follow counts use exact COUNT query, not triggers
8. All 'use client' pages use per-route layout.tsx for metadata (server component)
9. site_settings table stores all SEO/meta/favicon values as key-value pairs
10. Homepage (app/page.tsx) is a server component — uses async/await directly

## Project location on Claude's machine
/home/claude/nexusai/
