import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Book = {
  id: string
  slug: string
  title: string
  author: string
  genre: string
  vibe_notes: string
  cover_image_path: string
  status: 'active' | 'completed'
  completed_date: string | null
  format: 'print' | 'audiobook'
  total_pages: number | null
  total_minutes: number | null
  current_page: number | null
  theme: BookTheme
}

// Format audiobook runtime (total minutes) as "Xh Ym".
export function formatRuntime(totalMinutes: number | null): string {
  if (!totalMinutes || totalMinutes <= 0) return ''
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export type BookTheme = {
  bg: string
  accent: string
  text: string
  border: string
  font_display: string
  texture?: string
  era?: string
}

export type ScheduleDay = {
  id: string
  book_id: string
  day_number: number
  date: string
  date_label: string
  chapters: string
  pages_start: number
  pages_end: number
  pages_count: number
  percent_done: number
}

export type ReadingProgress = {
  id: string
  book_id: string
  day_id: string
  checked: boolean
}

export type TbrItem = {
  id: string
  title: string
  author: string
  genre: string
  sort_order: number
  notes: string | null
  created_at: string
}
