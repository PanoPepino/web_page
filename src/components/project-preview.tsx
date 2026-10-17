import { useEffect, useState } from "react";
import media from "@/data/project-media.json";
import { publicUrl } from "@/lib/site-url";

function PokemonPreview() {
  const { frames } = media.pokeml;
  const models = media.pokeml.models.filter((model) =>
    media.pokeml.previewModels.includes(model.label),
  );
  const [active, setActive] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const update = () => {
      window.clearInterval(timer);
      if (motion.matches) setActive(0);
      else if (!document.hidden)
        timer = window.setInterval(
          () => setActive((index) => (index + 1) % frames.length),
          4000,
        );
    };
    update();
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [frames.length]);
  return (
    <div className="project-preview project-preview--pokemon relative aspect-video w-full shrink-0 overflow-hidden">
      {frames.map((frame, index) => (
        <div
          key={frame.name}
          className="pokemon-preview-frame"
          aria-hidden={active !== index}
          style={{ opacity: active === index ? 1 : 0 }}
        >
          <div className="pokemon-preview-art">
            <img
              src={publicUrl(frame.image)}
              alt={frame.name}
              loading="lazy"
              decoding="async"
              className="size-full object-contain opacity-70 transition-opacity duration-300 group-hover:opacity-90"
            />
          </div>
          <div className="pokemon-preview-values">
            <div className="pokemon-preview-heading">
              <strong>{frame.name}</strong>
            </div>
            <dl>
              {models.map((model) => (
                <div key={model.label}>
                  <dt>{model.shortLabel}</dt>
                  <dd>{model.values[index]?.estimate}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectPreview({ id }: { id: string }) {
  if (id === "pokeml") return <PokemonPreview />;
  const animation =
    id === "manim-ecosystem"
      ? media["manim-ecosystem"]
      : id === "da-timeless"
        ? media["da-timeless"]
        : null;
  return (
    <div className="project-preview relative aspect-video w-full shrink-0 overflow-hidden bg-card">
      {animation ? (
        <picture>
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet={publicUrl(animation.poster)}
          />
          <img
            src={publicUrl(animation.image)}
            alt={animation.alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
          />
        </picture>
      ) : null}
    </div>
  );
}
