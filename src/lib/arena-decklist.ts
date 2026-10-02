import type { DeckCard, DeckSection } from "./decks";

/** Arena identifies double-faced/adventure cards by front face, not both faces. */
export function arenaCardName(card: DeckCard): string {
  const name = card.name.trim().normalize("NFC");
  const faces = card.faceNames?.length ? card.faceNames : name.split(/\s*\/{2,3}\s*/);
  if (["split", "room"].includes(card.layout ?? "")) {
    const separator = card.keywords?.some(keyword => keyword.toLowerCase() === "aftermath") ? " /// " : " // ";
    return faces.join(separator);
  }
  return faces[0]?.trim() ?? name;
}

export function formatArenaDecklist(sections: DeckSection[]): string {
  return sections.filter(section => section.name === "Commander" || section.name === "Deck").flatMap(section => {
    const rows = new Map<string, number>();
    for (const card of section.cards) {
      const name = arenaCardName(card);
      if (!name || /[\r\n]/.test(name) || !Number.isInteger(card.quantity) || card.quantity <= 0) throw new Error("Invalid Arena card row");
      rows.set(name, (rows.get(name) ?? 0) + card.quantity);
    }
    return rows.size ? [[section.name, ...[...rows].map(([name, quantity]) => `${quantity} ${name}`)].join("\n")] : [];
  }).join("\n\n");
}
