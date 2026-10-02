import snapshots from "@/data/moxfield-seeds.json";
import { formatArenaDecklist } from "./arena-decklist";

export type DeckCard = {
  name: string;
  quantity: number;
  layout?: string;
  faceNames?: string[];
  keywords?: string[];
  typeLine?: string;
  frontTypeLine?: string;
  scryfallId?: string;
  cardUrl?: string;
  images?: { name: string; url: string }[];
};
export type DeckSection = { name: "Commander" | "Deck"; cards: DeckCard[] };
export type DeckGroup = { name: string; cards: DeckCard[]; count: number };

const cardTypes = [
  ["Creature", "Creatures"], ["Planeswalker", "Planeswalkers"],
  ["Instant", "Instants"], ["Sorcery", "Sorceries"],
  ["Artifact", "Artifacts"], ["Enchantment", "Enchantments"],
  ["Battle", "Battles"], ["Land", "Lands"],
] as const;

export function groupDeckCards(sections: DeckSection[]): DeckGroup[] {
  const groups = new Map<string, DeckCard[]>([["Commander", []], ...cardTypes.map(([, label]) => [label, []] as [string, DeckCard[]]), ["Other", []]]);
  for (const section of sections) {
    for (const card of section.cards) {
      const types = (card.frontTypeLine ?? card.typeLine?.split("//")[0] ?? "").split("—")[0]?.trim().split(/\s+/) ?? [];
      const label = section.name === "Commander" ? "Commander" : types.includes("Land") ? "Lands" : cardTypes.find(([type]) => types.includes(type))?.[1] ?? "Other";
      groups.get(label)?.push(card);
    }
  }
  return [...groups].filter(([, cards]) => cards.length).map(([name, cards]) => ({
    name, cards: [...cards].sort((a, b) => a.name.localeCompare(b.name)),
    count: cards.reduce((total, card) => total + card.quantity, 0),
  }));
}
export type Deck = {
  id: string;
  name: string;
  primerEnglish?: string;
  primerSpanish?: string;
  primerUrl?: string;
  primerSyncedAt?: string;
  primerCards?: DeckCard[];
  sections: DeckSection[];
  decklist: string;
  lastSynced: string;
  sourceUrl: string;
};
type SavedSnapshot = Omit<Deck, "id" | "sourceUrl" | "sections"> & { sections?: DeckSection[] };

function parseSections(decklist: string): DeckSection[] {
  const sections: DeckSection[] = [];
  let section: DeckSection | undefined;
  for (const line of decklist.split(/\r?\n/)) {
    if (line === "Commander" || line === "Deck") {
      section = { name: line, cards: [] };
      sections.push(section);
    } else if (line.trim() && !/^\d+\s/.test(line)) {
      section = undefined;
    } else {
      const match = /^(\d+)\s+(.+)$/.exec(line);
      if (section && match?.[1] && match[2]) section.cards.push({ quantity: Number(match[1]), name: match[2] });
    }
  }
  return sections.filter(section => section.cards.length);
}

export function getDeck(id: string, fallbackName: string): Deck | null {
  const snapshot = (snapshots as Record<string, SavedSnapshot>)[id];
  if (!snapshot) return null;
  const sections = (snapshot.sections ?? parseSections(snapshot.decklist)).filter(section => section.name === "Commander" || section.name === "Deck");
  return {
    ...snapshot, id, sections,
    decklist: formatArenaDecklist(sections),
    sourceUrl: `https://moxfield.com/decks/${id}`, name: snapshot.name || fallbackName,
  };
}
