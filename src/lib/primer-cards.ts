export function primerCardNameFromUrl(href?: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.hostname !== "scryfall.com" || url.pathname !== "/search") return null;
    return /^!"(.+)"$/.exec(url.searchParams.get("q") ?? "")?.[1] ?? null;
  } catch { return null; }
}

export function primerCardNames(markdown: string): string[] {
  const names = new Set<string>();
  for (const match of markdown.matchAll(/\[[^\]\n]+\]\((https:\/\/scryfall\.com\/search\?[^\s)]+)\)/g)) {
    const name = primerCardNameFromUrl(match[1]);
    if (name) names.add(name);
  }
  return [...names];
}
