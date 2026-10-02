import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputRoot = fileURLToPath(new URL("../.output/public/", import.meta.url));
const basePath = process.env.GITHUB_PAGES === "true" ? "/web_page" : "";
const destinations = new Map([
  ["main_page/cv_documents.html", "/outline/"],
  ["main_page/didactical_notes.html", "/notes/"],
  ["main_page/slides.html", "/slides/"],
  ["main_page/magic.html", "/magic/"],
  ["main_page/outreach.html", "/outreach/"],
  ["main_page/outreach_content/outreach_index_eng.html", "/outreach/"],
  ["main_page/outreach_content/outreach_index_esp.html", "/outreach/"],
  ["main_page/outreach_content/outreach_contents_lvl_2/outreach_history_eng.html", "/outreach/history/"],
  ["main_page/outreach_content/outreach_contents_lvl_2/outreach_history_esp.html", "/outreach/history/"],
  ["main_page/outreach_content/outreach_contents_lvl_2/outreach_postcard_eng.html", "/outreach/postcards/"],
  ["main_page/outreach_content/outreach_contents_lvl_2/outreach_postcard_esp.html", "/outreach/postcards/"],
]);

const postcardDirectory = "main_page/outreach_content/outreach_contents_lvl_2/outreach_contents_lvl_3";
const postcardSlugs = ["1_cosmology", "2_eft", "3_st", "4_landscape", "5_swamp", "6_db"];
for (let index = 0; index < postcardSlugs.length; index += 1) {
  for (const language of ["eng", "esp"]) {
    destinations.set(`${postcardDirectory}/${postcardSlugs[index]}_${language}.html`, `/outreach/postcards/?card=${index + 1}`);
  }
}

for (const [relativePath, destination] of destinations) {
  const redirectUrl = `${basePath}${destination}`;
  const filePath = join(outputRoot, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${redirectUrl}"><link rel="canonical" href="https://panopepino.github.io/web_page${destination}">
<title>Page moved — Daniel Panizo</title></head><body><p>This page moved. <a href="${redirectUrl}">Open the new page</a>.</p>
<script>
  const target = new URL(${JSON.stringify(redirectUrl)}, location.href);
  for (const [key, value] of new URLSearchParams(location.search)) {
    if (!target.searchParams.has(key)) target.searchParams.append(key, value);
  }
  target.hash = location.hash;
  location.replace(target.href);
</script></body></html>
`;
  await writeFile(filePath, html);
}

console.log(`Wrote ${destinations.size} legacy redirects.`);
