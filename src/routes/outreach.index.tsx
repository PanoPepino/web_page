import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play, Telescope } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { postcardImages } from "@/components/outreach-content";
import { QuestionBubble } from "@/components/question-bubble";
import {
  makeOutreachBubble,
  type OutreachBubble,
} from "@/lib/outreach-bubbles";
import { publicUrl, siteUrl } from "@/lib/site-url";

const videoArtwork = publicUrl("assets/outreach/cosmo.jpg");
const playlist =
  "https://www.youtube.com/watch?v=MEuX53M5mBU&list=PL7qJnArvRQzHci5IAHRqCuS2eF4_baHTR";

function QuestionBubbles() {
  const field = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<OutreachBubble[]>([]);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nextId = 0,
      width = 0,
      height = 0,
      diameter = 0;
    let active: OutreachBubble[] = [];
    let timer: number | undefined;
    const spawn = () => {
      const now = performance.now();
      active = active.filter(
        (bubble) => !bubble.animated || now - bubble.born < 6000,
      );
      if (active.length < 3) {
        const bubble = makeOutreachBubble(
          nextId++,
          width,
          height,
          diameter,
          active,
          !reducedMotion.matches,
          now,
        );
        if (bubble) active.push(bubble);
      }
      setBubbles([...active]);
    };
    const resize = (force = false) => {
      const nextWidth = element.clientWidth,
        nextHeight = element.clientHeight;
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const nextDiameter = Math.max(
        2.5 * rem,
        Math.min(window.innerWidth * 0.05, 3.5 * rem),
      );
      if (
        !force &&
        nextWidth === width &&
        nextHeight === height &&
        nextDiameter === diameter
      )
        return;
      window.clearInterval(timer);
      width = nextWidth;
      height = nextHeight;
      diameter = nextDiameter;
      element.style.setProperty("--outreach-bubble-size", `${diameter}px`);
      active = [];
      spawn();
      if (reducedMotion.matches) {
        spawn();
        spawn();
      } else timer = window.setInterval(spawn, 2000);
    };
    const onResize = () => resize();
    const onMotionChange = () => resize(true);
    const observer = new ResizeObserver(onResize);
    observer.observe(element);
    window.addEventListener("resize", onResize);
    reducedMotion.addEventListener("change", onMotionChange);
    resize(true);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={field}
      className="outreach-bubble-field pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {bubbles.map((bubble) => (
        <QuestionBubble key={bubble.id} bubble={bubble} />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/outreach/")({
  head: () => ({
    meta: [
      { title: "Science Outreach — Daniel Panizo" },
      {
        name: "description",
        content:
          "Guides to cosmology, string theory, and dark bubble cosmology.",
      },
      { property: "og:title", content: "Strings, Cosmology and Dark Bubbles" },
      {
        property: "og:description",
        content:
          "Explore cosmology through a complete history, six illustrated postcards, and video lectures.",
      },
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

function OutreachCardContents({
  title,
  description,
  images,
  icon: Icon,
  rotate = false,
}: {
  title: string;
  description: string;
  images: string[];
  icon: typeof BookOpen;
  rotate?: boolean;
}) {
  const [imageOffset, setImageOffset] = useState(0);
  useEffect(() => {
    if (!rotate || images.length <= 1) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const update = () => {
      window.clearInterval(timer);
      if (!motion.matches && !document.hidden) {
        timer = window.setInterval(
          () => setImageOffset((offset) => (offset + 1) % images.length),
          4000,
        );
      }
    };
    update();
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [rotate, images.length]);
  const preview = (image: string) => (
    <span key={image} className="relative min-w-0 overflow-hidden">
      <img
        src={image}
        alt=""
        className={`size-full object-cover ${image === postcardImages[5] ? "object-[50%_80%]" : "object-center"} opacity-70 transition-opacity duration-300 group-hover:opacity-90 group-focus-visible:opacity-90`}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
  return (
    <>
      <span
        className="outreach-card-art relative grid aspect-video w-full shrink-0 overflow-hidden bg-muted"
        style={{
          gridTemplateColumns: `repeat(${rotate ? 1 : images.length}, minmax(0, 1fr))`,
        }}
      >
        {rotate
          ? images.map((image, index) => (
              <span
                key={image}
                aria-hidden="true"
                className="absolute inset-0 grid transition-opacity duration-700 motion-reduce:transition-none"
                style={{ opacity: imageOffset === index ? 1 : 0 }}
              >
                {preview(image)}
              </span>
            ))
          : images.map(preview)}
      </span>
      <span className="outreach-card-copy flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 md:p-6">
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-xl font-semibold leading-tight">
            {title}
          </span>
          <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        </span>
        <span className="text-sm leading-6 text-muted-foreground">
          {description}
        </span>
        <span className="card-corner-arrow text-primary" aria-hidden="true">
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </>
  );
}

function OutreachHome() {
  return (
    <div className="overview-page mx-auto max-w-6xl px-4 pb-5 pt-2 md:px-8 md:pb-8 md:pt-3">
      <div className="overview-grid grid grid-cols-12 gap-4">
        <section
          className="animation-tile panel relative isolate col-span-12 flex flex-col justify-between overflow-hidden p-6 sm:p-8 md:col-span-8"
          aria-labelledby="outreach-heading"
        >
          <QuestionBubbles />
          <p className="eyebrow relative z-10">Science outreach</p>
          <h1
            id="outreach-heading"
            className="relative z-10 max-w-2xl font-display text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl"
          >
            Can string theory explain the expansion of the universe?
          </h1>
        </section>
        <aside
          className="outreach-introduction tile-companion panel col-span-12 flex items-center p-6 md:col-span-4"
          aria-label="About this material"
        >
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This page brings together science communication material I
              prepared for my{" "}
              <a
                className="font-semibold text-primary underline-offset-4 hover:underline"
                href="http://www.diva-portal.org/smash/record.jsf?pid=diva2%3A1847954"
                target="_blank"
                rel="noreferrer"
              >
                thesis
              </a>
              .
            </p>
            <p>
              It covers how cosmology emerged as a discipline and offers simple
              explanations of how string theory could explain the universe we
              observe.
            </p>
          </div>
        </aside>
        <section
          aria-label="Explore outreach"
          className="outreach-list resource-card-list col-span-12 grid grid-cols-12 gap-4"
        >
          <Link
            to="/outreach/history"
            className="outreach-card panel-link group relative col-span-12 flex min-w-0 flex-col overflow-hidden sm:col-span-4"
          >
            <OutreachCardContents
              title="History Of Cosmology"
              description="Explore the history of cosmology."
              images={[publicUrl("assets/outreach/history.jpg")]}
              icon={BookOpen}
            />
          </Link>
          <Link
            to="/outreach/postcards"
            className="outreach-card panel-link group relative col-span-12 flex min-w-0 flex-col overflow-hidden sm:col-span-4"
          >
            <OutreachCardContents
              title="Six postcards, one story"
              description="Read six illustrated postcards about cosmology and dark bubbles."
              images={postcardImages}
              icon={Telescope}
              rotate
            />
          </Link>
          <a
            href={playlist}
            target="_blank"
            rel="noreferrer"
            className="outreach-card panel-link group relative col-span-12 flex min-w-0 flex-col overflow-hidden sm:col-span-4"
          >
            <OutreachCardContents
              title="Cosmology videos"
              description="Watch cosmology videos."
              images={[videoArtwork]}
              icon={Play}
            />
          </a>
        </section>
      </div>
    </div>
  );
}
