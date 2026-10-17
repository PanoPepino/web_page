import { createFileRoute, useLocation } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { ProjectTree } from "@/components/project-tree";
import { ProjectPreview } from "@/components/project-preview";
import projects from "@/data/projects.json";
import projectTree from "@/data/project-tree.json";
import { siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Daniel Panizo" },
      {
        name: "description",
        content:
          "Selected software and scientific communication projects by Daniel Panizo.",
      },
      { property: "og:title", content: "Projects — Daniel Panizo" },
      {
        property: "og:description",
        content: "Selected software and scientific communication projects.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("projects") },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: siteUrl("projects") }],
  }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  title: string;
  technologies: string[];
  description: string;
  url?: string;
};

function TechnologyTags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Technologies">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-[.5em] border border-border px-2.5 py-1 text-sm text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProjectDescription({ children }: { children: string }) {
  return (
    <div className="project-copy text-sm leading-6 text-muted-foreground">
      <ReactMarkdown
        components={{
          a: ({ children: label, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function TerminalControls({
  onClose,
  onExpand,
  expanded = false,
}: {
  onClose: () => void;
  onExpand: () => void;
  expanded?: boolean;
}) {
  return (
    <div
      className="project-terminal__controls"
      role="group"
      aria-label="Terminal window controls"
    >
      <button
        type="button"
        className="project-terminal__control project-terminal__control--red"
        onClick={onClose}
        aria-label={expanded ? "Restore terminal" : "Close terminal"}
      >
        <span className="project-terminal__red-mark" aria-hidden="true" />
      </button>
      {expanded ? (
        <button
          type="button"
          className="project-terminal__control project-terminal__control--yellow"
          onClick={onExpand}
          aria-label="Minimise terminal"
        />
      ) : (
        <span
          className="project-terminal__control project-terminal__control--yellow"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        className="project-terminal__control project-terminal__control--green"
        onClick={onExpand}
        aria-label={
          expanded
            ? "Return to project introduction"
            : "Expand project terminal"
        }
      >
        <svg
          className={
            expanded
              ? "project-terminal__green-mark project-terminal__green-mark--expanded"
              : "project-terminal__green-mark"
          }
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path d="M7 1h4v4L7 1ZM1 7l4 4H1V7Z" />
        </svg>
      </button>
    </div>
  );
}

type TerminalLine = { text: string; href?: string };

function terminalLines(items: Project[]): TerminalLine[] {
  return items.flatMap((project) => [
    { text: `$ cat ${project.id}/README_FOR_WEBPAGE.md` },
    { text: `# ${project.title}` },
    { text: project.description },
    { text: `TECH: ${project.technologies.join(" · ")}` },
    ...(project.url
      ? [{ text: `OPEN: ${project.url}`, href: project.url }]
      : []),
    { text: "" },
  ]);
}

function TerminalProjectOutput({ items }: { items: Project[] }) {
  const lines = terminalLines(items);
  const fullLength = lines.reduce(
    (total, line) => total + line.text.length + 1,
    0,
  );
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCharacters(fullLength);
      return;
    }
    setVisibleCharacters(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count = Math.min(fullLength, count + 2);
      setVisibleCharacters(count);
      if (count >= fullLength) window.clearInterval(timer);
    }, 12);
    return () => window.clearInterval(timer);
  }, [fullLength]);

  let offset = 0;
  return (
    <pre
      className="project-terminal__output"
      aria-label={lines.map((line) => line.text).join("\n")}
    >
      {lines.map((line, index) => {
        const start = offset;
        const shown = Math.max(
          0,
          Math.min(line.text.length, visibleCharacters - start),
        );
        offset += line.text.length + 1;
        return (
          <span key={index}>
            {line.href ? (
              <a href={line.href} target="_blank" rel="noreferrer">
                {line.text.slice(0, shown)}
              </a>
            ) : (
              line.text.slice(0, shown)
            )}
            {"\n"}
          </span>
        );
      })}
      <span className="project-terminal__cursor" aria-hidden="true" />
    </pre>
  );
}

function ProjectTerminalIntro({ items }: { items: Project[] }) {
  const [windowPhase, setWindowPhase] = useState<
    "open" | "closing" | "hidden" | "opening"
  >("open");
  const visible = windowPhase !== "hidden";
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const dialogMotion = useRef<Animation | null>(null);
  const minimising = useRef(false);
  const restoreFocus = useRef(false);
  const transformBetween = (from: DOMRect, to: DOMRect) =>
    `translate3d(${from.left - to.left}px, ${from.top - to.top}px, 0) scale(${from.width / to.width}, ${from.height / to.height})`;
  const minimise = () => {
    const dialog = dialogRef.current,
      intro = introRef.current;
    if (!dialog?.open || !intro || minimising.current) return;
    minimising.current = true;
    // Capture the current frame before cancelling, so rapid clicks never jump.
    const current = dialog.getBoundingClientRect();
    dialogMotion.current?.cancel();
    const full = dialog.getBoundingClientRect();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    dialog.dataset["motion"] = "closing";
    const animation = dialog.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: transformBetween(current, full) },
            {
              transform: transformBetween(intro.getBoundingClientRect(), full),
            },
          ],
      {
        duration: reduced ? 120 : 550,
        easing: "cubic-bezier(.65, 0, .35, 1)",
        fill: "forwards",
      },
    );
    dialogMotion.current = animation;
    void animation.finished
      .then(() => {
        if (dialogMotion.current !== animation) return;
        restoreFocus.current = true;
        dialog.close();
        animation.cancel();
        dialogMotion.current = null;
        minimising.current = false;
        setExpanded(false);
      })
      .catch(() => {});
  };
  const close = () => {
    if (windowPhase === "open") setWindowPhase("closing");
  };

  const finishWindowAnimation = () => {
    if (windowPhase === "closing") {
      setExpanded(false);
      setWindowPhase("hidden");
    } else if (windowPhase === "opening") setWindowPhase("open");
  };
  useEffect(() => {
    if (windowPhase !== "hidden") return;
    const timer = window.setTimeout(() => setWindowPhase("opening"), 3000);
    return () => window.clearTimeout(timer);
  }, [windowPhase]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (expanded && dialog && !dialog.open) {
      dialog.showModal();
      dialog.dataset["motion"] = "opening";
      const intro = introRef.current;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (intro) {
        const animation = dialog.animate(
          reduced
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                {
                  transform: transformBetween(
                    intro.getBoundingClientRect(),
                    dialog.getBoundingClientRect(),
                  ),
                },
                { transform: "translate3d(0, 0, 0) scale(1)" },
              ],
          {
            duration: reduced ? 120 : 550,
            easing: "cubic-bezier(.65, 0, .35, 1)",
          },
        );
        dialogMotion.current = animation;
        void animation.finished
          .then(() => {
            if (dialogMotion.current === animation) {
              dialogMotion.current = null;
              dialog.dataset["motion"] = "open";
            }
          })
          .catch(() => {});
      }
    }
    if (!expanded && dialog?.open) dialog.close();
    if (!expanded && restoreFocus.current) {
      restoreFocus.current = false;
      introRef.current
        ?.querySelector<HTMLButtonElement>(".project-terminal__control--green")
        ?.focus({ preventScroll: true });
    }
  }, [expanded]);
  useEffect(
    () => () => {
      dialogMotion.current?.cancel();
    },
    [],
  );

  return (
    <>
      <div className="animation-tile project-terminal-slot col-span-12 md:col-span-8">
        {visible ? (
          <section
            ref={introRef}
            style={{ visibility: expanded ? "hidden" : undefined }}
            className={`project-terminal terminal-window--${windowPhase} panel relative flex h-full min-h-0 flex-col overflow-hidden`}
            aria-label="Projects introduction"
            onAnimationEnd={(event) => {
              if (!expanded && event.target === event.currentTarget)
                finishWindowAnimation();
            }}
          >
            <div className="project-terminal__bar flex h-11 shrink-0 items-center border-b border-border px-4">
              <TerminalControls
                onClose={close}
                onExpand={() => {
                  if (windowPhase === "open") setExpanded(true);
                }}
              />
              <span className="ml-3 font-mono text-sm text-muted-foreground">
                portfolio — projects
              </span>
            </div>
            <div className="project-terminal__body relative flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-hidden px-5 py-6 sm:px-8 md:px-9">
              <div className="project-terminal__code" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>
                    {"const project = build({data, models, ideas});"}
                  </span>
                ))}
              </div>
              <p className="relative z-10 font-mono text-sm text-primary">
                <span className="text-muted-foreground">
                  pano@portfolio:~/projects$
                </span>{" "}
                cat docs/README.md
              </p>
              <h1 className="project-terminal__title relative z-10 font-mono text-xl font-semibold leading-tight sm:text-2xl md:text-3xl">
                <span className="text-primary">#</span> Ideas become tools.
              </h1>
              <p className="project-terminal__subtitle relative z-10 max-w-2xl font-mono text-sm leading-6 text-muted-foreground sm:text-sm">
                Software and scientific communication across modelling, data and
                physics.
                <span className="project-terminal__cursor" aria-hidden="true" />
              </p>
            </div>
          </section>
        ) : (
          <div className="h-full" aria-hidden="true" />
        )}
        {!visible && (
          <span className="sr-only" role="status">
            Terminal closed. It will reopen in three seconds.
          </span>
        )}
      </div>
      <dialog
        ref={dialogRef}
        className="project-terminal-dialog"
        aria-label="Project terminal presentation"
        onCancel={(event) => {
          event.preventDefault();
          minimise();
        }}
        onClose={() => setExpanded(false)}
      >
        <section
          className={`project-terminal project-terminal--expanded terminal-window--${windowPhase} panel flex h-full flex-col overflow-hidden`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) finishWindowAnimation();
          }}
        >
          <div className="project-terminal__bar flex h-11 shrink-0 items-center border-b border-border px-4">
            <TerminalControls onClose={minimise} onExpand={minimise} expanded />
            <span className="ml-3 font-mono text-sm text-muted-foreground">
              pano@portfolio:~/projects — read-only
            </span>
          </div>
          <div className="project-terminal__body min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <p className="mb-5 font-mono text-sm text-primary">
              <span className="text-muted-foreground">
                pano@portfolio:~/projects$
              </span>{" "}
              ./showcase --all
            </p>
            {expanded && <TerminalProjectOutput items={items} />}
          </div>
        </section>
      </dialog>
    </>
  );
}

