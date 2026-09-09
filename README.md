# MERN Prep

Interview preparation for the MERN stack — nine question banks, two learning
tracks, and a frontend-focused coding practice set. Mark what you know and the
hub keeps the tally.

Plain HTML, CSS and JavaScript. **No build step, no dependencies, no framework.**

## What's in it

| Page | What it covers | Worked | Rapid-fire |
| --- | --- | ---: | ---: |
| `javascript-interview.html` | The language round | 36 | 10 |
| `react-interview.htm` | Hooks deep dive | 32 | 10 |
| `nodejs-interview.html` | Runtime + output prediction | 32 | 7 |
| `express-interview.html` | Middleware and routing | 30 | 9 |
| `mongodb-interview.html` | Queries, aggregation, schema design | 31 | 11 |
| `system-design-interview.html` | The architecture round | 29 | 8 |
| `html-css-interview.html` | Layout and the rendering pipeline | 32 | 10 |
| `dsa-interview.html` | DSA theory — Big-O, structures, traversals | 38 | 10 |
| `mern-guide.html` | Cross-stack overview, by topic | 25 | — |
| `dsa-frontend.html` | Coding practice — 57 problems, hints + solutions | 57 | — |
| `learn-javascript.html` | Teaching track — 8 modules | — | — |
| `learn-typescript.html` | Teaching track — 9 modules | — | — |
| `index.html` | Hub: progress, failure map, flashcard deck | — | — |

**342 worked answers** across the ten marked topics. The hub total is computed at
runtime from the `TOPICS` manifest — it is not hardcoded.

## Running it locally

Open `index.html` in a browser. That's it — `file://` works, because nothing
fetches anything.

If you'd rather serve it over HTTP (closer to how GitHub Pages behaves):

```bash
npx serve .
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` publishes the repository as-is on every push to
`main`. There is nothing to compile.

One-time setup:

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.

Every later push to `main` redeploys. You can also trigger a deploy by hand from
the **Actions** tab (the workflow has `workflow_dispatch` enabled).

The site lands at `https://<username>.github.io/<repository>/`.

## Adding content

New questions and problems live in plain HTML using the markup vocabulary that
`assets/app.js` reads at runtime: `.cover`, `.level`, `.q` with a `Qn:` or `Pn:`
text prefix, `.tip`, and a `<table>` for the quick-fire round. Question numbers,
the contents sidebar, scroll-spy, code highlighting and the progress chips are
all generated from that markup — there is no per-page JavaScript.

Three places encode the counts and **must stay in sync**:

1. `assets/app.js` — the `TOPICS` manifest (`worked` drives the progress math)
2. `index.html` — the guide's ramp-bar segments and row total
3. The page's own cover `.badge`

**Never renumber existing questions.** Progress marks are keyed to the text
prefix (`P41:` becomes the key `p41`), so renumbering silently reattaches saved
marks to the wrong questions. Append new sections with fresh numbers instead.

## Notes

- **Progress is per-browser.** Marks and the theme choice live in
  `localStorage` (`prep.marks.<topic>`, `prep.theme`), so they do not sync
  between devices — and marks made while testing locally over `file://` will not
  appear on the deployed site, which is a different origin.
- **Fonts** load from the Google Fonts CDN, with system fallbacks if that is
  blocked.
- `react-interview.htm` keeps its `.htm` extension deliberately — links point at
  it. GitHub Pages is case-sensitive, so leave filename casing alone.
- `404.html` is intentionally self-contained (inline CSS): GitHub Pages serves it
  at any depth, where a relative `assets/` path would not resolve.
