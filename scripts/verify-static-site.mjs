import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const output = join(project, ".output/public");
const source = join(project, "public");
const base = process.env.GITHUB_PAGES === "true" ? "/web_page/" : "/";
const origin = "https://panopepino.github.io";
const routes = ["", "outline", "slides", "notes", "magic", "outreach", "outreach/history", "outreach/postcards"];
const failures = new Set();

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }));
  return nested.flat();
}

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function checkReference(value, from) {
  if (!value || value.startsWith("#") || /^(data|mailto|tel|javascript|blob):/i.test(value)) return;
  const url = new URL(value.replaceAll("&amp;", "&"), `${origin}${base}${relative(output, from)}`);
  if (url.origin !== origin) return;
  if (!url.pathname.startsWith(base)) {
    failures.add(`${relative(output, from)}: URL escapes deployment base: ${value}`);
    return;
  }
  const path = join(output, decodeURIComponent(url.pathname.slice(base.length)));
  if (!await exists(path) && !await exists(join(path, "index.html"))) {
    failures.add(`${relative(output, from)}: missing local target: ${value}`);
  }
}

for (const route of routes) {
  if (!await exists(join(output, route, "index.html"))) failures.add(`Missing prerendered route: /${route}`);
}

// Every checked-in public file must reach the artifact, including all decks,
// original media, downloads, previews, favicons, and generated redirects.
const publicFiles = (await files(source)).filter(path => !path.endsWith(".DS_Store"));
for (const path of publicFiles) {
  const built = join(output, relative(source, path));
  if (!await exists(built)) {
    failures.add(`Public file missing from output: ${relative(source, path)}`);
  } else if ((await stat(path)).size !== (await stat(built)).size) {
    failures.add(`Public file changed in output: ${relative(source, path)}`);
  }
}

const outputFiles = await files(output);
const redirects = outputFiles.filter(path => path.includes("/main_page/") && !path.includes("/presentations/") && path.endsWith(".html"));
if (redirects.length < 23) failures.add(`Missing compatibility redirects: expected at least 23, found ${redirects.length}`);
for (const path of outputFiles) {
  if (path.endsWith(".html")) {
    const html = (await readFile(path, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
    for (const tag of html.matchAll(/<(?:a|img|script|link|video|source|section)\b[^>]*>/gi)) {
      if (/\brel=["']canonical["']/i.test(tag[0])) continue;
      for (const attribute of tag[0].matchAll(/\b(?:href|src|poster|data-background-video)=["']([^"']+)["']/gi)) {
        await checkReference(attribute[1], path);
      }
    }
  } else if (path.endsWith(".css")) {
    const css = (await readFile(path, "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const reference of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
      await checkReference(reference[1], path);
    }
  }
}

if (failures.size) {
  throw new Error(`Static deployment verification failed:\n${[...failures].join("\n")}`);
}

const presentations = publicFiles.filter(path => path.includes("main_page/presentations/") && path.endsWith(".html")).length;
console.log(`Verified ${routes.length} routes, ${presentations} presentations, ${publicFiles.length} public files, ${redirects.length} redirects, and local HTML/CSS links under ${base}.`);
