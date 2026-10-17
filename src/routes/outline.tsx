import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useTimelineFlow } from "@/components/use-timeline-flow";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, ScrollText } from "lucide-react";
import { PageIntro, SiteShell } from "@/components/site-shell";
import { publicUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/outline")({
  head: () => ({ meta: [
    { title: "Professional Outline & CV — Daniel Panizo" },
    { name: "description", content: "Daniel Panizo’s academic and industry CVs, publications, research experience and teaching." },
    { property: "og:title", content: "Professional Outline & CV — Daniel Panizo" },
    { property: "og:description", content: "Research trajectory, experience and publication record." },
    { property: "og:type", content: "website" }, { property: "og:url", content: siteUrl("outline") }, { name: "twitter:card", content: "summary" },
  ], links: [{ rel: "canonical", href: siteUrl("outline") }] }), component: Outline,
});

const docs = [
  { icon: BriefcaseBusiness, label: "Industry CV", note: "Modelling, data analysis, scientific software and selected projects", href: publicUrl("/downloads/cv_letter_proposal/cv_industry_dpp.pdf") },
  { icon: GraduationCap, label: "Research CV", note: "Academic training, appointments, talks and awards", href: publicUrl("/downloads/cv_letter_proposal/cv_academy_dpp.pdf") },
  { icon: ScrollText, label: "Publication List", note: "Peer-reviewed work in string theory and cosmology", href: publicUrl("/downloads/cv_letter_proposal/publications_dpp.pdf") },
];
const timeline: Array<[string, string, string]> = [
  ["2026—Now", "Exploring Opportunities in Industry", "Sweden"],
  ["2024—2026", "Postdoctoral Researcher", "Kyoto University · JSPS"],
  ["2019—2024", "PhD in Theoretical Physics", "Uppsala University"],
  ["2016—2019", "MSc in Physics", "Uppsala University"],
  ["2010—2016", "BSc in Physics", "Universidad Complutense de Madrid"],
];
function Outline(){const timelineRef = useTimelineFlow(); return <SiteShell><div className="overview-page mx-auto max-w-6xl px-4 pb-5 pt-2 md:px-8 md:pb-8 md:pt-3"><div className="overview-grid grid grid-cols-12 gap-4">
  <PageIntro eyebrow="Professional outline" title="Physics trained. Industry focused."><p>Quantitative Researcher with 7+ years of experience, bringing rigorous mathematical modelling and clear technical judgement to complex industrial problems.</p></PageIntro>
  <aside className="strengths-tile tile-companion panel col-span-12 flex flex-col justify-between p-6 md:col-span-4"><p className="eyebrow">Transferable strengths</p><ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground"><li>Mathematical modelling</li><li>Complex problem solving</li><li>Parameter Estimation</li><li>Clear technical communication</li></ul></aside>
  {docs.map(({icon:Icon,label,note,href})=><a key={label} className="tile-unit panel-link group col-span-12 flex flex-col justify-between gap-3 p-4 sm:col-span-4" href={href} target="_blank" rel="noreferrer"><div className="flex items-center justify-between"><Icon className="size-4 text-primary" strokeWidth={1.5}/><ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"/></div><div><h2 className="font-display text-lg font-semibold">{label}</h2><p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">{note}</p></div></a>)}
  <section aria-label="Career trajectory" className="tile-companion trajectory-tile panel col-span-12 flex flex-col p-4">
    <ol ref={timelineRef} className="trajectory min-h-0 flex-1">
      {timeline.map(([year, role, place], index) => (
        <li key={year} className={`trajectory-entry trajectory-entry--${(timeline.length - 1 - index) % 2 === 0 ? "down" : "up"}`} style={{ "--timeline-order": timeline.length - index } as CSSProperties}>
          <span className="trajectory-dot" aria-hidden="true" />
          <div className="trajectory-copy">
            <span className="section-index">{year}</span>
            <div className="trajectory-description">
              <h2 className="font-display text-base font-semibold md:text-sm">{role}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{place}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  </section>
</div></div></SiteShell>}
