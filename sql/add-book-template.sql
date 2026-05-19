-- ============================================================
-- ADD A NEW BOOK — template for reading-tracker
-- ============================================================
-- Fill in every <PLACEHOLDER> below, then run both blocks
-- against the Supabase project (tecausrddsmjahbzijoj).
-- Step 1: insert the book row.
-- Step 2: insert one schedule_days row per reading day.
-- ============================================================


-- ============================================================
-- STEP 1 — books row
-- ============================================================

INSERT INTO books (
  slug,             -- URL-safe identifier, e.g. 'name-of-the-wind'
  title,            -- Full title as displayed
  author,           -- Full author name
  genre,            -- Short genre label shown on card, e.g. 'Fantasy'
  vibe_notes,       -- One-sentence mood/vibe; first sentence shown on card
  total_pages,      -- Last page number in the physical book
  current_page,     -- Page just before the schedule starts (pages_start - 1).
                    --   Reading from page 1 → use 0.
                    --   Starting mid-book at page 205 → use 204.
  status,           -- 'active' to show on home page
  cover_image_path, -- Public URL to cover image, or NULL if none
  theme             -- JSON object controlling card colors and fonts (see below)
)
VALUES (
  '<slug>',
  '<Title>',
  '<Author>',
  '<Genre>',
  '<Vibe notes.>',
  <total_pages>,
  <current_page>,
  'active',
  NULL, -- or '/covers/my-cover.jpg'
  '{
    "card_bg":     "#f5efe0",
    "accent":      "#8b6914",
    "accent2":     "#5c3317",
    "text":        "#1a1008",
    "text_light":  "#5a4020",
    "border":      "#8b6914",
    "font_display": "Cinzel",
    "font_body":   "Crimson Text"
  }'
  -- Available Google Fonts (already loaded in the app):
  --   font_display / font_body options:
  --     "Playfair Display"     — elegant serif, good for literary fiction
  --     "EB Garamond"          — classic book serif, great for body text
  --     "Cinzel"               — roman-inspired caps, good for fantasy/epic
  --     "Crimson Text"         — warm readable serif
  --     "Cormorant Garamond"   — refined, slightly condensed serif
);


-- ============================================================
-- STEP 2 — schedule_days rows (one per reading day)
-- ============================================================
-- percent_done formula: ROUND(pages_end::numeric / total_pages * 100)
-- chapters: use a short label like 'Ch. 1–3' or 'Prologue' or 'Part II'
-- date_label format: 'Mon, May 19'
-- ============================================================

INSERT INTO schedule_days (
  book_id,
  day_number,
  date,
  date_label,
  chapters,
  pages_start,
  pages_end,
  pages_count,
  percent_done
)
VALUES
  ((SELECT id FROM books WHERE slug = '<slug>'), 1,  '<YYYY-MM-DD>', '<Day, Mon DD>', '<Ch. X–Y>', <start>, <end>, <end - start + 1>, ROUND(<end>::numeric / <total_pages> * 100)),
  ((SELECT id FROM books WHERE slug = '<slug>'), 2,  '<YYYY-MM-DD>', '<Day, Mon DD>', '<Ch. X–Y>', <start>, <end>, <end - start + 1>, ROUND(<end>::numeric / <total_pages> * 100)),
  ((SELECT id FROM books WHERE slug = '<slug>'), 3,  '<YYYY-MM-DD>', '<Day, Mon DD>', '<Ch. X–Y>', <start>, <end>, <end - start + 1>, ROUND(<end>::numeric / <total_pages> * 100));
  -- ... continue for all days


-- ============================================================
-- VERIFICATION — run after inserting to sanity-check the data
-- ============================================================

SELECT
  day_number,
  date,
  date_label,
  chapters,
  pages_start,
  pages_end,
  pages_count,
  percent_done
FROM schedule_days
WHERE book_id = (SELECT id FROM books WHERE slug = '<slug>')
ORDER BY day_number;
