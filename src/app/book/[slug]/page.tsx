'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase, type Book, type ScheduleDay, type ReadingProgress } from '@/lib/supabase'

// Theme config — mirrors homepage but expands for full-page treatment
const bookThemes: Record<string, {
  pageBg: string
  paperBg: string
  headerBg: string
  titleColor: string
  authorColor: string
  subtitleColor: string
  accentColor: string
  ruleColor: string
  rowHover: string
  checkColor: string
  progressFill: string
  fontTitle: string
  fontBody: string
  genreBadgeBg: string
  genreBadgeText: string
  todayHighlight: string
  checkedRow: string
  ornament: string
}> = {
  'lichtspiel': {
    pageBg: '#0e0d0b',
    paperBg: '#16140f',
    headerBg: 'linear-gradient(180deg, #0a0906 0%, #16140f 100%)',
    titleColor: '#e8dcc0',
    authorColor: '#c9a84c',
    subtitleColor: '#7a7060',
    accentColor: '#c9a84c',
    ruleColor: '#c9a84c22',
    rowHover: 'rgba(201,168,76,0.04)',
    checkColor: '#c9a84c',
    progressFill: 'linear-gradient(90deg, #8b6914, #c9a84c)',
    fontTitle: 'Cinzel, serif',
    fontBody: 'Special Elite, monospace',
    genreBadgeBg: '#c9a84c',
    genreBadgeText: '#0e0d0b',
    todayHighlight: 'rgba(201,168,76,0.08)',
    checkedRow: 'rgba(201,168,76,0.03)',
    ornament: '✦',
  },
  'crossroads-of-twilight': {
    pageBg: '#f2ead8',
    paperBg: '#e8dcc8',
    headerBg: 'linear-gradient(180deg, #1c0f08 0%, #2c1810 100%)',
    titleColor: '#e8dcc8',
    authorColor: '#b8922a',
    subtitleColor: '#8a7060',
    accentColor: '#7a1f2e',
    ruleColor: '#b8922a33',
    rowHover: 'rgba(184,146,42,0.08)',
    checkColor: '#7a1f2e',
    progressFill: 'linear-gradient(90deg, #7a1f2e, #b8922a)',
    fontTitle: 'Cinzel, serif',
    fontBody: 'EB Garamond, serif',
    genreBadgeBg: '#7a1f2e',
    genreBadgeText: '#e8dcc8',
    todayHighlight: 'rgba(184,146,42,0.12)',
    checkedRow: 'rgba(0,0,0,0.03)',
    ornament: '⚜',
  },
}

const defaultTheme = bookThemes['crossroads-of-twilight']

function getTheme(slug: string) {
  return bookThemes[slug] || defaultTheme
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split('T')[0]
}

