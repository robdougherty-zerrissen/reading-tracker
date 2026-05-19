-- Reading Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  vibe_notes TEXT,
  cover_image_path TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  completed_date DATE,
  total_pages INTEGER NOT NULL,
  current_page INTEGER DEFAULT 1,
  theme JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule days table (one row per reading day)
CREATE TABLE schedule_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  date_label TEXT NOT NULL,
  chapters TEXT NOT NULL,
  pages_start INTEGER NOT NULL,
  pages_end INTEGER NOT NULL,
  pages_count INTEGER GENERATED ALWAYS AS (pages_end - pages_start + 1) STORED,
  percent_done INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, day_number)
);

-- Reading progress table (checkbox state)
CREATE TABLE reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  day_id UUID REFERENCES schedule_days(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ,
  UNIQUE(book_id, day_id)
);

-- Enable Row Level Security (RLS) - adjust policies for your auth setup
-- For now, enable public read/write (tighten later if you add auth)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Public write books" ON books FOR ALL USING (true);
CREATE POLICY "Public read schedule" ON schedule_days FOR SELECT USING (true);
CREATE POLICY "Public write schedule" ON schedule_days FOR ALL USING (true);
CREATE POLICY "Public read progress" ON reading_progress FOR SELECT USING (true);
CREATE POLICY "Public write progress" ON reading_progress FOR ALL USING (true);

-- =====================================================
-- SEED DATA: Insert both books
-- =====================================================

-- 1. LICHTSPIEL
INSERT INTO books (slug, title, author, genre, vibe_notes, cover_image_path, total_pages, current_page, theme)
VALUES (
  'lichtspiel',
  'Lichtspiel',
  'Daniel Kehlmann',
  'Literary Fiction',
  '1930s German cinema, Expressionism, moral compromise under fascism. Weimar-era film studio aesthetic.',
  '/covers/lichtspiel.jpg',
  471,
  274,
  '{
    "bg": "#1a1208",
    "card_bg": "#f5efe0",
    "accent": "#c9a84c",
    "accent2": "#8b1a1a",
    "text": "#1a1208",
    "text_light": "#5c4a2a",
    "border": "#c9a84c",
    "font_display": "Playfair Display",
    "font_body": "EB Garamond",
    "era": "1930s"
  }'::jsonb
);

-- Get Lichtspiel ID for schedule
DO $$
DECLARE
  licht_id UUID;
  cot_id UUID;
BEGIN
  SELECT id INTO licht_id FROM books WHERE slug = 'lichtspiel';

  -- Lichtspiel schedule (Mon May 18 - Fri May 22)
  INSERT INTO schedule_days (book_id, day_number, date, date_label, chapters, pages_start, pages_end, percent_done) VALUES
    (licht_id, 1, '2026-05-18', 'Mon May 18', 'Große Ferien (cont.) / Schattenspiel', 274, 313, 67),
    (licht_id, 2, '2026-05-19', 'Tue May 19', 'Schattenspiel (cont.) / Molander (I)', 314, 353, 75),
    (licht_id, 3, '2026-05-20', 'Wed May 20', 'Molander (I) (cont.) / Molander (II)', 354, 393, 84),
    (licht_id, 4, '2026-05-21', 'Thu May 21', 'Molander (II) (cont.) / Tiefe', 394, 433, 92),
    (licht_id, 5, '2026-05-22', 'Fri May 22', 'Tiefe (cont.) / Lulu / Tulpen', 434, 471, 100);

  -- Initialize progress rows (unchecked)
  INSERT INTO reading_progress (book_id, day_id, checked)
  SELECT licht_id, id, FALSE FROM schedule_days WHERE book_id = licht_id;

  -- 2. CROSSROADS OF TWILIGHT
  INSERT INTO books (slug, title, author, genre, vibe_notes, cover_image_path, total_pages, current_page, theme)
  VALUES (
    'crossroads-of-twilight',
    'Crossroads of Twilight',
    'Robert Jordan',
    'Epic Fantasy',
    'Wheel of Time Book 10. High fantasy, medieval tapestry, turning ages. Rich and weighty.',
    '/covers/crossroads-of-twilight.jpg',
    665,
    205,
    '{
      "bg": "#0d1a0d",
      "card_bg": "#f7f0e3",
      "accent": "#8b6914",
      "accent2": "#5c3317",
      "text": "#1a1008",
      "text_light": "#5a4020",
      "border": "#8b6914",
      "font_display": "Cinzel",
      "font_body": "Crimson Text",
      "era": "medieval"
    }'::jsonb
  );

  SELECT id INTO cot_id FROM books WHERE slug = 'crossroads-of-twilight';

  -- CoT schedule (Mon May 18 - Fri May 29)
  INSERT INTO schedule_days (book_id, day_number, date, date_label, chapters, pages_start, pages_end, percent_done) VALUES
    (cot_id, 1,  '2026-05-18', 'Mon May 18', 'Ch 8: Whirlpools of Color / Ch 9: Traps', 205, 243, 8),
    (cot_id, 2,  '2026-05-19', 'Tue May 19', 'Ch 9: Traps (cont.) / Ch 10: A Blazing Beacon / Ch 11: Talk of Debts', 244, 282, 17),
    (cot_id, 3,  '2026-05-20', 'Wed May 20', 'Ch 11: Talk of Debts (cont.) / Ch 12: A Bargain / Ch 13: High Seats', 283, 321, 25),
    (cot_id, 4,  '2026-05-21', 'Thu May 21', 'Ch 13: High Seats (cont.) / Ch 14: What Wise Ones Know / Ch 15: Gathering Darkness', 322, 360, 34),
    (cot_id, 5,  '2026-05-22', 'Fri May 22', 'Ch 15: Gathering Darkness (cont.) / Ch 16: The Subject of Negotiations / Ch 17: Secrets', 361, 399, 42),
    (cot_id, 6,  '2026-05-23', 'Sat May 23', 'Ch 17: Secrets (cont.) / Ch 18: A Chat with Siuan', 400, 437, 51),
    (cot_id, 7,  '2026-05-24', 'Sun May 24', 'Ch 19: Surprises / Ch 20: In the Night', 438, 475, 59),
    (cot_id, 8,  '2026-05-25', 'Mon May 25', 'Ch 20: In the Night (cont.) / Ch 21: A Mark / Ch 22: One Answer / Ch 23: Ornaments', 476, 513, 67),
    (cot_id, 9,  '2026-05-26', 'Tue May 26', 'Ch 23: Ornaments (cont.) / Ch 24: A Strengthening Storm / Ch 25: When to Wear Jewels', 514, 551, 75),
    (cot_id, 10, '2026-05-27', 'Wed May 27', 'Ch 25: When to Wear Jewels (cont.) / Ch 26: In So Habor / Ch 27: What Must Be Done', 552, 589, 84),
    (cot_id, 11, '2026-05-28', 'Thu May 28', 'Ch 27: What Must Be Done (cont.) / Ch 28: A Cluster of Rosebuds / Ch 29: Something Flickers', 590, 627, 92),
    (cot_id, 12, '2026-05-29', 'Fri May 29', 'Ch 29: Something Flickers (cont.) / Ch 30: What the Oath Rod Can Do / Epilogue: An Answer', 628, 665, 100);

  -- Initialize progress rows (unchecked)
  INSERT INTO reading_progress (book_id, day_id, checked)
  SELECT cot_id, id, FALSE FROM schedule_days WHERE book_id = cot_id;

END $$;
