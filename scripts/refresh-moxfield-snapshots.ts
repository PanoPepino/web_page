import { appendFile, readFile, writeFile } from "node:fs/promises";
import type { DeckCard, DeckSection } from "../src/lib/decks";
import { extractPrimer } from "./moxfield-primer";
import { formatArenaDecklist } from "../src/lib/arena-decklist";
import { primerCardNames } from "../src/lib/primer-cards";

type Snapshot = { name: string; primerEnglish?: string; primerSpanish?: string; primerUrl?: string; primerSyncedAt?: string; primerCards?: DeckCard[]; decklist: string; sections?: DeckSection[]; lastSynced: string };
type MoxfieldRow = { quantity: number; card: { name: string; scryfall_id?: string; layout?: string; keywords?: string[]; type_line?: string; card_faces?: { name: string; type_line?: string }[] } };
type MoxfieldDeck = { id: string; name: string; boards: Record<string, { cards: Record<string, MoxfieldRow> }> };
type ScryfallCard = { id: string; name: string; scryfall_uri: string; layout?: string; keywords?: string[]; type_line?: string; image_uris?: { normal?: string }; card_faces?: { name: string; type_line?: string; image_uris?: { normal?: string } }[] };
const catalog = JSON.parse(await readFile(new URL("../src/data/decks.json", import.meta.url), "utf8")) as { name: string; moxfieldId: string; primerLanguage?: "en" | "es"; primerCardIds?: Record<string, string> }[];
if (!Array.isArray(catalog) || !catalog.length || catalog.some(entry => !entry.name?.trim() || !/^[\w-]+$/.test(entry.moxfieldId ?? "")) || new Set(catalog.map(entry => entry.moxfieldId)).size !== catalog.length) {
  throw new Error("Deck catalog must contain named entries with unique Moxfield IDs.");
}
const snapshotsPath = new URL("../src/data/moxfield-seeds.json", import.meta.url);
const snapshots = JSON.parse(await readFile(snapshotsPath, "utf8")) as Record<string, Snapshot>;
const headers = { "User-Agent": "DanielPanizoPortfolio/1.0", Accept: "application/json" };
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const imageCache = new Map<string, ScryfallCard>();
const nameCache = new Map<string, ScryfallCard>();
function cacheCard(card: ScryfallCard) {
  imageCache.set(card.id, card);
  for (const name of [card.name, ...(card.card_faces ?? []).map(face => face.name)]) nameCache.set(name.toLowerCase(), card);
}
let lastScryfallRequest = 0;
let updated = 0;
const failures: string[] = [];
const primerFailures: string[] = [];

