import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";

type DeckTile = { moxfieldId: string; name: string; image: string };
type Drag = {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  dragging: boolean;
  vertical: boolean;
};

function Artwork({ deck, imageBase }: { deck: DeckTile; imageBase: string }) {
  return (
    <>
      <img
        src={`${imageBase}${deck.image}`}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        className="zoom-tile-image absolute inset-0 size-full object-cover opacity-70 group-hover:scale-[1.03] group-hover:opacity-90"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
        <span className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {deck.name}
        </span>
        <ArrowUpRight
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      </span>
    </>
  );
}

export function DeckCarousel({
  items,
  imageBase,
  onSelect,
  keyboardEnabled = true,
}: {
  items: DeckTile[];
  imageBase: string;
  onSelect: (index: number) => void;
  keyboardEnabled?: boolean;
}) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation | null>(null);
  const busy = useRef(false);
  const drag = useRef<Drag | null>(null);
  const pitch = useRef(0);
  const suppressClickUntil = useRef(0);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(4);
  const active = items.length ? current % items.length : 0;
  const looping = items.length > visible;
  const padding = looping ? visible : 0;
  const ordered = items.map((_, index) => ({
    deck: items[(active + index) % items.length]!,
    index: (active + index) % items.length,
  }));
  const position = (offset = 0) =>
    `translate3d(${-(padding + offset) * pitch.current}px, 0, 0)`;

  useLayoutEffect(() => {
    const view = viewport.current,
      rail = track.current;
    if (!view || !rail) return;
    const measure = () => {
      motion.current?.cancel();
      motion.current = null;
      busy.current = false;
      if (drag.current) {
        const pointerId = drag.current.id;
        drag.current = null;
        suppressClickUntil.current = performance.now() + 250;
        if (view.hasPointerCapture(pointerId))
          view.releasePointerCapture(pointerId);
      }
      delete view.dataset["dragging"];
      const count =
        Number(getComputedStyle(view).getPropertyValue("--deck-visible")) || 2;
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 16;
      pitch.current = (view.clientWidth + gap) / count;
      setVisible(count);
      rail.style.transform =
        items.length > count
          ? `translate3d(${-count * pitch.current}px, 0, 0)`
          : "none";
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => {
      observer.disconnect();
      motion.current?.cancel();
    };
  }, [active, items.length, visible]);

  const move = (direction: number) => {
    const rail = track.current;
    if (!rail || !looping || busy.current) return;
    busy.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finish = () => {
      if (direction === 0) {
        rail.style.transform = position();
        motion.current?.cancel();
        motion.current = null;
        busy.current = false;
      } else {
        // Reorder the real tiles before paint. Copies are only visible in motion.
        rail.style.transform = position(direction);
        setCurrent((active + direction + items.length) % items.length);
      }
    };
    if (reduced) {
      finish();
      return;
    }
    const animation = rail.animate(
      [
        { transform: rail.style.transform || position() },
        { transform: position(direction) },
      ],
      {
        duration: 400,
        easing: "cubic-bezier(.22, .61, .36, 1)",
        fill: "forwards",
      },
    );
    motion.current = animation;
    void animation.finished
      .then(() => {
        if (motion.current === animation) finish();
      })
      .catch(() => {});
  };

  // Page-level arrows work without first clicking or tabbing into the selector.
  useEffect(() => {
    if (!keyboardEnabled || !looping) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        !["ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      if (
        document.querySelector(
          "dialog[open], [role='dialog'][data-state='open']",
        )
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox'], [role='tab'], [role='slider']",
        )
      )
        return;
      event.preventDefault();
      viewport.current?.focus({ preventScroll: true });
      move(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!looping || busy.current || event.button !== 0 || !event.isPrimary)
      return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      dragging: false,
      vertical: false,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId || state.vertical) return;
    const dx = event.clientX - state.x,
      dy = event.clientY - state.y;
    if (!state.dragging) {
      // Wait for a clear vertical intent before yielding to page scrolling.
      // Small diagonal drift is common on touch screens and must not lock out
      // an otherwise horizontal deck swipe.
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.2) {
        state.vertical = true;
        return;
      }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      state.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset["dragging"] = "true";
      event.currentTarget.focus({ preventScroll: true });
      suppressClickUntil.current = Infinity;
    }
    event.preventDefault();
    const elapsed = event.timeStamp - state.lastTime;
    if (elapsed > 0) state.velocity = (event.clientX - state.lastX) / elapsed;
    state.lastX = event.clientX;
    state.lastTime = event.timeStamp;
    const distance = Math.max(
      -padding * pitch.current,
      Math.min(padding * pitch.current, dx),
    );
    if (track.current)
      track.current.style.transform = `translate3d(${-padding * pitch.current + distance}px, 0, 0)`;
  };
  const pointerEnd = (
    event: PointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    if (!state.dragging) return;
    delete event.currentTarget.dataset["dragging"];
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    suppressClickUntil.current = performance.now() + 250;
    const dx = event.clientX - state.x;
    const flick =
      event.timeStamp - state.lastTime < 120 &&
      Math.abs(state.velocity) > 0.45 &&
      Math.abs(dx) > 12;
    const steps =
      !cancelled && (Math.abs(dx) > pitch.current * 0.2 || flick)
        ? Math.min(
            padding,
            Math.max(1, Math.round(Math.abs(dx) / pitch.current)),
          ) * (dx < 0 ? 1 : -1)
        : 0;
    move(steps);
  };

  const tileClass =
    "deck-carousel-tile panel-link zoom-tile zoom-tile--lift group relative block aspect-[3/4] h-auto w-full overflow-hidden whitespace-normal rounded-xl p-0 text-left hover:bg-secondary";
  const copy = (entry: (typeof ordered)[number], key: string) => (
    <div key={key} className="deck-carousel-slot" aria-hidden="true">
      <div className={tileClass}>
        <Artwork deck={entry.deck} imageBase={imageBase} />
      </div>
    </div>
  );

  return (
    <section
      className="deck-carousel col-span-12"
      aria-label="Brawl tribal decks"
      aria-roledescription="carousel"
    >
      <div className="deck-carousel-toolbar mb-4 mt-6 flex items-end justify-between gap-4 px-2">
        <h2 className="font-display text-2xl font-semibold">
          Brawl tribal decks
        </h2>
        <div className="flex items-center gap-3">
          <span className="section-index">
            {String(items.length).padStart(2, "0")} decks
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous deck"
            aria-controls={`${id}-viewport`}
            disabled={!looping}
            onClick={() => move(-1)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next deck"
            aria-controls={`${id}-viewport`}
            disabled={!looping}
            onClick={() => move(1)}
          >
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
      <p id={`${id}-help`} className="sr-only">
        Use left and right arrow keys, drag, or swipe to browse decks. Activate
        a deck to open it.
      </p>
      {items.length ? (
        <div
          ref={viewport}
          id={`${id}-viewport`}
          className="deck-carousel-viewport"
          tabIndex={0}
          role="group"
          aria-label="Deck selector"
          aria-keyshortcuts="ArrowLeft ArrowRight"
          aria-describedby={`${id}-help`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={(event) => pointerEnd(event)}
          onPointerCancel={(event) => pointerEnd(event, true)}
          onLostPointerCapture={(event) => pointerEnd(event, true)}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={(event) => {
            if (
              busy.current ||
              performance.now() < suppressClickUntil.current
            ) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
        >
          <div
            ref={track}
            className="deck-carousel-track"
            data-static={!looping || undefined}
          >
            {looping &&
              ordered
                .slice(-padding)
                .map((entry, index) => copy(entry, `before-${index}`))}
            {ordered.map(({ deck, index }, offset) => (
              <div
                key={deck.moxfieldId}
                className="deck-carousel-slot"
                role="group"
                aria-roledescription="slide"
                aria-label={`${deck.name}, ${index + 1} of ${items.length}`}
                inert={offset >= visible}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className={tileClass}
                  aria-label={`Open ${deck.name}`}
                  onClick={() => onSelect(index)}
                >
                  <Artwork deck={deck} imageBase={imageBase} />
                </Button>
              </div>
            ))}
            {looping &&
              ordered
                .slice(0, padding)
                .map((entry, index) => copy(entry, `after-${index}`))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No decks available.</p>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {items.length
          ? `Showing ${ordered
              .slice(0, visible)
              .map((entry) => entry.deck.name)
              .join(", ")}.`
          : "No decks available."}
      </p>
    </section>
  );
}
