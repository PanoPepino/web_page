import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, Presentation, Radio } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { SpacetimeGrid } from "@/components/spacetime-grid";
import { SwedenMap } from "@/components/sweden-map";
import { siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Daniel Panizo — Physics to Industry" },
    { name: "description", content: "Daniel Panizo brings theoretical physics, modelling and scientific software to industry in Sweden." },
    { property: "og:title", content: "Daniel Panizo — Physics to Industry" },
    { property: "og:description", content: "Theoretical physics, modelling and data analysis applied in Swedish industry." },
    { property: "og:type", content: "website" }, { property: "og:url", content: siteUrl("/") }, { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: siteUrl("/") }] }), component: Home,
});

const pathways = [
  { to: "/outline" as const, no: "01", title: "Professional Outline", text: "CVs, publications and trajectory.", icon: FileText },
  { to: "/slides" as const, no: "02", title: "Presentation Slides", text: "Animated scientific talks.", icon: Presentation },
  { to: "/notes" as const, no: "03", title: "Didactical Notes", text: "Notes, problems and templates.", icon: BookOpen },
  { to: "/outreach" as const, no: "04", title: "Outreach", text: "Physics in English and Spanish.", icon: Radio },
];

function Home() { return <SiteShell><div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
  <div className="grid grid-cols-12 gap-4">
    <section className="panel relative col-span-12 min-h-[360px] overflow-hidden p-7 sm:p-10 md:col-span-8 md:min-h-[440px]">
      <SpacetimeGrid />
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between gap-20"><p className="eyebrow text-primary">Quantitative Researcher · PhD Theoretical physics </p><div><h1 className="font-display text-5xl font-semibold leading-none sm:text-7xl md:text-8xl">Daniel<br/>Panizo</h1><p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">From fundamental physics to modelling, data and software in Sweden.</p></div></div>
    </section>
    <aside className="panel relative col-span-12 min-h-[300px] overflow-hidden p-6 md:col-span-4 md:min-h-[440px]">
       <SwedenMap />
       <div className="relative z-10"><p className="eyebrow"></p><p className="mt-3 font-display text-2xl font-semibold">Mathematical Modelling, Applied</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Research depth translated into practical industrial work.</p></div>
    </aside>
    {pathways.map(({to,no,title,text,icon:Icon}) => <Link key={to} to={to} className="panel-link group relative isolate col-span-6 flex min-h-48 flex-col justify-between overflow-hidden p-4 sm:min-h-44 sm:p-5 lg:col-span-3">
      <div className="relative z-10 flex items-center justify-between"><span className="section-index">{no}</span><Icon className="size-4 text-primary" strokeWidth={1.5}/></div><div className="relative z-10"><h2 className="font-display text-base font-semibold sm:text-lg">{title}</h2><div className="mt-2 flex items-end justify-between gap-2 sm:gap-3"><p className="text-xs text-muted-foreground">{text}</p><ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1"/></div></div>
    </Link>)}
  </div>
</div></SiteShell>; }
