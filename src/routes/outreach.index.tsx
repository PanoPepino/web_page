import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play, Telescope } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { PageIntro } from "@/components/site-shell";
import { postcardImages } from "@/components/outreach-content";
import { publicUrl, siteUrl } from "@/lib/site-url";

const videoArtwork = publicUrl("assets/outreach/cosmo.jpg");
const playlist = "https://www.youtube.com/watch?v=MEuX53M5mBU&list=PL7qJnArvRQzHci5IAHRqCuS2eF4_baHTR";

type BubbleLane = "left" | "right";
type QuestionBubble = { id: number; left: string; top: string; dx: string; dy: string; animated: boolean };

function makeBubble(id: number, lane: BubbleLane, animated: boolean): QuestionBubble {
  // Keep spawn points in separated lanes; travel always moves outward from each lane.
  const left = lane === "left" ? 18 + Math.random() * 14 : 68 + Math.random() * 14;
  const top = 18 + Math.random() * 64;
  if (!animated) return { id, left: `${left}%`, top: `${top}%`, dx: "0px", dy: "0px", animated };
  const angle = lane === "left" ? Math.PI / 2 + Math.random() * Math.PI : -Math.PI / 2 + Math.random() * Math.PI;
  const distance = 28 + Math.random() * 16;
  return {
    id,
    left: `${left}%`,
    top: `${top}%`,
    dx: `${Math.cos(angle) * distance}px`,
    dy: `${Math.sin(angle) * distance}px`,
    animated,
  };
}

function QuestionBubbles() {
  const [bubbles, setBubbles] = useState<QuestionBubble[]>([]);

  useEffect(() => {
    let nextId = 0;
    let nextLane: BubbleLane = "left";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spawn = (animated: boolean) => {
      const bubble = makeBubble(nextId++, nextLane, animated);
      nextLane = nextLane === "left" ? "right" : "left";
      setBubbles(current => [...current.slice(-1), bubble]);
    };

    if (reducedMotion) {
      setBubbles([makeBubble(nextId++, "left", false), makeBubble(nextId++, "right", false)]);
      return;
    }

    spawn(true);
    const timer = window.setInterval(() => spawn(true), 3000);
    return () => window.clearInterval(timer);
  }, []);

  return <>{bubbles.map(bubble => <span
    key={bubble.id}
    aria-hidden="true"
    className={`question-bubble${bubble.animated ? " question-bubble--animated" : ""}`}
    style={{
      "--bubble-left": bubble.left,
      "--bubble-top": bubble.top,
      "--bubble-dx": bubble.dx,
      "--bubble-dy": bubble.dy,
    } as CSSProperties}
    onAnimationEnd={() => setBubbles(current => current.filter(item => item.id !== bubble.id))}
  />)}</>;
}

export const Route = createFileRoute("/outreach/")({
  head: () => ({
    meta: [
      { title: "Science Outreach — Daniel Panizo" },
      { name: "description", content: "Bilingual guides to cosmology, string theory, and dark bubble cosmology." },
      { property: "og:title", content: "Strings, Cosmology and Dark Bubbles" },
      { property: "og:description", content: "Explore cosmology through a complete history, six illustrated postcards, and video lectures." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("outreach") },
      { property: "og:image", content: videoArtwork },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: videoArtwork },
    ],
    links: [{ rel: "canonical", href: siteUrl("outreach") }],
  }),
  component: OutreachHome,
});

function OutreachHome() {
  return <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-8 md:pb-10 md:pt-20"><div className="grid grid-cols-12 gap-4">
    <PageIntro eyebrow="Science outreach" title="Strings, Cosmology and Dark Bubbles">
      <p>From the history of cosmology to the open questions of quantum gravity.</p>
    </PageIntro>
    <aside className="panel relative isolate col-span-12 flex min-h-48 flex-col justify-end overflow-hidden p-6 md:col-span-4"><QuestionBubbles /><p className="eyebrow relative z-10">The question</p><p className="relative z-10 mt-4 max-w-xs font-display text-xl font-semibold">Can string theory explain the universe expansion?</p></aside>

    <Link to="/outreach/history" className="panel-link group relative col-span-12 grid aspect-[4/3] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden sm:col-span-6 lg:col-span-4">
      <span className="relative min-h-0 overflow-hidden border-b border-border bg-muted"><img src={publicUrl("assets/outreach/history.jpg")} alt="" className="size-full object-cover object-center opacity-70 transition-opacity duration-300 group-hover:opacity-90" loading="lazy" decoding="async" /><span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><BookOpen className="size-3.5" /></span></span>
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5"><span className="min-w-0 font-display text-lg font-semibold leading-tight">History Of Cosmology</span><ArrowRight className="size-4 shrink-0 text-primary" /></span>
    </Link>

    <Link to="/outreach/postcards" className="panel-link group relative col-span-12 grid aspect-[4/3] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden sm:col-span-6 lg:col-span-4">
      <span className="relative grid min-h-0 grid-cols-2 overflow-hidden border-b border-border bg-muted">
        {postcardImages.slice(0, 2).map(image => <span key={image} className="relative min-w-0 overflow-hidden border-r border-border last:border-r-0"><img src={image} alt="" className="size-full object-cover object-center opacity-70 transition-opacity duration-300 group-hover:opacity-90" loading="lazy" decoding="async" /></span>)}
        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><Telescope className="size-3.5" /></span>
      </span>
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5"><span className="min-w-0 font-display text-lg font-semibold leading-tight">Six postcards, one story</span><ArrowRight className="size-4 shrink-0 text-primary" /></span>
    </Link>

    <a href={playlist} target="_blank" rel="noreferrer" className="panel-link group relative col-span-12 grid aspect-[4/3] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden sm:col-span-6 lg:col-span-4">
      <span className="relative min-h-0 overflow-hidden border-b border-border bg-muted"><img src={videoArtwork} alt="Cosmology outreach videos" className="size-full object-cover object-center opacity-70 transition-opacity duration-300 group-hover:opacity-90" loading="lazy" decoding="async" /><span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><Play className="size-3.5" /></span></span>
      <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5"><span className="min-w-0 font-display text-lg font-semibold leading-tight">Cosmology videos</span><ArrowRight className="size-4 shrink-0 text-primary" /></span>
    </a>
  </div></div>;
}
