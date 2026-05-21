import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, Book, ScheduleDay, ReadingProgress } from '../lib/supabase'
import styles from '../styles/Home.module.css'

type BookWithProgress = Book & {
  schedule_days: ScheduleDay[]
  reading_progress: ReadingProgress[]
  checkedCount: number
  totalDays: number
  percentComplete: number
}

type Props = {
  activeBooks: BookWithProgress[]
}

export default function Home({ activeBooks }: Props) {
  return (
    <>
      <Head>
        <title>Reading Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.ornamentTop}>❧</div>
            <h1 className={styles.siteTitle}>Reading Journal</h1>
            <p className={styles.siteSubtitle}>Current Reading · Progress · History</p>
            <div className={styles.ornamentDivider}>⁂</div>
          </div>
          <nav className={styles.nav}>
            <Link href="/" className={`${styles.navLink} ${styles.navActive}`}>Currently Reading</Link>
            <span className={styles.navDot}>·</span>
            <Link href="/completed" className={styles.navLink}>Completed This Year</Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.bookGrid}>
            {activeBooks.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <span>— ❦ —</span>
        </footer>
      </div>
    </>
  )
}

function BookCard({ book, index }: { book: BookWithProgress; index: number }) {
  const theme = book.theme as any
  const nashvilleDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  const todaySchedule = book.schedule_days?.find(d => d.date === nashvilleDate)

  const checkedIds = new Set(
    book.reading_progress?.filter(p => p.checked).map(p => p.day_id) ?? []
  )
  const dueDays = book.schedule_days?.filter(d => d.date <= nashvilleDate) ?? []
  const pastDays = book.schedule_days?.filter(d => d.date < nashvilleDate) ?? []
  const uncheckedPastDays = pastDays.filter(d => !checkedIds.has(d.id))
  const daysBehind = uncheckedPastDays.length
  const daysAhead = book.checkedCount - dueDays.length

  let badgeStatus: 'today' | 'upToDate' | 'ahead' | 'behind' | null = null
  if (daysBehind > 0) {
    badgeStatus = 'behind'
  } else if (daysAhead > 0) {
    badgeStatus = 'ahead'
  } else if (todaySchedule) {
    badgeStatus = checkedIds.has(todaySchedule.id) ? 'upToDate' : 'today'
  }

  const catchUpDays = uncheckedPastDays
  const catchUpStart = catchUpDays[0]?.pages_start
  const catchUpEnd = catchUpDays[catchUpDays.length - 1]?.pages_end
  const catchUpPages = catchUpDays.reduce((sum, d) => sum + (d.pages_count ?? 0), 0)

  return (
    <article
      className={`${styles.bookCard} ${book.slug === 'lichtspiel' ? styles.cardLichtspiel : ''} ${book.slug === 'crossroads-of-twilight' ? styles.cardWoT : ''}`}
      style={{
        animationDelay: `${index * 0.18}s`,
        '--card-bg': theme.card_bg || '#f5efe0',
        '--card-accent': theme.accent || '#8b6914',
        '--card-accent2': theme.accent2 || '#5c3317',
        '--card-text': theme.text || '#1a1008',
        '--card-text-light': theme.text_light || '#5a4020',
        '--card-border': theme.border || '#8b6914',
        '--card-font-display': `'${theme.font_display}', Georgia, serif`,
        '--card-font-body': `'${theme.font_body}', Georgia, serif`,
      } as React.CSSProperties}
    >
      <div className={styles.cardInner}>
        <div className={styles.coverRow}>
          <div className={styles.coverWrapper}>
            {book.cover_image_path ? (
              <img src={book.cover_image_path} alt={`Cover of ${book.title}`} className={styles.coverImg} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <span>{book.title[0]}</span>
              </div>
            )}
          </div>

          <div className={styles.bookInfo}>
            <p className={styles.bookGenre}>{book.genre}</p>
            <h2 className={styles.bookTitle}>
              <Link href={`/book/${book.slug}`}>{book.title}</Link>
            </h2>
            <p className={styles.bookAuthor}>{book.author}</p>
            <p className={styles.bookVibe}>{book.vibe_notes?.split('.')[0]}</p>

            {badgeStatus && (
              <div className={`${styles.todayBadge}${badgeStatus === 'behind' ? ` ${styles.todayBadgeBehind}` : ''}${badgeStatus === 'ahead' ? ` ${styles.todayBadgeAhead}` : ''}`}>
                {badgeStatus === 'today' && (
                  <>
                    <span className={styles.todayLabel}>Today</span>
                    <span className={styles.todayText}>
                      pp. {todaySchedule!.pages_start}–{todaySchedule!.pages_end}
                      <em> · {todaySchedule!.pages_count} pages</em>
                    </span>
                  </>
                )}
                {badgeStatus === 'upToDate' && (
                  <>
                    <span className={styles.todayLabel}>Today</span>
                    <span className={styles.todayText}>Up to date ✓</span>
                  </>
                )}
                {badgeStatus === 'ahead' && (
                  <>
                    <span className={styles.todayLabel}>Ahead</span>
                    <span className={styles.todayText}>{daysAhead} day{daysAhead !== 1 ? 's' : ''} ahead of schedule</span>
                  </>
                )}
                {badgeStatus === 'behind' && (
                  <>
                    <span className={styles.todayLabel}>{daysBehind} day{daysBehind !== 1 ? 's' : ''} behind</span>
                    <span className={styles.todayText}>
                      pp. {catchUpStart}–{catchUpEnd}
                      <em> · {catchUpPages} pages to catch up</em>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.cardRule} />

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Progress</span>
            <span className={styles.progressPct}>{book.percentComplete}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${book.percentComplete}%` }} />
          </div>
          <div className={styles.progressStats}>
            <span>p. {book.current_page} of {book.total_pages}</span>
            <span>{book.checkedCount} / {book.totalDays} days complete</span>
          </div>
        </div>

        <Link href={`/book/${book.slug}`} className={styles.cardCta}>
          Open Reading Schedule →
        </Link>
      </div>
    </article>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'active')
    .order('created_at')

  if (!books) return { props: { activeBooks: [] } }

  const activeBooks = await Promise.all(
    books.map(async (book) => {
      const { data: schedule } = await supabase
        .from('schedule_days')
        .select('*')
        .eq('book_id', book.id)
        .order('day_number')

      const { data: progress } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('book_id', book.id)

      const checkedCount = progress?.filter(p => p.checked).length || 0
      const totalDays = schedule?.length || 0
      const percentComplete = Math.round((book.current_page / book.total_pages) * 100)

      return {
        ...book,
        schedule_days: schedule || [],
        reading_progress: progress || [],
        checkedCount,
        totalDays,
        percentComplete,
      }
    })
  )

  return { props: { activeBooks } }
}
