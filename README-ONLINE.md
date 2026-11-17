# MIYUU90 Digital Library — Full starter

This is a deployable static website with a public bookshelf, search/filtering, mobile layout, Supabase-backed publishing and a private CSV import panel. Your supplied Bookmory catalogue is included as a local preview/fallback. The separate Notes CSV is deliberately not included.

## What works now
- Public browsing and search across the 202-book Bookmory catalogue.
- Shelf filters (To read, Reading, Completed, Pause, Gave up).
- Responsive design and a current-reading section.
- Supabase connection support (public read; signed-in admin import).
- Bookmory CSV parser and repeatable upsert using a stable book key.
- Reading notes are excluded from import and public pages.

## Before going online
You need to create your own free accounts and connect the project. I cannot create accounts, accept terms, or publish it under your identity.

### A. Create Supabase database (free tier)
1. Go to https://supabase.com/ and create an account/project.
2. Choose a project name such as `miyuu90-library`, set a strong database password and choose a nearby region.
3. In the project dashboard open **SQL Editor** → **New query**.
4. Open `supabase-setup.sql` from this folder, copy all its contents, paste into SQL Editor and click **Run**.
5. Open **Project Settings → API** (or **Data API / API Keys**, depending on dashboard version). Copy the **Project URL** and the **anon/public key**. Never copy or publish the `service_role` / secret key.
6. Open `config.js` in this folder and replace `https://YOUR-PROJECT.supabase.co` and `YOUR_SUPABASE_ANON_KEY` with those two values. Save.
7. In Supabase **Authentication → Providers / Sign In**, ensure Email is enabled. In **Authentication → Settings**, disable public sign-ups if available.
8. In **Authentication → Users**, add/create your own admin user with your email and a strong password. Do not share that password. Only people you deliberately create as users will be able to import because the database write policy requires authentication.

### B. Test it on your computer (no Python needed)
1. Install Visual Studio Code: https://code.visualstudio.com/ .
2. Extract this ZIP to a normal folder, e.g. `C:\Users\YOURNAME\MIYUU90_Digital_Library_Full`.
3. Open that folder in VS Code (**File → Open Folder**).
4. Install the **Live Server** extension by Ritwick Dey.
5. Right-click `index.html` → **Open with Live Server**.
6. Click **Library admin**, sign in with the Supabase admin user, select a fresh Bookmory library CSV and click **Import and publish CSV**.
7. Open the site in another browser/private window and confirm the public shelf displays the imported books. The admin panel should remain inaccessible to visitors without the login.

