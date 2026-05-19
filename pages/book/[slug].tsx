import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { supabase, Book, ScheduleDay, ReadingProgress } from '../../lib/supabase'
import styles from '../../styles/Book.module.css'

type DayWithProgress = ScheduleDay & {
  progress: ReadingProgress | null
  isToday: boolean
  isPast: boolean
}

type Props = {
  book: Book
  days: DayWithProgress[]
  checkedCount: number
}

export default function BookPage({ book, days: initialDays, checkedCount: initialChecked }: Props) {
  const [days, setDays] = useState(initialDays)
  const [checkedCount, setCheckedCount] = useState(initialChecked)
  const [completing, setCompleting] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)

  const theme = book.theme as any
  const isLichtspiel = book.slug === 'lichtspiel'
  const isWoT = book.slug === 'crossroads-of-twilight'

  const toggleDay = useCallback(async (dayId: string, currentChecked: boolean) => {
    const newChecked = !currentChecked

    // Optimistic update
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, progress: { ...d.progress!, checked: newChecked } }
        : d
    ))
    setCheckedCount(prev => prev + (newChecked ? 1 : -1))

    // Persist to Supabase
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        book_id: book.id,
        day_id: dayId,
        checked: newChecked,
        checked_at: newChecked ? new Date().toISOString() : null,
      }, { onConflict: 'book_id,day_id' })

    if (error) {
      // Revert on error
      setDays(prev => prev.map(d =>
        d.id === dayId
          ? { ...d, progress: { ...d.progress!, checked: currentChecked } }
          : d
      ))
      setCheckedCount(prev => prev + (newChecked ? -1 : 1))
      console.error('Failed to save progress:', error)
    }
  }, [book.id])

  const handleMarkComplete = async () => {
    if (!confirm(`Mark "${book.title}" as completed? It will move to your Completed books list.`)) return
    setMarkingComplete(true)
    await supabase
      .from('books')
      .update({ status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
      .eq('id', book.id)
    window.location.href = '/completed'
  }

  const totalDays = days.length
  const percentComplete = Math.round(((book.current_page - 1) / book.total_pages) * 100)

  return (
    <>
      <Head>
        <title>{book.title} · Reading Schedule</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      </Head>

      <div
        className={`${styles.page} ${isLichtspiel ? styles.pageLichtspiel : ''} ${isWoT ? styles.pageWoT : ''}`}
        style={{
          '--card-accent': theme.accent,
          '--card-accent2': theme.accent2,
          '--card-text': theme.text,
          '--card-text-light': theme.text_light,
          '--card-border': theme.border,
          '--card-font-display': `'${theme.font_display}', Georgia, serif`,
          '--card-font-body': `'${theme.font_body}', Georgia, serif`,
        } as React.CSSProperties}
      >
        {/* Back nav */}
        <Link href="/" className={styles.backLink}>← Reading Journal</Link>

        {/* Header */}
        <header className={styles.header}>
          {isLichtspiel && <div className={styles.filmStrip} />}

          <div className={styles.headerContent}>
            {book.cover_image_path && (
              <img src={book.cover_image_path} alt={book.title} className={styles.headerCover} />
            )}
            <div className={styles.headerText}>
              <p className={styles.headerGenre}>{book.genre}</p>
              <h1 className={styles.headerTitle}>{book.title}</h1>
              <p className={styles.headerAuthor}>{book.author}</p>
              {isWoT && <p className={styles.headerSeries}>The Wheel of Time · Book Ten</p>}
              {isLichtspiel && <p className={styles.headerSeries}>Daniel Kehlmann · 2023</p>}
            </div>
          </div>

          {/* Progress summary bar */}
          <div className={styles.summaryBar}>
            <div className={styles.summaryStats}>
              <div className={styles.summaryStat}>
                <span className={styles.summaryNum}>{checkedCount}</span>
                <span className={styles.summaryOf}>/ {totalDays}</span>
                <span className={styles.summaryLabel}>days done</span>
              </div>
              <div className={styles.summaryDivider}>·</div>
              <div className={styles.summaryStat}>
                <span className={styles.summaryNum}>{percentComplete}%</span>
                <span className={styles.summaryLabel}>complete</span>
              </div>
              <div className={styles.summaryDivider}>·</div>
              <div className={styles.summaryStat}>
                <span className={styles.summaryNum}>p. {book.current_page}</span>
                <span className={styles.summaryOf}>/ {book.total_pages}</span>
              </div>
            </div>
            <div className={styles.summaryTrack}>
              <div className={styles.summaryFill} style={{ width: `${percentComplete}%` }} />
            </div>
          </div>

          {isLichtspiel && <div className={styles.filmStrip} />}
          {isWoT && <div className={styles.wotRule} />}
        </header>

        {/* Checklist */}
        <main className={styles.main}>
          <div className={styles.checklistWrapper}>

            {/* Column headers */}
            <div className={styles.colHeaders}>
              <span className={styles.colCheck}>✓</span>
              <span className={styles.colDate}>Date</span>
              <span className={styles.colChapters}>Chapters</span>
              <span className={styles.colPages}>Pages</span>
              <span className={styles.colPp}>PP/Day</span>
              <span className={styles.colPct}>% Done</span>
            </div>

            <div className={styles.checklist}>
              {days.map((day, i) => (
                <DayRow
                  key={day.id}
                  day={day}
                  index={i}
                  onToggle={toggleDay}
                  fontDisplay={theme.font_display}
                />
              ))}
            </div>

            {/* Completion actions */}
            <div className={styles.bottomSection}>
              {isWoT && (
                <p className={styles.colophon}>
                  <em>The Wheel of Time turns, and Ages come and pass — Robert Jordan</em>
                </p>
              )}
              {isLichtspiel && (
                <p className={styles.colophon}>
                  <em>„Dieser ganze Wahnsinn … gibt uns die Möglichkeit, einen großen Film zu machen."</em>
                </p>
              )}

              {checkedCount === totalDays && (
                <button
                  className={styles.completeBtn}
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                >
                  {markingComplete ? 'Archiving…' : '✓ Mark as Complete'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function DayRow({ day, index, onToggle, fontDisplay }: {
  day: DayWithProgress
  index: number
  onToggle: (dayId: string, currentChecked: boolean) => void
  fontDisplay: string
}) {
  const checked = day.progress?.checked || false

  return (
    <div
      className={`${styles.dayRow} ${checked ? styles.dayChecked : ''} ${day.isToday ? styles.dayToday : ''} ${day.isPast && !checked ? styles.dayOverdue : ''}`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <button
        className={styles.checkbox}
        onClick={() => onToggle(day.id, checked)}
        aria-label={checked ? 'Unmark day as read' : 'Mark day as read'}
      >
        {checked && <span className={styles.checkmark}>✓</span>}
      </button>

      <div className={styles.rowDate}>
        {day.isToday && <span className={styles.todayPill}>Today</span>}
        <span className={styles.dateText}>{day.date_label}</span>
      </div>

      <div className={styles.rowChapters}>{day.chapters}</div>

      <div className={styles.rowPages}>
        pp. {day.pages_start}–{day.pages_end}
      </div>

      <div className={styles.rowPp}>{day.pages_count}</div>

      <div className={styles.rowPct}>
        <span className={styles.pctNum}>{day.percent_done}%</span>
        <div className={styles.miniBar}>
          <div className={styles.miniBarFill} style={{ width: `${day.percent_done}%` }} />
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!book) return { notFound: true }

  const { data: schedule } = await supabase
    .from('schedule_days')
    .select('*')
    .eq('book_id', book.id)
    .order('day_number')

  const { data: progress } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('book_id', book.id)

  const nashvilleDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })

  const days: DayWithProgress[] = (schedule || []).map(day => ({
    ...day,
    progress: progress?.find(p => p.day_id === day.id) || null,
    isToday: day.date === nashvilleDate,
    isPast: day.date < nashvilleDate,
  }))

  const checkedCount = progress?.filter(p => p.checked).length || 0

  return { props: { book, days, checkedCount } }
}
