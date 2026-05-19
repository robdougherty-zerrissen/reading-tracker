import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Book = {
  id: string
  slug: string
  title: string
  author: string
  genre: string
  vibe_notes: string
  cover_image_path: string | null
  status: 'active' | 'completed'
  completed_date: string | null
  total_pages: number
  start_page: number
}

export type ScheduleDay = {
  id: string
  book_id: string
  day_number: number
  date: string
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