async function fetchPrimer(deck: MoxfieldDeck, entry: typeof catalog[number], previous?: Snapshot) {
  const primerUrl = `https://moxfield.com/decks/${entry.moxfieldId}/primer`;
  try {
    if (!/^[\w-]+$/.test(deck.id ?? "")) throw new Error("Missing internal deck ID");
    const response = await fetch(`https://api2.moxfield.com/v1/decks/${deck.id}/primer`, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const primer = await response.json() as { content?: string };
    if (typeof primer.content !== "string") throw new Error("Invalid primer response");
    return { primerEnglish: extractPrimer(primer.content, "en", entry.primerLanguage), primerSpanish: extractPrimer(primer.content, "es", entry.primerLanguage), primerUrl, primerSyncedAt: new Date().toISOString() };
  } catch (error) {
    primerFailures.push(entry.name);
    console.warn(`Kept previous bilingual primers for ${entry.name}: ${String(error)}`);
    return { primerEnglish: previous?.primerEnglish, primerSpanish: previous?.primerSpanish, primerUrl: previous?.primerUrl ?? primerUrl, primerSyncedAt: previous?.primerSyncedAt };
  }
}

function cards(deck: MoxfieldDeck, board: string): DeckCard[] {
  return Object.values(deck.boards[board]?.cards ?? {}).map(row => {
    if (!row.card?.name?.trim() || !Number.isInteger(row.quantity) || row.quantity < 1) throw new Error(`Invalid ${board} row`);
    return {
      name: row.card.name, quantity: row.quantity,
      layout: row.card.layout, keywords: row.card.keywords, faceNames: row.card.card_faces?.map(face => face.name),
      ...(row.card.scryfall_id ? { scryfallId: row.card.scryfall_id } : {}),
      ...(row.card.type_line ? { typeLine: row.card.type_line } : {}),
      ...(row.card.card_faces?.[0]?.type_line ? { frontTypeLine: row.card.card_faces[0].type_line } : {}),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function enrich(rows: DeckCard[], previous?: Snapshot) {
  const ids = [...new Set(rows.flatMap(row => row.scryfallId && !imageCache.has(row.scryfallId) ? [row.scryfallId] : []))];
  for (let offset = 0; offset < ids.length; offset += 75) {
    try {
      await wait(Math.max(0, 600 - (Date.now() - lastScryfallRequest)));
      lastScryfallRequest = Date.now();
      const response = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: ids.slice(offset, offset + 75).map(id => ({ id })) }), signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        if (response.status === 429) {
          const retry = response.headers.get("Retry-After");
          const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - Date.now() : 1000;
          await wait(Math.max(1000, Number.isFinite(delay) ? delay : 1000));
        }
        throw new Error(`Scryfall HTTP ${response.status}`);
      }
      const result = await response.json() as { data: ScryfallCard[] };
      for (const card of result.data) cacheCard(card);
    } catch (error) { console.warn(`Card previews: ${String(error)}`); }
  }
  for (const row of rows) {
    const cached = nameCache.get(row.name.toLowerCase());
    if (cached && !row.scryfallId) row.scryfallId = cached.id;
  }
  const missing = rows.filter(row => !row.scryfallId || !imageCache.has(row.scryfallId));
  for (let offset = 0; offset < missing.length; offset += 75) {
    const batch = missing.slice(offset, offset + 75);
    try {
      await wait(Math.max(0, 600 - (Date.now() - lastScryfallRequest)));
      lastScryfallRequest = Date.now();
      const response = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ identifiers: batch.map(row => ({ name: row.name })) }), signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        if (response.status === 429) {
          const retry = response.headers.get("Retry-After");
          const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - Date.now() : 1000;
          await wait(Math.max(1000, Number.isFinite(delay) ? delay : 1000));
        }
        throw new Error(`Scryfall name fallback HTTP ${response.status}`);
      }
      const result = await response.json() as { data: ScryfallCard[] };
      for (const card of result.data) {
        cacheCard(card);
        const row = batch.find(row => [card.name, ...(card.card_faces ?? []).map(face => face.name)].some(name => row.name.toLowerCase() === name.toLowerCase()));
        if (row) {
          row.scryfallId ??= card.id;
          imageCache.set(row.scryfallId, card);
        }
      }
    } catch (error) { console.warn(`Card preview name fallback: ${String(error)}`); }
  }
  for (const row of rows) {
    const card = (row.scryfallId ? imageCache.get(row.scryfallId) : undefined) ?? nameCache.get(row.name.toLowerCase());
    if (card) {
      row.layout ??= card.layout;
      row.keywords ??= card.keywords;
      if (!row.faceNames?.length && card.card_faces?.length) row.faceNames = card.card_faces.map(face => face.name);
      row.typeLine ??= card.type_line;
      row.frontTypeLine ??= card.card_faces?.[0]?.type_line;
      row.cardUrl = card.scryfall_uri;
      row.images = card.image_uris?.normal ? [{ name: card.name, url: card.image_uris.normal }] : (card.card_faces ?? []).flatMap(face => face.image_uris?.normal ? [{ name: face.name, url: face.image_uris.normal }] : []);
    } else {
      const old = [...(previous?.sections?.flatMap(section => section.cards) ?? []), ...(previous?.primerCards ?? [])].find(card => row.scryfallId ? card.scryfallId === row.scryfallId : card.name === row.name);
      row.layout ??= old?.layout;
      row.keywords ??= old?.keywords;
      row.faceNames ??= old?.faceNames;
      if (old?.images) row.images = old.images;
      if (old?.cardUrl) row.cardUrl = old.cardUrl;
      row.typeLine ??= old?.typeLine;
      row.frontTypeLine ??= old?.frontTypeLine;
    }
  }
}

for (const entry of catalog) {
  try {
    const response = await fetch(`https://api2.moxfield.com/v3/decks/all/${entry.moxfieldId}`, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const deck = await response.json() as MoxfieldDeck;
    if (!deck.name?.trim() || !deck.boards) throw new Error("Invalid deck response");
    const sections: DeckSection[] = [{ name: "Commander", cards: cards(deck, "commanders") }, { name: "Deck", cards: cards(deck, "mainboard") }];
    if (!sections[1]?.cards.length) throw new Error("Moxfield returned no mainboard");
    await enrich(sections.flatMap(section => section.cards), snapshots[entry.moxfieldId]);
    const primer = await fetchPrimer(deck, entry, snapshots[entry.moxfieldId]);
    const allCards = sections.flatMap(section => section.cards);
    const primerCards = primerCardNames([primer.primerEnglish, primer.primerSpanish].filter(Boolean).join("\n")).map(name => {
      const existing = [...allCards, ...(snapshots[entry.moxfieldId]?.primerCards ?? [])].find(card => [card.name, ...(card.faceNames ?? [])].some(alias => alias.toLowerCase() === name.toLowerCase()));
      return { ...existing, name, quantity: 1, scryfallId: entry.primerCardIds?.[name] ?? existing?.scryfallId };
    });
    await enrich(primerCards, snapshots[entry.moxfieldId]);
    snapshots[entry.moxfieldId] = {
      name: deck.name, ...primer, primerCards, sections,
      decklist: formatArenaDecklist(sections),
      lastSynced: new Date().toISOString(),
    };
    updated++;
    console.log(`Updated ${entry.name}`);
  } catch (error) {
    failures.push(entry.name);
    console.warn(`Kept saved data for ${entry.name}: ${String(error)}`);
  }
  await wait(600);
}
const summary = `Refreshed ${updated}/${catalog.length} catalog decks. Failed: ${failures.length}. Primer fetch failures: ${primerFailures.length}.`;
console.log(summary);
if (process.env["GITHUB_STEP_SUMMARY"]) await appendFile(process.env["GITHUB_STEP_SUMMARY"], `## Deck refresh\n\n${summary}\n${failures.length ? `\nPreserved previous snapshots: ${failures.join(", ")}\n` : ""}`);
if (updated === 0) {
  console.error("No decks refreshed; deployment must stop.");
  process.exitCode = 1;
} else {
  await writeFile(snapshotsPath, `${JSON.stringify(snapshots, null, 2)}\n`);
}
