import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useRef, type TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { outreachContent, postcardImages, postcardKeys, type PostcardSource } from "@/components/outreach-content";
import { siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/outreach/postcards")({
  validateSearch: (search: Record<string, unknown>): { card?: number } => {
    const card = Number(search["card"]);
    return Number.isInteger(card) && card >= 1 && card <= postcardKeys.length ? { card } : {};
  },
  head: () => ({
    meta: [
      { title: "Cosmology Postcards — Daniel Panizo" },
      { name: "description", content: "Six illustrated postcards from cosmology to dark bubble theory." },
      { property: "og:title", content: "Six Cosmology Postcards" },
      { property: "og:description", content: "An illustrated journey from classical cosmology to dark bubbles." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("outreach/postcards") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: siteUrl("outreach/postcards") }],
  }),
  component: PostcardsPage,
});

function PostcardReader({ index, open, onOpenChange, onNavigate }: { index: number; open: boolean; onOpenChange: (open: boolean) => void; onNavigate: (direction: -1 | 1) => void }) {
  const source = outreachContent[postcardKeys[index] ?? postcardKeys[0]] as PostcardSource;
  const copy = source.eng;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const endSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0];
    if (!start || !end) return;
    const distanceX = end.clientX - start.x;
    const distanceY = end.clientY - start.y;
    if (Math.abs(distanceX) < 55 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.3) return;
    onNavigate(distanceX < 0 ? 1 : -1);
  };

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="inset-0 h-full w-full max-w-none overflow-y-auto border-0 p-0 [&>button]:hidden sm:max-w-none">
      <div className="fixed right-4 top-4 z-[80] md:right-6 md:top-6">
        <Button type="button" variant="secondary" size="icon" onClick={() => onOpenChange(false)} aria-label="Close postcard" className="size-10 rounded-full bg-background/90 shadow-lg backdrop-blur"><X className="size-5" /></Button>
      </div>
      <div
        className="postcard-reader-layout grid min-h-full touch-pan-y"
        onTouchStart={event => {
          const touch = event.touches[0];
          touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchEnd={endSwipe}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        <div className="postcard-reader-image relative grid min-h-72 min-w-0 place-items-center overflow-hidden bg-background">
          <img src={postcardImages[index] ?? postcardImages[0]} alt={copy.title} className={`postcard-reader-art w-full object-contain ${index === 5 ? "postcard-reader-art--vertical" : ""}`} />
          <Button type="button" variant="secondary" size="icon" onClick={() => onNavigate(-1)} aria-label="Previous postcard" className="absolute left-5 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-background/85 shadow-lg backdrop-blur lg:landscape:inline-flex"><ChevronLeft className="size-5" /></Button>
          <Button type="button" variant="secondary" size="icon" onClick={() => onNavigate(1)} aria-label="Next postcard" className="absolute right-5 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-background/85 shadow-lg backdrop-blur lg:landscape:inline-flex"><ChevronRight className="size-5" /></Button>
        </div>
        <div className="min-w-0 overflow-y-auto p-6 md:p-9">
          <SheetHeader className="pr-8">
            <p className="eyebrow">Postcard {index + 1} of 6</p>
            <SheetTitle className="font-display text-2xl md:text-3xl">{copy.title}</SheetTitle>
            <SheetDescription className="sr-only">Postcard {index + 1} details</SheetDescription>
          </SheetHeader>
          <ul className="mt-8 space-y-5">{copy.bullets.map((bullet, bulletIndex) => <li key={bullet} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 text-sm leading-7 text-foreground"><span className="section-index pt-1">{String(bulletIndex + 1).padStart(2, "0")}</span><span>{bullet}</span></li>)}</ul>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
}

function PostcardsPage() {
  const navigate = Route.useNavigate();
  const { card } = Route.useSearch();
  const selected = card === undefined ? null : card - 1;
  const setSelected = (index: number | null) => void navigate({
    replace: true,
    search: previous => {
      if (index === null) {
        const { card: _card, ...rest } = previous;
        return rest;
      }
      return { ...previous, card: index + 1 };
    },
  });
  const navigatePostcards = (direction: -1 | 1) => {
    if (selected === null) return;
    setSelected((selected + direction + postcardKeys.length) % postcardKeys.length);
  };

  return <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:px-8 md:pt-20">
    <Link to="/outreach" className="footer-link inline-flex items-center gap-2"><ArrowLeft className="size-4" />Back to Outreach</Link>
    <header className="pb-8 pt-8"><p className="eyebrow">From Cosmology to Dark Bubbles</p><h1 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Six postcards, one story</h1><p className="mt-4 max-w-2xl text-muted-foreground">Select an illustration to enlarge it and read its story.</p></header>
    <section className="grid grid-cols-12 gap-4">{postcardKeys.map((key, index) => { const source = outreachContent[key] as PostcardSource; const copy = source.eng; return <button key={key} type="button" onClick={() => setSelected(index)} className="panel-link postcard-gallery-card group relative grid aspect-[4/3] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden p-0 text-left"><span className="relative min-h-0 overflow-hidden bg-background"><img src={postcardImages[index]} alt={copy.title} className={`postcard-gallery-art size-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90 ${index === 5 ? "postcard-gallery-art--vertical object-[50%_80%]" : "object-center"}`} loading="lazy" decoding="async" /><span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><Maximize2 className="size-3.5" /></span></span><span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5"><span className="min-w-0 font-display text-lg font-semibold leading-tight">{copy.title}</span><span className="section-index shrink-0">{String(index + 1).padStart(2, "0")}</span></span></button>; })}</section>
    {selected !== null && <PostcardReader index={selected} open onOpenChange={open => { if (!open) setSelected(null); }} onNavigate={navigatePostcards} />}
  </div>;
}
