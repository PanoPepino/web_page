import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Github, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { SpacetimeGrid } from "@/components/spacetime-grid";

const nav = [
  { to: "/outline" as const, label: "Outline" },
  { to: "/slides" as const, label: "Slides" },
  { to: "/notes" as const, label: "Notes" },
  { to: "/outreach" as const, label: "Outreach" },
  { to: "/magic" as const, label: "MTGA" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-7">
      <div className="flex min-h-16 items-center justify-between gap-5 border-b border-border px-2">
        <Link to="/" className="font-display text-base font-semibold text-foreground md:text-lg" aria-label="Daniel Panizo, home">Daniel Panizo</Link>
        <nav aria-label="Primary navigation" className="scrollbar-none flex items-center gap-5 overflow-x-auto md:gap-7">
          {nav.map(item => <Link key={item.to} to={item.to} className="nav-link shrink-0 py-5" activeProps={{ className: "nav-link shrink-0 py-5 text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary" }}>{item.label}</Link>)}
        </nav>
      </div>
    </header>
    <main>{children}</main>
    <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 md:px-8">
      <div className="flex flex-col gap-5 border-t border-border px-2 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Daniel Panizo · Quantitative Researcher</p>
        <div className="flex items-center gap-5">
          <a className="footer-link inline-flex items-center gap-1.5" href="mailto:panizofisico@gmail.com"><Mail className="size-3.5"/>Email</a>
          <a className="footer-link inline-flex items-center gap-1.5" href="https://github.com/PanoPepino" target="_blank" rel="noreferrer"><Github className="size-3.5"/>GitHub</a>
          <a className="footer-link inline-flex items-center gap-1.5" href="https://inspirehep.net/authors/1804691?ui-citation-summary=true" target="_blank" rel="noreferrer">INSPIRE<ArrowUpRight className="size-3.5"/></a>
        </div>
      </div>
    </footer>
  </div>;
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="panel relative col-span-12 overflow-hidden p-6 sm:p-8 md:col-span-8 md:min-h-64">
    <SpacetimeGrid />
    <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between gap-12">
      <div className="flex items-center gap-3"><span className="eyebrow">{eyebrow}</span></div>
      <div><h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">{title}</h1><div className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{children}</div></div>
    </div>
  </section>;
}

export function ExternalArrow() { return <ArrowUpRight className="size-4" aria-hidden="true" />; }
