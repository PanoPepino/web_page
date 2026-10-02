# Daniel Panizo — website

Self-contained React and TanStack Start website prepared to replace the existing `PanoPepino/web_page` GitHub Pages site. This directory contains portfolio artwork, downloads and presentations. Card miniatures use Scryfall hosting.

## Develop and build

Use Bun 1.4.2:

```sh
bun install --frozen-lockfile
bun run dev
bun run build:pages
```

The Pages build prerenders routes, generates compatibility redirects, and checks local links. Deployable output is `.output/public`.

## Directory layout

| Directory | Purpose |
| --- | --- |
| `src/routes` | Shareable page routes; edit home in `index.tsx` |
| `src/components` | Reusable site and interface components |
| `src/data` | Slide/deck catalogs, outreach copy, location/map data, deck snapshots |
| `src/lib` | Shared URL helpers and data access |
| `public/assets` | Outreach, Magic, and slide preview images |
| `public/downloads` | CVs, publications, notes, and templates |
| `public/main_page/presentations` | Nine standalone presentation bundles and relative media |
| `scripts` | Snapshot refresh, thumbnail generation, redirects, output verification |
| `.github/workflows` | GitHub Pages deployment |

Use `publicUrl()` for public files and `siteUrl()` for canonical URLs. Keep each asset in one place. Site routes load separately, tile images load lazily, and presentation videos load only when a presentation is opened.

To add a visible talk, edit `src/data/slides.json` and put its HTML/media bundle in `public/main_page/presentations`. Generate previews with `python3 scripts/generate-slide-thumbnails.py` on macOS. The script reads this project's files and needs Quick Look and `sips`.

Add decks in `src/data/decks.json` with unique Moxfield IDs and artwork filenames from `public/assets/magic/`. All catalog entries refresh Friday at 05:00 Stockholm time and on manual workflow dispatch. Refresh locally with `bun run refresh:decks`. Descriptions use English/Spanish Moxfield primer panels. Set optional `primerLanguage: "en"` or `"es"` for a single-language primer without marked panels. The description toggle remembers selection while browsing decks.

See [CLEANUP.md](CLEANUP.md) for removal inventory and verification evidence. `GITHUB_UPLOAD.txt` lists files prepared for upload.

See [DEPLOYMENT.md](DEPLOYMENT.md) for replacement and publishing instructions.
