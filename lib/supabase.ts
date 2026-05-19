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
  total_pages: number
  current_page: number
  theme: BookTheme
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
