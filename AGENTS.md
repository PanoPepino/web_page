<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to Lovable. Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep the portfolio’s major content collections as separate TanStack routes so each is independently shareable and indexable.
- Keep downloads, images, and all nine presentation bundles inside public/. Use publicUrl() from src/lib/site-url.ts for links; never depend on sibling folders or the old deployed site.
- Render the reusable spacetime-grid interaction on canvas, calculate particle paths from equatorial Schwarzschild geodesics independently of the visual warp, and respect reduced-motion settings.
- Magic deck data comes from checked-in snapshots through getDeck() in src/lib/decks.ts. Refresh every entry in src/data/decks.json weekly (Friday 05:00 Europe/Stockholm), on manual workflow dispatch, or using bun run refresh:decks; never invent deck contents or sync dates. GitHub Pages cannot run API routes.
- Outreach language is URL state on the `/outreach` parent route so every child page and shared link preserves the selected language.

- GitHub Pages build uses /web_page/ as base and deploys only .output/public. Run bun run build:pages to prerender and verify local links. Keep compatibility redirects and presentation URLs stable.
