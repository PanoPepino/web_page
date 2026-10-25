# GitHub Pages deployment

## Target

Repository: `PanoPepino/web_page`
Site: `https://panopepino.github.io/web_page/`

The workflow builds and deploys this repository's source to GitHub Pages. It preserves the existing repository history and publishes only `.output/public`.

One-time GitHub setup: choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. In **Settings → Actions → General → Workflow permissions**, allow the workflow to write repository contents. The repository’s default branch is `main`; allow the workflow bot to push to it if branch rules restrict pushes.

After setup, each push to `main` installs the locked Bun 1.4.2 dependencies, builds and checks the site, then deploys `.output/public` through GitHub Pages Actions. Schedule runs each Friday at 05:00 Europe/Stockholm and refresh every deck. They commit refreshed snapshots and deploy them within that run. Manual dispatch on the default branch runs the same refresh and deployment. Runs dispatched from other branches are skipped, avoiding feature-branch deployment or writes to `main`.

Friday deployments refresh `/projects` descriptions from Overview sections on the existing Notion pages. Weekend deployments refresh decks only. Push deployments use checked-in project snapshots. Configure `NOTION_TOKEN` as an Actions secret and share the project parent pages with the integration. The cloud refresh reads fixed page IDs; Tasks and README content remain outside the website sync. dAIana stays out of website cards. Source validation failure stops deployment before project snapshots change.

GitHub Actions supports IANA timezone schedules such as `Europe/Stockholm`; runs can be delayed during high load. [Schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule)

## Build

```sh
bun install --frozen-lockfile
bun run build:pages
```

`build:pages` sets `GITHUB_PAGES=true`, giving assets and router the `/web_page/` base path. Ordinary `bun run dev` uses `/`. Each public route receives an HTML file for direct visits and refreshes. Compatibility redirects are generated into the output after prerendering. The final verification command checks route HTML, public files, presentation media links, and HTML/CSS links.

Upload source, catalogs, public assets, scripts, configuration, lockfile, and workflow. Exclude `node_modules`, `.output`, build caches, `.lovable` editor metadata, `.DS_Store`, and backups; `.gitignore` lists these exclusions. Server artifacts created during prerendering are not deployed.

## Content and files

- Slide cards and preview generation share `src/data/slides.json`.
- All nine presentation bundles remain in `public/main_page/presentations`, preserving old URLs and relative media paths.
- Downloads are served from `public/downloads`; images come from `public/assets`.
- Old page URLs redirect to their matching routes; individual postcard URLs open the corresponding postcard.
- No file or maintenance script requires `old_webpage/`, `webpage/`, or the old published site.

Presentation HTML loads Reveal.js and highlighting libraries from its existing external CDNs. Fonts also use Google Fonts. These external library services remain dependencies.

## Deck snapshots

GitHub Pages cannot run a deck API. The MTGA page reads checked-in snapshots from `src/data/moxfield-seeds.json`. Decks without snapshots link to Moxfield and display no invented lists.

The weekly schedule and manual workflow dispatch refresh **every entry** in `src/data/decks.json`, then build, commit verified snapshots and deploy within the same run. Add future decks to that catalog with a unique `moxfieldId`, display `name`, and local artwork `image`; no workflow changes or hardcoded deck count are needed. Put artwork in `public/assets/magic/` and commit catalog/image changes together.

Refresh uses Moxfield v3 for commanders, mainboard and card types, then `/v1/decks/{internalId}/primer` for English and Spanish primer text; sideboard is excluded. Display groups use front-face type, count quantities, and list each card once. Card groups use two columns when content width reaches 34rem, otherwise one. English panels `[ENG]`, `[EN]`, `[English]` and Spanish panels `[ESP]`, `[ES]`, `[Spanish]`, `[Español]` are extracted without translation. For an unmarked primer, set `primerLanguage` to `"en"` or `"es"` on its catalog entry. Description language defaults to English and remembers selection while browsing MTGA decks. Missing languages display an unavailable message; failed primer requests preserve prior primer text and its separate sync date. Copying uses a shared Arena formatter: quantity-first lines under Commander/Deck headers, with no sideboard or display counts. Double-faced and adventure cards use front-face names; Rooms and ordinary split cards use ` // `, and aftermath split cards use ` /// `. No paper set/collector codes are forced on Arena. Primer card references also receive hover/focus/tap previews. Optional catalog `primerCardIds` maps a misspelled reference to a verified Scryfall ID while preserving original primer wording. Scryfall collection lookups save card-page and hosted image URLs. Preview images load on hover, focus or tap, so Scryfall image hosting remains an external dependency.

A failed deck fetch preserves its previous snapshot and timestamp. Other catalog decks still refresh. If every deck fetch fails, the run fails before deployment. Actions logs and job summary report successful and failed counts. A newly added deck with no successful fetch displays its Moxfield link until its first snapshot is saved.

Local refresh remains available: `bun run refresh:decks`, inspect changes, then commit. Push-triggered deployments use committed snapshots. The weekly schedule becomes active when workflow reaches the repository default branch; GitHub may delay execution. The build job needs repository write permission to persist snapshots; branch rules must permit its bot commit. Commits made by the workflow token do not trigger another push deployment; this run already deploys refreshed output.

## Weekly change receipt

The existing deployment workflow saves deck, project-card and project-tree snapshots before refresh.
Its Actions summary and downloadable `website-changes` Markdown artifact list
only card quantity changes, changed deck names/primer paragraphs and changed
project tile text, technologies or links, plus project-tree entries, hierarchy and URLs. Refresh timestamps, image metadata and
whitespace-only edits are ignored. Failed builds/deployments are labelled in the
summary; a computed diff alone does not prove publication. Scheduled/manual runs
save deck and both generated project snapshots to avoid reporting the same refresh
again. Enable GitHub Actions Email notifications for a status email linking to
the receipt; no email service or additional token is required.
