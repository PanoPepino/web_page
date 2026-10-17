import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { SiteShell } from "@/components/site-shell";
import { QuestionBubble, type QuestionBubbleData } from "@/components/question-bubble";
import { publicUrl, siteUrl } from "@/lib/site-url";
import { POTENTIAL_PATH, TUNNEL_EXIT, WAITING_VACUUM_FRAME, vacuumFrame } from "@/lib/vacuum-animation";
import talks from "@/data/slides.json";

export const Route = createFileRoute("/slides")({ head:()=>({meta:[{title:"Presentation Slides — Daniel Panizo"},{name:"description",content:"Interactive Manim presentations by Daniel Panizo on string cosmology and dark bubbles."},{property:"og:title",content:"Presentation Slides — Daniel Panizo"},{property:"og:description",content:"Animated scientific talks made with Manim."},{property:"og:type",content:"website"},{property:"og:url",content:siteUrl("slides")},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:siteUrl("slides")}]}), component: Slides });
const base=publicUrl("main_page/presentations/");

function SlidesScienceIntro(){
  const tileRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const bubbleAnchorRef = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState(WAITING_VACUUM_FRAME);
  const [bubble, setBubble] = useState<QuestionBubbleData | null>(null);

  useLayoutEffect(() => {
    const tile = tileRef.current, intro = introRef.current, title = bubbleAnchorRef.current;
    if (!tile || !intro || !title) return;
    let mounted = true;
    const measure = () => {
      if (!mounted) return;
      const bounds = tile.getBoundingClientRect(), heading = title.getBoundingClientRect();
      const first = intro.firstElementChild!.getBoundingClientRect();
      const last = intro.lastElementChild!.getBoundingClientRect();
      tile.style.setProperty("--slides-plot-top", `${first.top - bounds.top - tile.clientTop}px`);
      tile.style.setProperty("--slides-plot-height", `${last.bottom - first.top}px`);
      tile.style.setProperty("--slides-title-x", `${heading.left + heading.width / 2 - bounds.left - tile.clientLeft}px`);
      tile.style.setProperty("--slides-title-y", `${heading.top + heading.height / 2 - bounds.top - tile.clientTop - tile.clientHeight * .15}px`);
      const plot = plotRef.current;
      if (plot && window.matchMedia("(max-width: 47.999rem)").matches) {
        const scale = plot.getBoundingClientRect().width / 440;
        const textBottom = last.bottom - bounds.top - tile.clientTop;
        // Axis ends at SVG y=198; its remaining 32 units are empty padding.
        tile.style.setProperty("--slides-mobile-plot-bottom", `${tile.clientHeight - textBottom - 32 * scale}px`);
        const graph = plot.getBoundingClientRect();
        tile.style.setProperty("--slides-title-x", `${graph.left + graph.width / 2 - bounds.left - tile.clientLeft}px`);
        tile.style.setProperty("--slides-title-y", `${graph.top - graph.height * .8 - bounds.top - tile.clientTop}px`);
      }
    };
    const observer = new ResizeObserver(measure);
    [tile, intro, title].forEach(element => observer.observe(element));
    if (plotRef.current) observer.observe(plotRef.current);
    measure();
    document.fonts.ready.then(measure);
    return () => { mounted = false; observer.disconnect(); };
  }, []);

  useEffect(() => {
    let active = true;
    let timer = 0;
    let animationFrame = 0;
    let nextId = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!active) return;
        setBubble({
          id: nextId++, left: "var(--slides-title-x, 25%)", top: "var(--slides-title-y, 75%)",
          dx: "0px", dy: "0px", animated: false,
        });
        const startedAt = performance.now();
        const tick = (now: number) => {
          if (!active) return;
          const next = vacuumFrame(now - startedAt);
          if (next.complete) {
            setFrame(WAITING_VACUUM_FRAME);
            setBubble(null);
            schedule();
            return;
          }
          setFrame(next);
          animationFrame = window.requestAnimationFrame(tick);
        };
        setFrame(vacuumFrame(0));
        animationFrame = window.requestAnimationFrame(tick);
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => { active = false; window.clearTimeout(timer); window.cancelAnimationFrame(animationFrame); };
  }, []);

  return <section ref={tileRef} className="animation-tile slides-science panel relative col-span-12 overflow-hidden md:col-span-8" aria-labelledby="slides-heading">
    <div className="slides-science__visual">
    <div ref={plotRef} className="slides-science__plot">
    <svg className="slides-science__diagram" viewBox="0 0 440 230" role="img" aria-labelledby="potential-title potential-desc" preserveAspectRatio="xMidYMid meet">
      <title id="potential-title">Schematic false and true vacuum potential</title>
      <desc id="potential-desc">V plus is the false vacuum on the left. A marker tunnels beneath the barrier, then rolls down the far slope towards V minus without reaching the true minimum.</desc>
      <defs><linearGradient id="potential-stroke" x1="0" x2="1"><stop stopColor="var(--spacetime-purple)"/><stop offset="1" stopColor="var(--color-primary)"/></linearGradient></defs>
      <g className="slides-science__potential" transform="translate(18 18)">
        <path className="slides-science__axis" d="M0 164H405M20 180V0" />
        <path className="slides-science__curve" d={POTENTIAL_PATH} />
        {frame.phase === "tunneling" && <path className="slides-science__tunnel" d={`M84 112H${TUNNEL_EXIT.x}`} />}
        <circle cx="282" cy="150" r="3" className="slides-science__minimum slides-science__minimum--true" />
        <circle cx="84" cy="112" r="3" className="slides-science__minimum" />
        <text x="65" y="139">V₊</text><text x="265" y="178">V₋</text>
        <text x="9" y="12">V</text><text x="405" y="178">φ</text>
        <circle className="slides-science__state" data-phase={frame.phase} cx={frame.point.x} cy={frame.point.y} r="6" />
      </g>
    </svg>
    {bubble && <div key={bubble.id} className="slides-science__junctions" style={{ opacity: frame.equationsOpacity }} aria-label="Israel junction conditions">
      <p role="math" aria-label="Jump in induced metric h a b equals zero">[<i>h</i><sub>ab</sub>] = 0</p>
      <p role="math" aria-label="Jump in K a b minus h a b times jump in K equals minus eight pi G S a b">[<i>K</i><sub>ab</sub>] − <i>h</i><sub>ab</sub>[<i>K</i>] = −8π<i>G S</i><sub>ab</sub></p>
    </div>}
    </div>
    </div>
    <span className="sr-only" role="status">{frame.phase === "waiting" ? "False vacuum, V plus" : frame.phase === "tunneling" ? "Tunnelling beneath the barrier" : "Rolling towards the true vacuum without reaching it"}</span>
    <div ref={introRef} className="slides-science__intro"><p className="eyebrow">Presentatio<span ref={bubbleAnchorRef}>n</span> slides</p><h1 id="slides-heading" className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">Ideas in motion.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Interactive research talks using mathematical animations.</p></div>
    <div className="slides-science__bubble-field" style={{ "--slides-bubble-scale": frame.scale, "--slides-bubble-opacity": frame.opacity } as CSSProperties} aria-hidden="true">{bubble && <QuestionBubble bubble={bubble} />}</div>
  </section>;
}

