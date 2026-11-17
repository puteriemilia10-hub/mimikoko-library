# MIYUU90 OBS Overlay Quick Start

1. Publish this website to Cloudflare Pages using the main README.
2. In OBS, open **Sources** → **+** → **Browser**.
3. Name the source (for example `MIYUU90 - Now Reading`).
4. Paste your deployed URL with `obs-overlay.html?layer=now`.
5. Set Width `900`, Height `500`, then click OK.
6. Add another Browser Source for each separate layer you want.

## Layer URLs

Use your own Cloudflare Pages domain in place of `YOUR-SITE.pages.dev`.

| Layer | URL suffix | Suggested size |
|---|---|---:|
| Current book | `/obs-overlay.html?layer=now` | 900 × 500 |
| Reading progress | `/obs-overlay.html?layer=progress` | 700 × 400 |
| Bottom ticker | `/obs-overlay.html?layer=ticker` | 1920 × 1080 |
| Currently reading shelf | `/obs-overlay.html?layer=reading&limit=3` | 1100 × 600 |
| TBR shelf | `/obs-overlay.html?layer=tbr&limit=5` | 1200 × 700 |
| Finished shelf | `/obs-overlay.html?layer=finished&limit=5` | 1200 × 700 |

The background is transparent. Position and resize each Browser Source independently in OBS. Data refreshes every 60 seconds by default; add `&refresh=30` to refresh every 30 seconds.

**Important:** Supabase must be configured and populated for the overlays to show your live online catalogue. Without Supabase configuration, overlays use the bundled JSON preview data.

## Dedicated TBR overlay

Add a Browser Source named MIYUU90 - TBR with URL https://YOUR-SITE.pages.dev/obs-tbr.html. Set Width 820 and Height 420. The canvas is transparent; the cream shelf shows five To read books with saved covers. It cycles through your full TBR every 30 seconds and refreshes Supabase every 60 seconds. No admin login is needed.

Options: ?limit=3 for three books; ?cycle=0 to stop rotation; ?cycle=30&refresh=30 for 30-second rotation and refresh. Limit supports 1-10 (more than five uses a second row; increase source height to 700). Rotation has a five-second minimum. If no TBR books exist, the overlay shows an empty state. A configured database failure shows an error instead of displaying sample books.

TBR list changes animate with a soft fade-out followed by staggered slide-in book cards. The shelf heading stays visually steady. Unchanged refreshes do not replay the animation. Add ?animate=0 (or &animate=0 after other options) to disable motion. The overlay also respects the browser reduced-motion preference.
