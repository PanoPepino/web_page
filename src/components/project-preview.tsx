import { useEffect, useState } from "react";
import media from "@/data/project-media.json";
import { publicUrl } from "@/lib/site-url";

function PokemonPreview() {
  const { frames } = media.pokeml;
  const models = media.pokeml.models.filter(model => media.pokeml.previewModels.includes(model.label));
  const [active, setActive] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const update = () => {
      window.clearInterval(timer);
      if (motion.matches) setActive(0);
      else if (!document.hidden) timer = window.setInterval(() => setActive(index => (index + 1) % frames.length), 4000);
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
  return <div className="project-preview project-preview--pokemon relative aspect-video w-full shrink-0 overflow-hidden">
    {frames.map((frame, index) => <div key={frame.name} className="pokemon-preview-frame" aria-hidden={active !== index} style={{ opacity: active === index ? 1 : 0 }}>
      <div className="pokemon-preview-art"><img src={publicUrl(frame.image)} alt={frame.name} loading="lazy" decoding="async" className="size-full object-contain opacity-70 transition-opacity duration-300 group-hover:opacity-90" /></div>
      <div className="pokemon-preview-values">
        <div className="pokemon-preview-heading"><strong>{frame.name}</strong></div>
        <dl>{models.map(model => <div key={model.label}><dt>{model.shortLabel}</dt><dd>{model.values[index]?.estimate}</dd></div>)}</dl>
      </div>
    </div>)}
  </div>;
}

export function ProjectPreview({ id, title, fallback }: { id: string; title: string; fallback: string | null }) {
  if (id === "pokeml") return <PokemonPreview />;
  const animation = id === "beanim" ? media.beanim : id === "da-timeless" ? media["da-timeless"] : null;
  return <div className="project-preview relative aspect-video w-full shrink-0 overflow-hidden bg-card">
    {animation ? <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={publicUrl(animation.poster)} />
      <img src={publicUrl(animation.image)} alt={animation.alt} loading="lazy" decoding="async" className="size-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
    </picture> : fallback
      ? <img src={publicUrl(fallback)} alt={`${title} animated preview`} loading="lazy" decoding="async" className="size-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
      : <div className="project-preview-placeholder grid size-full place-items-center"><span className="eyebrow">GIF preview</span></div>}
  </div>;
}

export function PokemonPredictionDetails() {
  return <section className="pokemon-prediction-details mt-6" aria-labelledby="pokemon-predictions-heading">
    <h3 id="pokemon-predictions-heading" className="font-display text-lg font-semibold">Saved BST predictions</h3>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
      <caption className="sr-only">Predicted base stat totals and model-specific uncertainty from the PokéML README and saved XGBoost model</caption>
      <thead><tr><th scope="col">Model</th>{media.pokeml.frames.map(frame => <th key={frame.name} scope="col">{frame.name}</th>)}</tr></thead>
      <tbody>{media.pokeml.models.map(model => <tr key={model.label}><th scope="row">{model.label}</th>{model.values.map((value, index) => <td key={index}>{value.detail}</td>)}</tr>)}</tbody>
    </table></div>
    <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{media.pokeml.notes.map(note => <p key={note}>{note}</p>)}</div>
    <a href={media.pokeml.source} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Source: PokéML README</a>
  </section>;
}
