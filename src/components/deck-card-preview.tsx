import { useEffect, useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DeckCard } from "@/lib/decks";

export function DeckCardPreview({ card, label, showQuantity = true, className = "text-muted-foreground" }: { card: DeckCard; label?: ReactNode; showQuantity?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [face, setFace] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clear = () => { clearTimeout(timer.current); };
  const schedule = (value: boolean) => { clear(); timer.current = setTimeout(() => setOpen(value), 150); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setFailed(false); }, [face, card]);
  const image = card.images?.[face];
  return <Popover open={open} onOpenChange={value => { clear(); setOpen(value); }}>
    <PopoverTrigger asChild>
      <button type="button" className={`text-left leading-relaxed hover:text-primary focus-visible:text-primary focus-visible:outline focus-visible:outline-primary ${className}`} onMouseEnter={() => schedule(true)} onMouseLeave={() => schedule(false)} onFocus={() => { clear(); setOpen(true); }} onClick={() => { clear(); setOpen(true); }}>
        {label ?? card.name}{showQuantity && card.quantity > 1 ? ` (x ${card.quantity})` : ""}
      </button>
    </PopoverTrigger>
    <PopoverContent side="left" align="center" collisionPadding={12} className="z-[80] w-[min(15rem,calc(100vw-2rem))] p-2" onMouseEnter={clear} onMouseLeave={() => schedule(false)} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>
      {image && !failed ? <img src={image.url} alt={image.name} onError={() => setFailed(true)} className="mx-auto max-h-[65dvh] w-auto max-w-full rounded-lg object-contain" /> : <p className="p-3 text-sm">Card preview unavailable.</p>}
      {(card.images?.length ?? 0) > 1 && <button type="button" className="mt-2 w-full text-sm text-primary" onClick={() => setFace(current => (current + 1) % (card.images?.length ?? 1))}>Show other face</button>}
      {card.cardUrl && <a href={card.cardUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-primary hover:underline">View on Scryfall</a>}
    </PopoverContent>
  </Popover>;
}
