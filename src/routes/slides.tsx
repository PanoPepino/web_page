import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Play } from "lucide-react";
import { PageIntro, SiteShell } from "@/components/site-shell";
import { publicUrl, siteUrl } from "@/lib/site-url";
import talks from "@/data/slides.json";

export const Route = createFileRoute("/slides")({ head:()=>({meta:[{title:"Presentation Slides — Daniel Panizo"},{name:"description",content:"Interactive Manim presentations by Daniel Panizo on string cosmology and dark bubbles."},{property:"og:title",content:"Presentation Slides — Daniel Panizo"},{property:"og:description",content:"Animated scientific talks made with Manim."},{property:"og:type",content:"website"},{property:"og:url",content:siteUrl("slides")},{name:"twitter:card",content:"summary"}],links:[{rel:"canonical",href:siteUrl("slides")}]}), component: Slides });
const base=publicUrl("main_page/presentations/");

function Slides(){return <SiteShell><div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8"><div className="grid grid-cols-12 gap-4">
  <PageIntro eyebrow="Presentation slides" title="Ideas in motion."><p>Interactive research talks using mathematical animations.</p></PageIntro>
  <aside className="panel col-span-12 flex min-h-48 flex-col justify-between p-6 md:col-span-4"><p className="eyebrow">Open source</p><div><p className="text-sm leading-6 text-muted-foreground">BeAnim is an open-source library for creating Beamer-style presentations with Manim.</p><a className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary" href="https://github.com/PanoPepino/beanim" target="_blank" rel="noreferrer">Beanim <ArrowUpRight className="size-3.5"/></a></div></aside>
  {talks.map(({year,title,path,preview})=><a key={title} href={base+path} target="_blank" rel="noreferrer" className="panel-link group relative col-span-12 grid aspect-[4/3] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden sm:col-span-6 lg:col-span-4"><div className="relative min-h-0 overflow-hidden border-b border-border bg-muted"><img className="size-full object-cover object-center opacity-70 transition-opacity duration-300 group-hover:opacity-90" src={publicUrl(`assets/slides/${preview}`)} alt={`${title} slide preview`} loading="lazy" decoding="async"/><span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-border bg-background/80 transition-colors group-hover:border-primary group-hover:text-primary"><Play className="size-3.5"/></span></div><div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5"><h2 className="min-w-0 font-display text-lg font-semibold leading-tight">{title}</h2><span className="section-index shrink-0">{year}</span></div></a>)}
  <div className="col-span-12 flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground"></div>
</div></div></SiteShell>}
