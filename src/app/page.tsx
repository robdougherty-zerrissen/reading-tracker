'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, type Book, type ScheduleDay, type ReadingProgress } from '@/lib/supabase'

type BookWithProgress = Book & {
  scheduleDays: ScheduleDay[]
  progress: ReadingProgress[]
  checkedCount: number
  totalDays: number
  currentPercent: number
}

// Per-book theme config
const bookThemes: Record<string, {
  cardBg: string
  cardBorder: string
  titleColor: string
  authorColor: string
  subtitleColor: string
  progressBg: string
  progressFill: string
  runeColor: string
  fontTitle: string
  fontAuthor: string
  badge: string
  badgeText: string
  overlay: string
  tagline?: string
}> = {
  'lichtspiel': {
    cardBg: 'linear-gradient(160deg, #12110e 0%, #1e1c17 60%, #2a2518 100%)',
    cardBorder: '#c9a84c',
    titleColor: '#e8dcc0',
    authorColor: '#c9a84c',
    subtitleColor: '#9a9080',
    progressBg: '#2e2b22',
    progressFill: 'linear-gradient(90deg, #8b6914, #c9a84c)',
    runeColor: '#c9a84c44',
    fontTitle: 'Cinzel, serif',
    fontAuthor: 'Special Elite, monospace',
    badge: '#c9a84c',
    badgeText: '#12110e',
    overlay: 'rgba(201,168,76,0.04)',
    tagline: 'Daniel Kehlmann',
  },
  'crossroads-of-twilight': {
    cardBg: 'linear-gradient(160deg, #1c0f08 0%, #2c1810 50%, #3a2215 100%)',
    cardBorder: '#b8922a',
    titleColor: '#e8dcc8',
    authorColor: '#b8922a',
    subtitleColor: '#8a7060',
    progressBg: '#3a2010',
    progressFill: 'linear-gradient(90deg, #7a1f2e, #b8922a)',
    runeColor: '#b8922a33',
    fontTitle: 'Cinzel, serif',
    fontAuthor: 'EB Garamond, serif',
    badge: '#7a1f2e',
    badgeText: '#e8dcc8',
    overlay: 'rgba(184,146,42,0.04)',
    tagline: 'Robert Jordan · The Wheel of Time X',
  },
}

const defaultTheme = {
  cardBg: 'linear-gradient(160deg, #2a2420, #3a3028)',
  cardBorder: '#a09070',
  titleColor: '#e8dcc0',
  authorColor: '#c0a870',
  subtitleColor: '#8a8070',
  progressBg: '#3a2e20',
  progressFill: 'linear-gradient(90deg, #806040, #c0a870)',
  runeColor: '#c0a87033',
  fontTitle: 'Cinzel, serif',
  fontAuthor: 'EB Garamond, serif',
  badge: '#a09070',
  badgeText: '#1a1610',
  overlay: 'rgba(192,168,112,0.04)',
}

