/** Moxfield primer text may contain escaped newlines and Unicode literals. */
export type PrimerLanguage = "en" | "es";

export function extractPrimer(raw: string, language: PrimerLanguage, declaredLanguage?: PrimerLanguage): string {
  const content = (!raw.includes("\n") && raw.includes("\\n") ? raw
    .replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\r\\n|\\n|\\r/g, "\n").replace(/\\t/g, "\t")
    .replace(/\\"/g, '"') : raw).replace(/\r\n?/g, "\n");
  const selectedLines: string[] = [];
  const languagePanel = language === "en" ? /^\s*===panel:\s*\[?(?:ENG|EN|English)\]?\s*$/i : /^\s*===panel:\s*\[?(?:ESP|ES|Spanish|Español)\]?\s*$/i;
  let depth = 0;
  for (const line of content.split("\n")) {
    if (languagePanel.test(line) && depth === 0) {
      depth = 1;
      continue;
    }
    if (depth === 0) continue;
    if (/^\s*===panel:/i.test(line)) { depth++; continue; }
    if (/^\s*===endpanel\s*$/i.test(line)) {
      depth--;
      if (depth === 0) selectedLines.push("");
      continue;
    }
    if (!/^\s*===(?:accordion|endaccordion)\s*$/i.test(line)) selectedLines.push(line);
  }
  const selected = selectedLines.join("\n").trim() || (declaredLanguage === language ? content : "");
  return selected
    .replace(/^\s*===(?:accordion|endaccordion|panel:.*|endpanel)\s*$/gim, "")
    .replace(/\[\[symbol:([^\]]+)\]\]/gi, (_, symbol: string) => `{${symbol.toUpperCase()}}`)
    .replace(/\[\[([^\]\n]+)\]\]/g, (_, name: string) => `[${name}](https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)})`)
    .trim();
}
