import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, Book, formatRuntime } from '../lib/supabase'
import styles from '../styles/Completed.module.css'

type Props = {
  completedBooks: Book[]
  totalBooks: number
  printCount: number
  totalPages: number
  avgPagesPerDay: number
  audioCount: number
  totalMinutes: number
  avgMinutesPerDay: number
}

export default function CompletedPage({
  completedBooks,
  totalBooks,
  printCount,
  totalPages,
  avgPagesPerDay,
  audioCount,
  totalMinutes,
  avgMinutesPerDay,
}: Props) {
  return (
    <>
      <Head>
        <title>Completed Reading · 2026</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <Link href="/" className={styles.backLink}>← Reading Journal</Link>
        <header className={styles.header}>
          <div className={styles.ornament}>❧</div>
          <h1 className={styles.siteTitle}>Reading Journal</h1>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Currently Reading</Link>
            <span className={styles.navDot}>·</span>
            <Link href="/completed" className={`${styles.navLink} ${styles.navActive}`}>Completed This Year</Link>
            <span className={styles.navDot}>·</span>
            <Link href="/tbr" className={styles.navLink}>To Be Read</Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.contentWrapper}>
            <aside className={styles.statsPanel}>
              <div className={styles.statTotal}>
                <span className={`${styles.statNumber} ${styles.statNumberLg}`}>{totalBooks}</span>
                <span className={styles.statLabel}>Books{'\n'}Completed</span>
              </div>

              <div className={styles.statGroup}>
                <div className={styles.statGroupLabel}>Print</div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{printCount}</span>
                  <span className={styles.statLabel}>Books</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{totalPages.toLocaleString()}</span>
                  <span className={styles.statLabel}>Total{'\n'}Pages</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{avgPagesPerDay}</span>
                  <span className={styles.statLabel}>Pages{'\n'}per Day</span>
                </div>
              </div>

              <div className={styles.statGroup}>
                <div className={styles.statGroupLabel}>Audio</div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{audioCount}</span>
                  <span className={styles.statLabel}>Audiobooks</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statNumber} ${styles.statTime}`}>{formatRuntime(totalMinutes) || '0m'}</span>
                  <span className={styles.statLabel}>Total{'\n'}Time</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{avgMinutesPerDay}</span>
                  <span className={styles.statLabel}>Min{'\n'}per Day</span>
                </div>
              </div>
            </aside>

            <div className={styles.timelineArea}>
              <div className={styles.yearLabel}>2026</div>
              {completedBooks.length === 0 ? (
                <div className={styles.empty}>
                  <p>No completed books yet — keep reading.</p>
                </div>
              ) : (
                <div className={styles.timeline}>
                  {completedBooks.map((book, i) => (
                    <CompletedCard key={book.id} book={book} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className={styles.footer}>— ❦ —</footer>
      </div>
    </>
  )
}

function CompletedCard({ book, index }: { book: Book; index: number }) {
  const theme = book.theme as any
  const dateObj = book.completed_date ? new Date(book.completed_date + 'T12:00:00') : null
  const dateFormatted = dateObj
    ? dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div
      className={styles.timelineItem}
      style={{
        animationDelay: `${index * 0.12}s`,
        '--card-accent': theme.accent || '#8b6914',
        '--card-accent2': theme.accent2 || '#5c3317',
        '--card-border': theme.border || '#8b6914',
        '--card-font-display': `'${theme.font_display}', Georgia, serif`,
      } as React.CSSProperties}
    >
      <div className={styles.timelineDot} />
      <div className={styles.timelineCard}>
        {book.cover_image_path && (
          <img src={book.cover_image_path} alt={book.title} className={styles.cover} />
        )}
        <div className={styles.cardBody}>
          <p className={styles.completedDate}>Completed {dateFormatted}</p>
          <h2 className={styles.title}>{book.title}</h2>
          <p className={styles.author}>{book.author}</p>
          <p className={styles.genre}>{book.genre}</p>
          <div className={styles.badge}>
            ✓ Finished · {book.format === 'audiobook'
              ? formatRuntime(book.total_minutes)
              : `${book.total_pages} pages`}
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data: completedBooks } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'completed')
    .order('completed_date', { ascending: false })

  const books = completedBooks || []
  const totalBooks = books.length

  // Split by format: print contributes pages, audiobooks contribute minutes.
  const printBooks = books.filter((b) => b.format !== 'audiobook')
  const audioBooks = books.filter((b) => b.format === 'audiobook')

  const printCount = printBooks.length
  const totalPages = printBooks.reduce((sum, b) => sum + (b.total_pages || 0), 0)

  const audioCount = audioBooks.length
  const totalMinutes = audioBooks.reduce((sum, b) => sum + (b.total_minutes || 0), 0)

  const nashvilleToday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  const startOfYear = new Date('2026-01-01T00:00:00')
  const todayDate = new Date(nashvilleToday + 'T00:00:00')
  const daysElapsed = Math.floor((todayDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const avgPagesPerDay = daysElapsed > 0 ? Math.round(totalPages / daysElapsed) : 0
  const avgMinutesPerDay = daysElapsed > 0 ? Math.round(totalMinutes / daysElapsed) : 0

  return {
    props: {
      completedBooks: books,
      totalBooks,
      printCount,
      totalPages,
      avgPagesPerDay,
      audioCount,
      totalMinutes,
      avgMinutesPerDay,
    },
  }
}
