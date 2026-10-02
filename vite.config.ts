// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, PluginOption } from "vite";

const basepath = process.env["GITHUB_PAGES"] === "true" ? "/web_page" : "";

const wrappedConfig = defineConfig({
  vite: {
    base: basepath ? `${basepath}/` : "/",
    resolve: { tsconfigPaths: true },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    router: { basepath },
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: true,
      // Route discovery already collects file routes. Crawling links also tries
      // to prerender PDFs, downloads, and external destinations as pages.
      crawlLinks: false,
      failOnError: true,
      concurrency: 4,
    },
  },
});

// The wrapper injects vite-tsconfig-paths. Remove it before Vite resolves
// plugins; native resolve.tsconfigPaths above now handles the same aliases.
export default async (env: ConfigEnv) => {
  const config = await wrappedConfig(env);
  return {
    ...config,
    plugins: config.plugins?.filter(
      (plugin: PluginOption) =>
        typeof plugin !== "object" ||
        plugin === null ||
        Array.isArray(plugin) ||
        !("name" in plugin) ||
        plugin.name !== "vite-tsconfig-paths",
    ),
  };
};
