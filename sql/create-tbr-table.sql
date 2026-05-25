-- ============================================================
-- CREATE TBR TABLE — To Be Read list for reading-tracker
-- ============================================================
-- Run this against the Supabase project (tecausrddsmjahbzijoj).
-- ============================================================


-- ============================================================
-- STEP 1 — create the table
-- ============================================================

CREATE TABLE tbr_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  author       text NOT NULL,
  genre        text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE tbr_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"  ON tbr_items FOR SELECT USING (true);
CREATE POLICY "Public write" ON tbr_items FOR ALL    USING (true);


-- ============================================================
-- STEP 2 — seed data (replace or extend with your own list)
-- ============================================================

INSERT INTO tbr_items (title, author, genre, sort_order) VALUES
  ('The Wager',                           'David Grann',          'Non-fiction',       1),
  ('Say Nothing',                         'Patrick Radden Keefe', 'Non-fiction',       2),
  ('Killers of the Flower Moon',          'David Grann',          'Non-fiction',       3),

  ('A Little Life',                       'Hanya Yanagihara',     'Literary Fiction',  1),
  ('The Remains of the Day',              'Kazuo Ishiguro',       'Literary Fiction',  2),
  ('Stoner',                              'John Williams',        'Literary Fiction',  3),
  ('The Master and Margarita',            'Mikhail Bulgakov',     'Literary Fiction',  4),

  ('The Name of the Wind',                'Patrick Rothfuss',     'Epic Fantasy',      1),
  ('The Way of Kings',                    'Brandon Sanderson',    'Epic Fantasy',      2),
  ('The Blade Itself',                    'Joe Abercrombie',      'Epic Fantasy',      3),

  ('The Three-Body Problem',              'Liu Cixin',            'Science Fiction',   1),
  ('A Fire Upon the Deep',                'Vernor Vinge',         'Science Fiction',   2),
  ('Blindsight',                          'Peter Watts',          'Science Fiction',   3),

  ('Hilary Mantel: Wolf Hall',            'Hilary Mantel',        'Historical Fiction', 1),
  ('The Name of the Rose',                'Umberto Eco',          'Historical Fiction', 2);


-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT genre, COUNT(*) AS count
FROM tbr_items
GROUP BY genre
ORDER BY genre;
