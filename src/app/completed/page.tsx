'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type CompletedBook = {
  id: string
  title: string
  author: string
  cover_image_path: string | null
  genre: string | null
  completed_date: string
  total_pages: number | null
  notes: string | null
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getYear(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getFullYear()
}

export default function CompletedPage() {
  const [books, setBooks] = useState<CompletedBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('completed_books')
        .select('*')
        .order('completed_date', { ascending: false })
      setBooks(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const years = Array.from(new Set(books.map(b => getYear(b.completed_date)))).sort((a, b) => b - a)
  const totalPages = books.reduce((sum, b) => sum + (b.total_pages || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-bg)', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--rule-color)', padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <p className="font-cinzel" style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--ink-light)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Reading Journal
          </p>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, fontStyle: 'italic', color: 'var(--ink-dark)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Books Finished
          </h1>
          <div className="rule-ornament" style={{ color: 'var(--rule-color)', margin: '1rem auto', maxWidth: '200px' }}>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', fontFamily: 'Cinzel, serif' }}>✦</span>
          </div>
          <nav style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href="/" className="font-cinzel" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--ink-light)', textDecoration: 'none', textTransform: 'uppercase' }}>
              Current
            </Link>
            <Link href="/completed" className="font-cinzel" style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--ink-dark)', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid var(--ink-dark)', paddingBottom: '2px' }}>
              Completed
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Summary stats */}
        {books.length > 0 && (
          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--rule-color)' }}>
            {[
              { label: 'Books Finished', val: books.length.toString() },
              { label: 'Pages Read', val: totalPages.toLocaleString() },
              { label: 'This Year', val: books.filter(b => getYear(b.completed_date) === new Date().getFullYear()).length.toString() },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: '0.25rem' }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--ink-dark)' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', color: 'var(--ink-light)', textAlign: 'center', padding: '3rem' }}>
            Consulting the archive…
          </p>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-light)' }}>
            <p style={{ fontFamily: 'EB Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic' }}>
              No books completed yet.
            </p>
            <p style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Finished books will appear here when you mark them complete.
            </p>
          </div>
        ) : (
          years.map(year => (
            <div key={year} style={{ marginBottom: '3rem' }}>
              {/* Year header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
                  {year}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--rule-color)' }} />
              </div>

              {/* Timeline entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {books
                  .filter(b => getYear(b.completed_date) === year)
                  .map((book, idx, arr) => (
                    <div key={book.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                      {/* Timeline spine */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '24px' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', border: '1.5px solid var(--ink-light)', background: 'var(--paper-bg)', flexShrink: 0, marginTop: '1.5rem' }} />
                        {idx < arr.length - 1 && (
                          <div style={{ width: '1px', flex: 1, background: 'var(--rule-color)', minHeight: '2rem' }} />
                        )}
                      </div>

                      {/* Card */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid transparent' : 'none',
                      }}>
                        {/* Cover thumbnail */}
                        {book.cover_image_path && (
                          <div style={{ width: '52px', flexShrink: 0, position: 'relative', height: '72px' }}>
                            <Image
                              src={book.cover_image_path}
                              alt={book.title}
                              fill
                              style={{ objectFit: 'cover', boxShadow: '2px 2px 8px rgba(0,0,0,0.15)' }}
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          {book.genre && (
                            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-light)' }}>
                              {book.genre}
                            </span>
                          )}
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--ink-dark)', margin: '0.15rem 0' }}>
                            {book.title}
                          </div>
                          <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.88rem', color: 'var(--ink-light)' }}>
                            {book.author}
                          </div>
                          {book.notes && (
                            <div style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--ink-light)', marginTop: '0.35rem' }}>
                              {book.notes}
                            </div>
                          )}
                        </div>

                        {/* Date & pages */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--ink-light)' }}>
                            {formatDateFull(book.completed_date)}
                          </div>
                          {book.total_pages && (
                            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--ink-light)', marginTop: '0.2rem' }}>
                              {book.total_pages.toLocaleString()} pages
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
