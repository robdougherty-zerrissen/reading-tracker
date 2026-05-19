# Reading Journal

A personal reading tracker built with Next.js and Supabase. Tracks current books with progress bars, per-book reading schedules with persistent checkboxes, and a completed books archive.

## Stack
- **Next.js** (Pages Router) — frontend
- **Supabase** — database (books, schedules, progress)
- **Vercel** — hosting

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/reading-tracker.git
cd reading-tracker
npm install
```

### 2. Supabase database
1. Open your Supabase project → SQL Editor
2. Paste and run the full contents of `supabase-schema.sql`
3. This creates all tables and seeds Lichtspiel + Crossroads of Twilight

### 3. Environment variables
```bash
cp .env.local.example .env.local
```
Fill in from Supabase → Settings → API:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel
1. Push repo to GitHub
2. Vercel → New Project → Import repo
3. Add env variables in Vercel project settings
4. Done — auto-deploys on every push to main

## Adding cover images
Drop image files in `/public/covers/` (e.g. `lichtspiel.jpg`), push to GitHub, and Vercel redeploys automatically. The `cover_image_path` in the books table should be `/covers/filename.jpg`.

## Adding a new book
When you start a new book, bring the chapter/page data to Claude and a new schedule will be generated and added to the SQL. You'll add it via Supabase SQL editor (a few INSERT statements).

## Pages
| Route | Description |
|-------|-------------|
| `/` | Dashboard with progress bars |
| `/book/[slug]` | Per-book checklist with persistent checkboxes |
| `/completed` | Archive of finished books |
