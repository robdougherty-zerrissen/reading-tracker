-- ============================================================
-- MIGRATION — add audiobook support to the books table
-- ============================================================
-- Run once against the Supabase project (tecausrddsmjahbzijoj).
-- Safe to re-run: every statement uses IF NOT EXISTS / guards.
-- ============================================================

-- 1. Format discriminator: 'print' (default) or 'audiobook'
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'print';

ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_format_check;

ALTER TABLE books
  ADD CONSTRAINT books_format_check CHECK (format IN ('print', 'audiobook'));

-- 2. Audiobook runtime, stored as a single total-minutes integer.
--    Null for print books.
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS total_minutes INTEGER;

-- 3. Audiobooks have no pages, so total_pages must allow NULL.
ALTER TABLE books
  ALTER COLUMN total_pages DROP NOT NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT slug, title, format, total_pages, total_minutes, status
FROM books
ORDER BY format, created_at;