function ProjectTile({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const detail = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !detail.current?.open) detail.current?.showModal();
    if (!open && detail.current?.open) detail.current?.close();
  }, [open]);
  return (
    <>
      <article
        id={project.id}
        tabIndex={-1}
        aria-labelledby={`${project.id}-title`}
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest("a,button")) {
            event.currentTarget
              .querySelector<HTMLButtonElement>("h3 button")
              ?.focus({ preventScroll: true });
            setOpen(true);
          }
        }}
        className="project-tile panel-link group relative flex h-full min-w-0 scroll-mt-6 flex-col overflow-hidden focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ProjectPreview id={project.id} />
        <div className="project-summary flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <h3
              id={`${project.id}-title`}
              className="font-display text-xl font-semibold leading-tight"
            >
              <button
                type="button"
                className="cursor-pointer text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => setOpen(true)}
              >
                {project.title}
              </button>
            </h3>
          </div>
          <div className="project-excerpt">
            <ProjectDescription>{project.description}</ProjectDescription>
          </div>
          <button
            type="button"
            aria-label={`Read more about ${project.title}`}
            className="project-read-more card-corner-arrow cursor-pointer text-primary"
            onClick={() => setOpen(true)}
          >
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
          {project.url && (
            <div className="project-summary-link mt-auto border-t border-border pt-3">
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${project.title}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                {project.url.includes("github.com")
                  ? "View on GitHub"
                  : "Open project"}
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </article>
      <dialog
        ref={detail}
        className="project-detail panel"
        aria-labelledby={`${project.id}-detail-title`}
        onClose={() => setOpen(false)}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={`${project.id}-detail-title`}
            className="font-display text-2xl font-semibold"
          >
            {project.title}
          </h2>
          <button
            type="button"
            autoFocus
            className="cursor-pointer text-sm text-primary"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="my-5">
          <TechnologyTags items={project.technologies} />
        </div>
        <ProjectDescription>{project.description}</ProjectDescription>
        {project.url && (
          <a
            className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            href={project.url}
            target="_blank"
            rel="noreferrer"
          >
            Open project
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
          </a>
        )}
      </dialog>
    </>
  );
}

function ProjectsPage() {
  const allProjects = projects as Project[];
  const hash = useLocation({ select: (location) => location.hash });

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target?.matches(".project-tile")) target.focus({ preventScroll: true });
  }, [hash]);

  return (
    <SiteShell>
      <div className="overview-page mx-auto max-w-6xl px-4 pb-5 pt-2 md:px-8 md:pb-8 md:pt-3">
        <div className="overview-grid grid grid-cols-12 gap-4">
          <ProjectTerminalIntro items={allProjects} />
          <aside className="project-tree-panel tile-companion panel col-span-12 flex min-w-0 flex-col items-start justify-center p-6 md:col-span-4">
            <ProjectTree nodes={projectTree} />
          </aside>

          <section
            aria-label="Selected projects"
            className="project-list resource-card-list col-span-12 grid grid-cols-12 gap-4"
          >
            {allProjects.map((project) => (
              <div key={project.id} className="col-span-12 flex sm:col-span-4">
                <div className="h-full min-w-0 flex-1">
                  <ProjectTile project={project} />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
