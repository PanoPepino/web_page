import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Copy, Library } from "lucide-react";
import { useEffect, useState } from "react";
import { getDeck, groupDeckCards, type Deck } from "@/lib/decks";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { publicUrl, siteUrl } from "@/lib/site-url";
import deckCatalog from "@/data/decks.json";
import { primerCardNameFromUrl } from "@/lib/primer-cards";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DeckCardPreview } from "@/components/deck-card-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/magic")({
  head: () => ({
    meta: [
      { title: "MTGA — Daniel Panizo" },
      { name: "description", content: "Daniel Panizo's Brawl tribal decks and physical Magic: The Gathering card collection." },
      { property: "og:title", content: "MTGA — Daniel Panizo" },
      { property: "og:description", content: "Brawl tribal decks and a personal Magic: The Gathering card collection." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("magic") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: siteUrl("magic") }],
  }),
  component: Magic,
});

const imageBase = publicUrl("assets/magic/");

const decks = deckCatalog;
const firstDeck = (() => {
  const entry = decks[0];
  if (!entry) throw new Error("Deck catalog must contain at least one entry.");
  return entry;
})();

function DeckPrimer({ deck, language }: { deck: Deck | null; language: "en" | "es" }) {
  const primerText = language === "en" ? deck?.primerEnglish : deck?.primerSpanish;
  return <>
              {deck?.primerUrl && <p className="mb-4 text-xs text-muted-foreground"><a href={deck.primerUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Moxfield primer</a>{deck.primerSyncedAt ? ` · Saved ${deck.primerSyncedAt.slice(0, 10)}` : ""}</p>}
              {primerText?.trim() ? <div lang={language} className="magic-primer break-words text-sm leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, href }) => {
                const name = primerCardNameFromUrl(href);
                const reference = name ? deck?.primerCards?.find(card => card.name.toLowerCase() === name.toLowerCase()) : undefined;
                return reference ? <DeckCardPreview card={reference} label={children} showQuantity={false} className="text-primary no-underline" /> : <a href={href} target="_blank" rel="noreferrer" className="text-primary no-underline">{children}</a>;
              } }}>{primerText}</ReactMarkdown></div> : <p className="text-sm text-muted-foreground">{language === "es" ? "No hay descripción en español disponible." : "No English primer available."}</p>}
  </>;
}

