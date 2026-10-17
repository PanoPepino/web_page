import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  imageByName,
  outreachContent,
  type HistoryEntry,
} from "@/components/outreach-content";
import { siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/outreach/history")({
  head: () => ({
    meta: [
      { title: "History Of Cosmology — Daniel Panizo" },
      {
        name: "description",
        content:
          "An illustrated history of cosmology, gravity, and string theory.",
      },
      { property: "og:title", content: "History Of Cosmology" },
      {
        property: "og:description",
        content: "Cosmology, gravity, and strings across the last century.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: siteUrl("outreach/history") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: siteUrl("outreach/history") }],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const entries = outreachContent.history_eng as HistoryEntry[];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12 pt-4 md:px-8 md:pt-6">
      <Link
        to="/outreach"
        className="footer-link inline-flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        Back to Outreach
      </Link>
      <header className="border-b border-border pb-8 pt-8">
        <p className="eyebrow">Complete history</p>
        <h1 className="mt-3 font-display text-2xl font-semibold md:text-4xl">
          History Of Cosmology
        </h1>
        <p className="mt-4 text-muted-foreground">
          Cosmology, gravity and strings across the last century.
        </p>
      </header>
      <article className="space-y-8 py-10 text-sm leading-7 text-foreground md:text-base md:leading-8">
        {entries.map((entry, index) => (
          <div
            key={`${index}-${entry.text.slice(0, 24)}`}
            className="flow-root"
          >
            {entry.image && (
              <img
                src={imageByName[entry.image]}
                alt=""
                className={`mx-auto mb-3 block h-auto max-h-72 w-auto max-w-full rounded-md border border-border bg-muted sm:mx-0 sm:max-w-64 ${entry.side === "left" ? "sm:float-left sm:mr-4" : "sm:float-right sm:ml-4"}`}
              />
            )}
            <p
              className={
                index === 0
                  ? "border-l-2 border-primary pl-5 text-muted-foreground"
                  : ""
              }
            >
              {entry.text}
            </p>
          </div>
        ))}
      </article>
    </div>
  );
}