function Slides(){return <SiteShell><div className="overview-page mx-auto max-w-6xl px-4 pb-5 pt-2 md:px-8 md:pb-8 md:pt-3"><div className="overview-grid grid grid-cols-12 gap-4">
  <SlidesScienceIntro />
  <aside className="slides-subtitle tile-companion panel col-span-12 flex flex-col justify-between gap-2 p-4 md:col-span-4"><p className="eyebrow">Open source</p><div className="space-y-2 text-sm leading-5 text-muted-foreground">
    <p>These presentation slides have been crafted using <a className="font-semibold text-primary underline-offset-4 hover:underline" href="https://www.manim.community/" target="_blank" rel="noreferrer">Manim</a>, an open-source library for creating mathematical animations.</p>
    <p>Objects and templates of these slides can be found in <Link className="font-semibold text-primary underline-offset-4 hover:underline" to="/projects" hash="beanim" hashScrollIntoView={{ block: "center" }}>beanim</Link> ecosystem, a set of libraries to reproduce beamer-like features natively in manim.</p>
  </div></aside>
  {talks.map(({year,title,path,preview})=><a key={title} href={base+path} target="_blank" rel="noreferrer" className="presentation-tile panel-link group relative col-span-12 block aspect-[4/3] overflow-hidden sm:col-span-6 lg:col-span-4"><div className="absolute inset-0 overflow-hidden bg-muted"><img className="size-full object-cover object-center opacity-70 transition-opacity duration-300 group-hover:opacity-90" src={publicUrl(`assets/slides/${preview}`)} alt={`${title} slide preview`} loading="lazy" decoding="async"/><span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><Play className="size-3.5"/></span></div><div className="presentation-caption absolute inset-x-0 bottom-0 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-5 pb-4 pt-12"><h2 className="min-w-0 font-display text-lg font-semibold leading-tight">{title}</h2><span className="section-index shrink-0">{year}</span></div></a>)}
</div></div></SiteShell>}
