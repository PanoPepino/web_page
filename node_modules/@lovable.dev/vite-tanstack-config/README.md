# @lovable.dev/vite-tanstack-config

Vite config wrapper for Lovable TanStack Start projects.

## What It Does

- Gives TanStack Start projects a single `defineConfig` helper for local preview and production builds.
- Keeps Lovable sandbox previews predictable by setting the server shape, watched paths, HMR coordination, and asset routing expected by the platform.
- Adds diagnostics that help the preview tell build, Vite, SSR, and app errors apart.
- Produces deployable build output for Lovable while still letting self-hosted projects choose their own target.

## Customization

Apps can pass through Vite options and adjust the React, TanStack Start, Nitro, HMR gate, and error-logging behavior when they need to.

## Build exit watchdog

Inside a Lovable build with prerender enabled, the build process is forced to exit if it is still alive 60 seconds after the last build hook has returned, and a `[lovable-build-exit-report]` block naming the open handle types is written to stderr. Adjust it with `defineConfig({ buildExitWatchdog: { graceMs, enabled } })`; the grace is clamped to 5 s–10 min. The `LOVABLE_PRERENDER_EXIT_GRACE_MS` and `LOVABLE_PRERENDER_EXIT_WATCHDOG=off` environment variables override the config.

## Route manifest

Inside a Lovable build, the route surface of the app is written to `dist/.lovable/routes.json` after the build: `{ version, generator, basepath?, serverEntry, requestMiddleware?, urlInspection, routes }`, where `routes` is the generated route tree's `fullPaths` union in TanStack path syntax (`/posts/$postId`, `/files/$`, `/docs/{-$version}`). Lovable's serving layer uses it to answer requests no route can match without starting the app. The file is enumerated with `@tanstack/router-generator` through an in-memory overlay, so the build never rewrites `routeTree.gen.ts`, and it is skipped — with a warning naming the reason — whenever the app can answer paths outside its route tree: `tanstackStart.spa`, `router.virtualRouteConfig`, `nitro.routeRules`/`handlers`, a project `nitro.config.*` / `.config/nitro.*` / `.nitrorc` file (Nitro loads it on its own, so the wrapper cannot see what it adds), a `rewrite` in the router file, a `basepath` there that `tanstackStart.router.basepath` does not declare (a computed or shorthand one included), or a router file (`router.entry`, resolved the way TanStack Start resolves it) that cannot be read to check either.

`urlInspection` tells the serving layer whether the code that runs ahead of route matching could answer a request from its URL; only `none` lets it enforce the manifest, every other value keeps it advisory. The wrapper reads the server entry (`server.entry`, or `src/server.ts` by convention — the same rule sets `serverEntry`) and the start entry (`start.entry` or `src/start.ts`, whose `requestMiddleware` runs before the router) together with every module they import through relative or `@/` paths, with comments and string contents removed, and reports `server_entry`, `request_middleware` or `both` when any of it names the URL, one of its parts (`pathname`, `searchParams`, `path`), a redirect (`redirect`, `Location`, a `30x` status) or a not-found answer (`404`, `notFound`). It reports `unknown` instead of guessing when a module cannot be resolved or read, when a module is loaded by a computed specifier or `import.meta.glob`, when the closure imports a package other than `node:*`/`@tanstack/*` (a mounted framework can route without naming the URL), or when it outgrows 32 files / 256 KiB. The template's `server.ts` and `start.ts` read as `none`; keep them free of those names, or new projects stop asserting it.
