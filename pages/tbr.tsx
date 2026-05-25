import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, TbrItem } from '../lib/supabase'
import styles from '../styles/Tbr.module.css'

type GenreGroup = {
  genre: string
  items: TbrItem[]
}

type Props = {
  genres: GenreGroup[]
  totalCount: number
  genreCount: number
}

export default function TbrPage({ genres, totalCount, genreCount }: Props) {
  return (
    <>
      <Head>
        <title>To Be Read · Reading Journal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.ornament}>❧</div>
          <h1 className={styles.siteTitle}>Reading Journal</h1>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Currently Reading</Link>
            <span className={styles.navDot}>·</span>
            <Link href="/completed" className={styles.navLink}>Completed This Year</Link>
            <span className={styles.navDot}>·</span>
            <Link href="/tbr" className={`${styles.navLink} ${styles.navActive}`}>To Be Read</Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.contentWrapper}>
            <aside className={styles.statsPanel}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{totalCount}</span>
                <span className={styles.statLabel}>Books{'\n'}on the List</span>
              </div>
              <div className={styles.statRule} />
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{genreCount}</span>
                <span className={styles.statLabel}>Genres{'\n'}Represented</span>
              </div>
            </aside>

            <div className={styles.genreList}>
              {genres.length === 0 ? (
                <div className={styles.empty}>
                  <p>Nothing on the list yet — add some books.</p>
                </div>
              ) : (
                genres.map(({ genre, items }, i) => (
                  <GenreSection key={genre} genre={genre} items={items} sectionIndex={i} />
                ))
              )}
            </div>
          </div>
        </main>

        <footer className={styles.footer}>— ❦ —</footer>
      </div>
    </>
  )
}

function GenreSection({ genre, items, sectionIndex }: { genre: string; items: TbrItem[]; sectionIndex: number }) {
  return (
    <section
      className={styles.genreSection}
      style={{ animationDelay: `${sectionIndex * 0.1}s` } as React.CSSProperties}
    >
      <div className={styles.genreHeader}>
        <span className={styles.genreName}>{genre}</span>
        <span className={styles.genreCount}>{items.length}</span>
        <div className={styles.genreRule} />
      </div>
      <ul className={styles.itemList}>
        {items.map((item, j) => (
          <li
            key={item.id}
            className={styles.item}
            style={{ animationDelay: `${sectionIndex * 0.1 + j * 0.05}s` } as React.CSSProperties}
          >
            <span className={styles.itemTitle}>{item.title}</span>
            <span className={styles.itemLeader} aria-hidden="true" />
            <span className={styles.itemAuthor}>{item.author}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { data } = await supabase
    .from('tbr_items')
    .select('*')
    .order('genre')
    .order('sort_order')
    .order('title')

  const items: TbrItem[] = data || []

  const genreMap = new Map<string, TbrItem[]>()
  items.forEach(item => {
    if (!genreMap.has(item.genre)) genreMap.set(item.genre, [])
    genreMap.get(item.genre)!.push(item)
  })

  const genres = Array.from(genreMap.entries()).map(([genre, items]) => ({ genre, items }))

  return {
    props: {
      genres,
      totalCount: items.length,
      genreCount: genres.length,
    },
  }
}