function getTheme(slug: string) {
  return bookThemes[slug] || defaultTheme
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function findTodaysReading(days: ScheduleDay[]) {
  const today = new Date().toISOString().split('T')[0]
  return days.find(d => d.date === today) || null
}

function getFinishDate(days: ScheduleDay[]) {
  if (!days.length) return null
  const sorted = [...days].sort((a, b) => a.day_number - b.day_number)
  return sorted[sorted.length - 1].date
}

export default function HomePage() {
  const [books, setBooks] = useState<BookWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (!booksData) { setLoading(false); return }

      const enriched: BookWithProgress[] = await Promise.all(
        booksData.map(async (book: Book) => {
          const { data: days } = await supabase
            .from('schedule_days')
            .select('*')
            .eq('book_id', book.id)
            .order('day_number')

          const { data: progress } = await supabase
            .from('reading_progress')
            .select('*')
            .eq('book_id', book.id)

          const scheduleDays = days || []
          const prog = progress || []
          const checkedCount = prog.filter(p => p.checked).length
          const totalDays = scheduleDays.length

          // Calculate current percent from last checked day
          let currentPercent = 0
          if (checkedCount > 0) {
            const checkedIds = new Set(prog.filter(p => p.checked).map(p => p.day_id))
            const checkedDays = scheduleDays.filter(d => checkedIds.has(d.id))
            const lastChecked = checkedDays.reduce((max, d) => d.day_number > max.day_number ? d : max, checkedDays[0])
            currentPercent = lastChecked.percent_done
          }

          return { ...book, scheduleDays, progress: prog, checkedCount, totalDays, currentPercent }
        })
      )

      setBooks(enriched)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-bg)', padding: '0 0 4rem' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--rule-color)',
        padding: '2.5rem 2rem 2rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p className="font-cinzel" style={{ 
            fontSize: '0.7rem', 
            letterSpacing: '0.25em',
            color: 'var(--ink-light)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            Reading Journal
          </p>
          <h1 className="font-display" style={{ 
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink-dark)',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}>
            Currently Reading
          </h1>
          <div className="rule-ornament" style={{ color: 'var(--rule-color)', margin: '1rem auto', maxWidth: '200px' }}>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>✦</span>
          </div>
          <nav style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href="/" className="font-cinzel" style={{ 
              fontSize: '0.65rem', letterSpacing: '0.2em', 
              color: 'var(--ink-dark)', textDecoration: 'none',
              textTransform: 'uppercase', borderBottom: '1px solid var(--ink-dark)',
              paddingBottom: '2px'
            }}>Current</Link>
            <Link href="/completed" className="font-cinzel" style={{ 
              fontSize: '0.65rem', letterSpacing: '0.2em', 
              color: 'var(--ink-light)', textDecoration: 'none',
              textTransform: 'uppercase'
            }}>Completed</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-light)' }}>
            <p className="font-body" style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>Turning pages…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {books.map((book, i) => (
              <BookCard key={book.id} book={book} delay={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function BookCard({ book, delay }: { book: BookWithProgress; delay: number }) {
  const theme = getTheme(book.slug)
  const today = findTodaysReading(book.scheduleDays)
  const finishDate = getFinishDate(book.scheduleDays)
  const pagesRead = book.checkedCount > 0 
    ? book.scheduleDays.filter((d, idx) => idx < book.checkedCount).reduce((sum, d) => sum + d.pages_count, 0)
    : 0

  return (
    <Link href={`/book/${book.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className={`fade-up fade-up-delay-${delay + 1}`}
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}44`,
          borderRadius: '2px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          position: 'relative',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${theme.cardBorder}66`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)'
        }}
      >
        {/* Decorative corner ornament */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '80px', height: '80px',
          background: `radial-gradient(circle at top right, ${theme.cardBorder}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', gap: 0 }}>
          {/* Cover image */}
          <div style={{ 
            width: '120px', 
            flexShrink: 0,
            background: `${theme.progressBg}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {book.cover_image_path ? (
              <Image
                src={book.cover_image_path}
                alt={book.title}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
              />
            ) : (
              <div style={{ 
                height: '100%', minHeight: '180px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.runeColor,
                fontSize: '2rem',
              }}>
                ✦
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '1.5rem 1.75rem' }}>
            {/* Genre badge */}
            <span style={{
              display: 'inline-block',
              background: theme.badge,
              color: theme.badgeText,
              fontFamily: 'Cinzel, serif',
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              marginBottom: '0.75rem',
            }}>
              {book.genre}
            </span>

            {/* Title & Author */}
            <h2 style={{ 
              fontFamily: theme.fontTitle,
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              color: theme.titleColor,
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.2,
              letterSpacing: '0.03em',
            }}>
              {book.title}
            </h2>
            <p style={{ 
              fontFamily: theme.fontAuthor,
              fontSize: '0.85rem',
              color: theme.authorColor,
              margin: '0.35rem 0 1.25rem',
              letterSpacing: book.slug === 'lichtspiel' ? '0.08em' : '0.02em',
            }}>
              {book.author}
              {book.slug === 'crossroads-of-twilight' && (
                <span style={{ color: theme.subtitleColor, fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  · The Wheel of Time X
                </span>
              )}
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ 
                  fontFamily: 'Cinzel, serif', 
                  fontSize: '0.6rem', 
                  letterSpacing: '0.15em',
                  color: theme.subtitleColor,
                  textTransform: 'uppercase',
                }}>
                  Progress
                </span>
                <span style={{ 
                  fontFamily: 'EB Garamond, serif', 
                  fontSize: '0.85rem',
                  color: theme.authorColor,
                  fontStyle: 'italic',
                }}>
                  {book.currentPercent}%
                </span>
              </div>
              <div style={{ 
                height: '4px', 
                background: theme.progressBg, 
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${book.currentPercent}%`,
                  background: theme.progressFill,
                  borderRadius: '2px',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.75rem', color: theme.subtitleColor }}>
                  {book.checkedCount} of {book.totalDays} days
                </span>
                {finishDate && (
                  <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.75rem', color: theme.subtitleColor, fontStyle: 'italic' }}>
                    Finish by {formatDate(finishDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Today's reading */}
            {today && (
              <div style={{ 
                borderTop: `1px solid ${theme.cardBorder}22`,
                paddingTop: '0.85rem',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
              }}>
                <span style={{ 
                  fontFamily: 'Cinzel, serif', 
                  fontSize: '0.55rem', 
                  letterSpacing: '0.15em',
                  color: theme.subtitleColor,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  Today ·
                </span>
                <span style={{ 
                  fontFamily: 'EB Garamond, serif', 
                  fontSize: '0.9rem',
                  color: theme.titleColor,
                  fontStyle: 'italic',
                }}>
                  {today.chapters}
                </span>
                <span style={{ 
                  fontFamily: 'EB Garamond, serif', 
                  fontSize: '0.8rem',
                  color: theme.subtitleColor,
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}>
                  {today.pages_count} pp.
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
