# Add Book to Reading Tracker

Adds a new book to the reading tracker by inserting rows into Supabase.

## What you need from the user

Ask for anything not provided:

- **Title** and **Author**
- **Genre** — short label shown on card (e.g. "Fantasy", "Literary Fiction")
- **Vibe notes** — one or two sentences describing mood/feel; first sentence appears on the home card
- **Total pages** — last page number in the physical book
- **Start page** — first page of the reading schedule (1 if starting from the beginning)
- **Start date** — first day of the reading schedule (YYYY-MM-DD)
- **Finish date** — target last day of the reading schedule
- **Chapter breakdown** — which chapters fall on which days (can be approximate; ask the user to provide a list or describe the pacing)
- **Cover image** — optional; ask if they have one to upload

## Database details

- Supabase project ID: `tecausrddsmjahbzijoj`
- Use `mcp__claude_ai_Supabase__execute_sql` to run all queries
- Reference template: `sql/add-book-template.sql`

## Step 1 — Insert the books row

```sql
INSERT INTO books (
  slug, title, author, genre, vibe_notes,
  total_pages, current_page, status, cover_image_path, theme
)
VALUES (
  '<slug>',         -- kebab-case, e.g. 'name-of-the-wind'
  '<Title>',
  '<Author>',
  '<Genre>',
  '<Vibe notes.>',
  <total_pages>,
  <start_page - 1>, -- page just before schedule begins; 0 if starting from page 1
  'active',
  NULL,             -- update later if cover image is provided
  '<theme_json>'
);
```

### Choosing a theme

Pick colors and fonts that match the book's tone. Available Google Fonts (already loaded):

| Font | Character |
|------|-----------|
| `Cinzel` | Roman-inspired caps — epic fantasy, classical |
| `Playfair Display` | Elegant serif — literary fiction, drama |
| `EB Garamond` | Classic book serif — historical, quiet stories |
| `Crimson Text` | Warm readable serif — general fiction |
| `Cormorant Garamond` | Refined, slightly condensed — poetry, lyrical prose |

Theme JSON shape:
```json
{
  "card_bg":      "#f5efe0",
  "accent":       "#8b6914",
  "accent2":      "#5c3317",
  "text":         "#1a1008",
  "text_light":   "#5a4020",
  "border":       "#8b6914",
  "font_display": "Cinzel",
  "font_body":    "Crimson Text"
}
```

## Step 2 — Generate the reading schedule

Compute the schedule days from the chapter breakdown and date range:

- Spread days evenly between start and finish dates, skipping no days unless the user asks
- `pages_count` = `pages_end - pages_start + 1`
- `percent_done` = `ROUND(pages_end::numeric / total_pages * 100)` — always book-relative, not schedule-relative
- `date_label` format: `'Tue, May 19'`
- `chapters` label: short string like `'Ch. 1–3'`, `'Prologue'`, `'Part II, Ch. 7–9'`

Insert all schedule days in a single statement:

```sql
INSERT INTO schedule_days (
  book_id, day_number, date, date_label,
  chapters, pages_start, pages_end, pages_count, percent_done
)
VALUES
  ((SELECT id FROM books WHERE slug = '<slug>'), 1, '<YYYY-MM-DD>', '<Day, Mon DD>', '<Ch. X–Y>', <start>, <end>, <count>, <pct>),
  ((SELECT id FROM books WHERE slug = '<slug>'), 2, '<YYYY-MM-DD>', '<Day, Mon DD>', '<Ch. X–Y>', <start>, <end>, <count>, <pct>),
  ...;
```

## Step 3 — Verify

Run the verification query to confirm data looks correct:

```sql
SELECT day_number, date, date_label, chapters,
       pages_start, pages_end, pages_count, percent_done
FROM schedule_days
WHERE book_id = (SELECT id FROM books WHERE slug = '<slug>')
ORDER BY day_number;
```

Check:
- `pages_start` of day N = `pages_end` of day N-1 + 1
- `percent_done` on the last day = 100 (or close to it)
- Date range matches what the user asked for
- No gaps or overlaps in page ranges

## Step 4 — Cover image (if provided)

If the user supplies a cover image, tell them to drop it in the `covers/` directory, then update:

```sql
UPDATE books SET cover_image_path = '/covers/<filename>' WHERE slug = '<slug>';
```

## After inserting

Tell the user the book is live on the home page. Offer to commit and push to origin and vercel if they want.
