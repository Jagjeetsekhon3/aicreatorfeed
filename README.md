# NexusAI — AI Community Platform

A community platform for AI enthusiasts to share prompts, follow creators, read AI news, and watch tutorials.

## Tech Stack

| Layer     | Tool              | Purpose                              |
|-----------|-------------------|--------------------------------------|
| Frontend  | Next.js 14 (App)  | Pages, routing, server components    |
| Database  | Supabase          | PostgreSQL + auth + real-time        |
| Images    | Cloudinary        | AI image storage, CDN, auto-resize   |
| Videos    | YouTube           | Tutorial videos, free unlimited      |
| Hosting   | Vercel            | Deploy, CDN, previews                |
| Styling   | Tailwind CSS      | Utility-first styling                |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd nexusai
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy your URL and anon key
4. Go to **Storage** → create a bucket called `avatars` (public)

### 3. Set up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Go to **Dashboard** → copy Cloud Name, API Key, API Secret

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
nexusai/
├── app/
│   ├── api/
│   │   └── upload/route.ts      ← Cloudinary upload endpoint
│   ├── feed/page.tsx            ← Main prompt feed
│   ├── tutorials/page.tsx       ← YouTube tutorials
│   ├── post/new/page.tsx        ← Create new post
│   ├── auth/                    ← Login / signup
│   └── page.tsx                 ← Landing page
├── components/
│   ├── layout/Navbar.tsx
│   ├── feed/PostCard.tsx        ← Post with like/comment/copy
│   └── ui/ImageUpload.tsx       ← Drag & drop → Cloudinary
├── lib/
│   ├── supabase/client.ts       ← Browser Supabase client
│   ├── supabase/server.ts       ← Server Supabase client
│   ├── cloudinary.ts            ← Upload helpers
│   └── youtube.ts               ← Embed URL helpers
├── types/index.ts               ← All TypeScript types
└── supabase-schema.sql          ← Full DB schema + RLS policies
```

---

## How Media Storage Works

| Type              | Service          | What's in DB          |
|-------------------|------------------|-----------------------|
| Profile photos    | Supabase Storage | `profiles.avatar_url` |
| Post images       | Cloudinary CDN   | `posts.image_url`     |
| Tutorial videos   | YouTube          | `tutorials.youtube_video_id` |
| User video posts  | YouTube link     | `posts.video_url`     |

Images are automatically resized and converted to WebP by Cloudinary.
Videos use YouTube's free unlimited hosting and global CDN.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same environment variables in Vercel Dashboard → Settings → Environment Variables.

---

## Next Steps

- [ ] Connect auth pages (login/signup with Supabase Auth)
- [ ] Add real Supabase queries to feed and tutorials pages
- [ ] Build profile pages (`/profile/[username]`)
- [ ] Add news aggregation (RSS feeds or manual curation)
- [ ] Add notifications (Supabase real-time)
- [ ] Build mobile app (React Native + same Supabase backend)