### C. Publish online with Cloudflare Pages (free static hosting)
1. Create a GitHub account at https://github.com/ if you do not already have one.
2. Create a **private** repository named `miyuu90-digital-library` (private is recommended because the project contains your catalogue export).
3. Upload the project files and folders from this ZIP to the repository root: `index.html`, `styles.css`, `app.js`, `config.js`, `supabase-setup.sql`, `README-ONLINE.md`, and `data/books.json`. Do not upload the separate Bookmory notes export.
4. Create/sign in to Cloudflare at https://dash.cloudflare.com/ .
5. Open **Workers & Pages → Create → Pages → Connect to Git**; connect GitHub and select the repository.
6. For a plain static site, use no build command and set the build output directory to `/` (or the repository root, as Cloudflare's UI requests). Save and deploy.
7. Cloudflare gives you a `*.pages.dev` address. Open it on your phone and another browser to test public access.
8. Every time you push an update to GitHub, Cloudflare Pages automatically redeploys. Book imports do not require a redeploy because they update Supabase directly.

### D. Daily update workflow
1. Update your reading in Bookmory on Android.
2. Export the **library** CSV (not Notes CSV).
3. Visit your public site and click **Library admin**.
4. Sign in, choose the new CSV, click **Import and publish CSV**.
5. Refresh the public page/OBS Browser Source. The database update is live for all visitors.

## Security and privacy notes
- `config.js` contains only the Supabase URL and anon/public key. Those are intended for browser use; database access is controlled by Row Level Security policies in `supabase-setup.sql`.
- Never put a Supabase `service_role` key, database password, or admin password in website files, GitHub, OBS, or chat.
- The SQL policy allows any authenticated account to manage books. Keep public sign-ups disabled and only create accounts for trusted admins. If you need multiple roles later, replace this with an explicit admin allow-list.
- The public catalogue includes book titles/authors/statuses/page totals/ratings/tags from the Bookmory library export. It does not include your private notes. Review the public content before uploading if you want to hide any titles or statuses.
- Book cover URLs are blank in this first full version. Add cover image URLs later in the database; do not scrape copyrighted book cover images from random sources without checking permitted use.
- Supabase and Cloudflare have free tiers and usage limits; terms and quotas can change. This package itself is free, but third-party plans may change.

## Twitch / OBS
- Add the public website URL as an OBS **Browser Source** for a full bookshelf display.
- For a compact current-reading overlay, use the URL with `?view=overlay` only after a future overlay view is implemented. This starter does not yet include a dedicated overlay route or Twitch chatbot connection; the public website itself is ready to display in OBS as a browser source.
- Twitch chat commands need a chatbot (for example, StreamElements or a custom bot) and should link to the public library URL. The chatbot is not configured by this package.

## Troubleshooting
- If the page shows “Preview mode”, check `config.js`, project URL/key and that the SQL script ran successfully.
- If admin sign-in fails, confirm the user exists in Supabase Auth and Email provider is enabled.
- If CSV import reports a permission error, check that you are signed in and the RLS policies in `supabase-setup.sql` exist.
- If deployment returns 404, confirm `index.html` is at the repository root and the Pages output directory points to that root.


## OBS browser-source overlays

The package includes `obs-overlay.html`, a transparent overlay designed for OBS Browser Source. Once the website is deployed to Cloudflare Pages, add Browser Sources using these URLs (replace the example domain with your actual Pages URL):

- Current book card: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=now`
- Reading progress card: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=progress`
- Small bottom ticker: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=ticker`
- Currently-reading shelf: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=reading&limit=3`
- TBR shelf: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=tbr&limit=5`
- Completed shelf: `https://YOUR-SITE.pages.dev/obs-overlay.html?layer=finished&limit=5`

In OBS: Sources → + → Browser → paste a URL. Set width/height to 1920×1080 for a full canvas (the overlay content itself stays compact and transparent), or use 900×500 for shelf cards. Enable “Shutdown source when not visible” only if you are happy for the source to reload when shown. The overlay refreshes data every 60 seconds by default; change this with `&refresh=30` (minimum 15 seconds).

The overlay uses Supabase live catalogue data when `config.js` is configured, otherwise it loads the bundled sample catalogue from `data/books.json`. Reading page progress will remain 0 until you add a current-page value in the database/admin editor; Bookmory's provided export does not include a reliable current-page field in this export.

Each overlay URL is a separate OBS layer, so you can show/hide, position, resize and stack them independently. The HTML body is transparent; only the designed card/ticker is visible.

## Book covers

After importing your catalogue, sign in to Library admin and click Find book covers. Keep the page open until the search finishes. This sends batches of up to ten book titles to Open Library, requires an exact normalized title and author match, and saves matched cover URLs in Supabase. Existing cover URLs are preserved. No extra API key or SQL migration is needed. Books with ISBNs can also display Open Library ISBN covers automatically.

Unmatched books keep the designed title/author placeholder. A matched cover may represent a different edition. You can set a custom HTTPS image URL in the books table cover_url column. CSV reimports now preserve cover_url and current_page. Public pages and OBS use the saved covers without performing title searches. Cover images are served by Open Library; availability depends on that service.

## Google Books fallback setup

Find book covers now tries Open Library first, then Google Books for unmatched books. It preserves existing cover URLs and only writes cover_url. Google matches require an exact normalized title and author, or the same ISBN. Images can show a different edition. Missing keys skip Google with an explanatory status; provider failures leave saved progress intact.

1. Open https://console.cloud.google.com/ and create or choose a project.
2. In APIs & Services > Library, find Books API and enable it.
3. In APIs & Services > Credentials, create an API key. Restrict its API access to Books API.
4. For browser use, apply Websites / HTTP referrer restrictions for the actual origin you use. For this local site, include http://127.0.0.1:5500/* (and http://localhost:5500/* only if used). Add your published domain when deploying.
5. Paste the key into googleBooksApiKey in config.js and save. This is a separate Google key, not a Supabase key. Do not use an OAuth client secret or service account file.
6. Hard-refresh the page, sign in to Library admin, and click Find book covers. Keep the page open.

The integration has been checked with simulated provider responses; a live Google search requires your own enabled key. Consult https://developers.google.com/books/docs/v1/using and https://docs.cloud.google.com/docs/authentication/api-keys for current setup details.