function isPast(dateStr: string) {
  return dateStr < new Date().toISOString().split('T')[0]
}

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const theme = getTheme(slug)

  const [book, setBook] = useState<Book | null>(null)
  const [days, setDays] = useState<ScheduleDay[]>([])
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const isDark = slug === 'lichtspiel'

  useEffect(() => {
    async function load() {
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!bookData) { setLoading(false); return }
      setBook(bookData)

      const { data: daysData } = await supabase
        .from('schedule_days')
        .select('*')
        .eq('book_id', bookData.id)
        .order('day_number')

      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('book_id', bookData.id)

      setDays(daysData || [])

      const progressMap: Record<string, boolean> = {}
      for (const p of (progressData || [])) {
        progressMap[p.day_id] = p.checked
      }
      setProgress(progressMap)
      setLoading(false)
    }
    load()
  }, [slug])

  async function toggleDay(dayId: string) {
    const newVal = !progress[dayId]
    setProgress(prev => ({ ...prev, [dayId]: newVal }))

    await supabase
      .from('reading_progress')
      .upsert(
        { book_id: book!.id, day_id: dayId, checked: newVal, updated_at: new Date().toISOString() },
        { onConflict: 'book_id,day_id' }
      )
  }

  async function markComplete() {
    if (!book || completing) return
    setCompleting(true)

    const today = new Date().toISOString().split('T')[0]

    // Insert into completed_books
    await supabase.from('completed_books').insert({
      book_id: book.id,
      title: book.title,
      author: book.author,
      cover_image_path: book.cover_image_path,
      genre: book.genre,
      completed_date: today,
      total_pages: book.total_pages,
    })

    // Update book status
    await supabase.from('books').update({ status: 'completed', completed_date: today }).eq('id', book.id)

    window.location.href = '/completed'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0e0d0b' : 'var(--paper-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', color: isDark ? '#7a7060' : 'var(--ink-light)' }}>
          Opening the book…
        </p>
      </div>
    )
  }

  if (!book) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Book not found.</p>
      </div>
    )
  }

  const checkedCount = Object.values(progress).filter(Boolean).length
  const totalDays = days.length
  const lastCheckedDay = [...days].reverse().find(d => progress[d.id])
  const currentPercent = lastCheckedDay?.percent_done ?? 0
  const allChecked = checkedCount === totalDays && totalDays > 0

  // Calculate total pages remaining
  const checkedDayIds = new Set(Object.entries(progress).filter(([,v]) => v).map(([k]) => k))
  const remainingPages = days
    .filter(d => !checkedDayIds.has(d.id))
    .reduce((sum, d) => sum + d.pages_count, 0)

  return (
    <div style={{ minHeight: '100vh', background: isDark ? theme.pageBg : 'var(--paper-bg)' }}>
      {/* Header band */}
      <div style={{ background: theme.headerBg, padding: '2rem 2rem 2.5rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Link href="/" style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: theme.subtitleColor,
            textDecoration: 'none',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1.5rem',
          }}>
            ← Reading Journal
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <span style={{
                display: 'inline-block',
                background: theme.genreBadgeBg,
                color: theme.genreBadgeText,
                fontFamily: 'Cinzel, serif',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                marginBottom: '0.75rem',
              }}>
                {book.genre}
              </span>
              <h1 style={{
                fontFamily: theme.fontTitle,
                fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                color: theme.titleColor,
                fontWeight: 400,
                letterSpacing: '0.06em',
                margin: 0,
                lineHeight: 1.1,
              }}>
                {book.title}
              </h1>
              <p style={{
                fontFamily: theme.fontBody,
                fontSize: '1rem',
                color: theme.authorColor,
                margin: '0.5rem 0 0',
                letterSpacing: slug === 'lichtspiel' ? '0.1em' : '0.02em',
              }}>
                {book.author}
              </p>
              {book.vibe_notes && (
                <p style={{
                  fontFamily: 'EB Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '0.82rem',
                  color: theme.subtitleColor,
                  margin: '0.4rem 0 0',
                }}>
                  {book.vibe_notes}
                </p>
              )}
            </div>

            {/* Progress summary */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', color: theme.accentColor, lineHeight: 1 }}>
                {currentPercent}%
              </div>
              <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.8rem', color: theme.subtitleColor, marginTop: '0.25rem' }}>
                {remainingPages} pages to go
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${currentPercent}%`,
                background: theme.progressFill,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 130px 1fr 70px 60px',
          gap: '0 1rem',
          padding: '0.5rem 1rem',
          borderBottom: `1px solid ${isDark ? theme.ruleColor : 'var(--rule-color)'}`,
          marginBottom: '0.25rem',
        }}>
          {['', 'Date', 'Chapters', 'Pages', '%'].map((h, i) => (
            <span key={i} style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.55rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: isDark ? theme.subtitleColor : 'var(--ink-light)',
              textAlign: i >= 3 ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {days.map((day, idx) => {
          const checked = !!progress[day.id]
          const today = isToday(day.date)
          const past = isPast(day.date)

          return (
            <div
              key={day.id}
              onClick={() => toggleDay(day.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 130px 1fr 70px 60px',
                gap: '0 1rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: `1px solid ${isDark ? theme.ruleColor : '#e0d8c8'}`,
                background: today
                  ? theme.todayHighlight
                  : checked
                  ? theme.checkedRow
                  : 'transparent',
                transition: 'background 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!today) (e.currentTarget as HTMLElement).style.background = theme.rowHover
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = today
                  ? theme.todayHighlight
                  : checked
                  ? theme.checkedRow
                  : 'transparent'
              }}
            >
              {/* Today marker */}
              {today && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: '2px',
                  background: theme.accentColor,
                }} />
              )}

              {/* Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `1.5px solid ${checked ? theme.checkColor : isDark ? '#4a4030' : 'var(--rule-color)'}`,
                  borderRadius: '1px',
                  background: checked ? theme.checkColor : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}>
                  {checked && (
                    <span style={{ color: isDark ? '#0e0d0b' : '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
                  )}
                </div>
              </div>

              {/* Date */}
              <span style={{
                fontFamily: slug === 'lichtspiel' ? 'Special Elite, monospace' : 'EB Garamond, serif',
                fontSize: slug === 'lichtspiel' ? '0.75rem' : '0.9rem',
                color: today
                  ? theme.accentColor
                  : checked
                  ? (isDark ? '#4a4030' : 'var(--ink-light)')
                  : (isDark ? theme.subtitleColor : 'var(--ink-mid)'),
                display: 'flex',
                alignItems: 'center',
                fontWeight: today ? 600 : 400,
              }}>
                {formatDate(day.date)}
              </span>

              {/* Chapters */}
              <span style={{
                fontFamily: 'EB Garamond, serif',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: checked
                  ? (isDark ? '#4a4030' : 'var(--ink-light)')
                  : (isDark ? theme.titleColor : 'var(--ink-dark)'),
                display: 'flex',
                alignItems: 'center',
                textDecoration: checked ? 'line-through' : 'none',
                textDecorationColor: isDark ? '#4a4030' : 'var(--rule-color)',
              }}>
                {day.chapters}
              </span>

              {/* Pages */}
              <span style={{
                fontFamily: 'EB Garamond, serif',
                fontSize: '0.85rem',
                color: isDark ? theme.subtitleColor : 'var(--ink-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
                pp. {day.pages_start}–{day.pages_end}
              </span>

              {/* Percent */}
              <span style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '0.7rem',
                color: checked ? theme.accentColor : (isDark ? theme.subtitleColor : 'var(--ink-light)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                letterSpacing: '0.05em',
              }}>
                {day.percent_done}%
              </span>
            </div>
          )
        })}

        {/* Footer stats */}
        <div style={{
          marginTop: '2rem',
          padding: '1.25rem',
          border: `1px solid ${isDark ? theme.ruleColor : '#d8cfb8'}`,
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Days Read', val: `${checkedCount} / ${totalDays}` },
            { label: 'Pages Remaining', val: remainingPages.toString() },
            { label: 'Progress', val: `${currentPercent}%` },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: isDark ? theme.subtitleColor : 'var(--ink-light)', marginBottom: '0.25rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.3rem', color: isDark ? theme.titleColor : 'var(--ink-dark)' }}>
                {val}
              </div>
            </div>
          ))}

          {allChecked && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={markComplete}
                disabled={completing}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  background: theme.accentColor,
                  color: isDark ? '#0e0d0b' : '#fff',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  cursor: completing ? 'not-allowed' : 'pointer',
                  opacity: completing ? 0.7 : 1,
                }}
              >
                {completing ? 'Archiving…' : 'Mark Complete →'}
              </button>
            </div>
          )}
        </div>

        {/* Closing quote / ornament */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: isDark ? '#3a3020' : 'var(--rule-color)' }}>
          <span style={{ fontSize: '1.2rem' }}>{theme.ornament}</span>
        </div>
      </main>
    </div>
  )
}