function DeckReader({ selected, onClose }: { selected: number | null; onClose: () => void }) {
  const card = decks[selected ?? 0] ?? firstDeck;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [tab, setTab] = useState("description");
  const [language, setLanguage] = useState<"en" | "es">("en");

  useEffect(() => {
    setDeck(selected === null ? null : getDeck(card.moxfieldId, card.name));
    setCopied(false);
    setCopyError(false);
    setTab("description");
  }, [selected, card.moxfieldId, card.name]);

  const copy = async () => {
    if (!deck) return;
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(deck.decklist);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  const sourceUrl = deck?.sourceUrl ?? `https://moxfield.com/decks/${card.moxfieldId}`;

  return <Sheet open={selected !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent side="right" className="inset-0 flex h-full w-full max-w-none flex-col gap-0 border-0 p-0 sm:max-w-none [&>button]:z-30">
      <div className="magic-reader-layout min-h-0 flex-1 overflow-y-auto">
        <figure className="magic-reader-image relative">
          <img src={`${imageBase}${card.image}`} alt={`${card.name} deck artwork`} className="magic-reader-art pointer-events-none block h-auto w-full" />
        </figure>
        <aside className="magic-reader-content flex min-h-0 min-w-0 flex-col p-5 md:p-8">
          <SheetHeader className="mb-6 space-y-1 p-0 text-left">
            <p className="eyebrow text-primary">Brawl tribal deck</p>
            <SheetTitle className="font-display text-3xl font-semibold">{deck?.name ?? card.name}</SheetTitle>
            <SheetDescription>{deck ? `Saved snapshot · ${deck.lastSynced.slice(0, 10)} · ` : "No saved snapshot · "}<a href={sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Moxfield <ArrowUpRight className="inline size-3" /></a></SheetDescription>
          </SheetHeader>
          <div className="mb-5 grid gap-2">
            <Button size="sm" variant="outline" className="hover:border-primary hover:bg-primary/10 hover:text-primary" onClick={() => void copy()} disabled={!deck}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy for MTG Arena"}</Button>
            {copyError && <p role="alert" className="text-xs text-destructive">Could not copy. Allow clipboard access, then try again.</p>}
          </div>
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mb-4 w-full shrink-0"><TabsTrigger value="description" className="flex-1">Deck strategy</TabsTrigger><TabsTrigger value="list" className="flex-1">Deck list</TabsTrigger></TabsList>
            <TabsContent value="description" className="magic-reader-scroll min-h-0 flex-1 overflow-y-auto">
              <Tabs value={language} onValueChange={value => setLanguage(value === "es" ? "es" : "en")}>
                <TabsList aria-label="Description language" className="mb-4 w-1/2 shrink-0">
                  <TabsTrigger value="en" className="min-w-0 flex-1 px-1">English</TabsTrigger>
                  <TabsTrigger value="es" className="min-w-0 flex-1 px-1">Español</TabsTrigger>
                </TabsList>
                <TabsContent value="en"><DeckPrimer deck={deck} language="en" /></TabsContent>
                <TabsContent value="es"><DeckPrimer deck={deck} language="es" /></TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="list" className="magic-reader-scroll min-h-0 flex-1 overflow-y-auto text-sm">
              {deck ? <div className="deck-list-groups">{groupDeckCards(deck.sections).map(section => <div key={section.name} className="deck-list-group">
                <p className="section-index mb-2 border-b border-border pb-1 uppercase">{section.name} ({section.count})</p>
                <ul className="space-y-1">{section.cards.map((row, i) => <li key={`${row.name}-${i}`}><DeckCardPreview card={row} /></li>)}</ul>
              </div>)}</div> : <p className="text-muted-foreground">No verified deck list is saved here yet. Open Moxfield for the deck list.</p>}
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </SheetContent>
  </Sheet>;
}

function Magic() {
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  return <SiteShell><div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8"><div className="grid grid-cols-12 gap-4">
    <a href="https://cubecobra.com/cube/list/13842e74-10b4-4f67-9b90-5e194e4bdbff?view=spoiler" target="_blank" rel="noreferrer" className="panel-link zoom-tile group relative col-span-12 block min-h-72 overflow-hidden p-6 md:col-span-8 md:min-h-80 md:p-8">
      <img src={`${imageBase}pw.jpg`} alt="Magic card collection" loading="lazy" decoding="async" className="zoom-tile-image absolute inset-0 size-full object-cover opacity-70 group-hover:scale-[1.02] group-hover:opacity-90" />
      <span className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent" />
      <div className="relative flex min-h-60 flex-col justify-between md:min-h-64"><Library className="size-5 text-primary"/><div><p className="eyebrow">MTGA · Card collection</p><h1 className="mt-3 flex items-center gap-2 font-display text-3xl font-semibold transition-colors group-hover:text-primary md:text-5xl">Decks, tribes, collection. <ArrowUpRight className="size-5"/></h1></div></div>
    </a>

    <aside className="panel timeless-tile relative col-span-12 min-h-72 overflow-hidden p-6 md:col-span-4 md:min-h-80 md:p-8">
      <span
        aria-hidden="true"
        className="timeless-dragon"
        style={{ maskImage: `url("${imageBase}da-timeless-mark.png")`, WebkitMaskImage: `url("${imageBase}da-timeless-mark.png")` }}
      />
      <div className="relative z-10 flex h-full min-h-60 flex-col justify-between gap-8 md:min-h-64">
        <div>
          <p className="eyebrow">MTGA · Format</p>
          <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">About Timeless</h2>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-foreground">
          <p>Timeless is MTG Arena’s nonrotating format where every Arena card is legal.</p>
          <p>If you want to follow the Timeless metagame, visit <a href="https://www.datimeless.com/" target="_blank" rel="noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">DaTimeless</a>.</p>
        </div>
      </div>
    </aside>

    <section className="col-span-12 mt-6 flex items-end justify-between gap-4 px-2">
      <div><p className="eyebrow">Deck library</p><h2 className="mt-2 font-display text-2xl font-semibold">Brawl tribal decks</h2></div>
      <span className="section-index">{String(decks.length).padStart(2, "0")} decks</span>
    </section>
    <section className="col-span-12 flex flex-wrap justify-center gap-4">
      {decks.map((deck, index) => <Button key={deck.moxfieldId} type="button" variant="ghost" onClick={() => setSelectedDeck(index)} className="panel-link zoom-tile zoom-tile--lift group relative aspect-[3/4] h-auto w-[calc((100%-1rem)/2)] shrink-0 overflow-hidden whitespace-normal rounded-xl p-0 text-left hover:bg-secondary md:w-[calc((100%-3rem)/4)]">
        <img src={`${imageBase}${deck.image}`} alt="" loading="lazy" decoding="async" className="zoom-tile-image absolute inset-0 size-full object-cover opacity-70 group-hover:scale-[1.03] group-hover:opacity-90" />
        <span className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4"><span className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{deck.name}</span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" /></span>
      </Button>)}
    </section>

    <DeckReader selected={selectedDeck} onClose={() => setSelectedDeck(null)} />
  </div></div></SiteShell>;
}
