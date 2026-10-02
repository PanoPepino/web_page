import { useEffect, useRef } from "react";

// One clock keeps the travelling glow and dot highlights aligned in both layouts.
export function useTimelineFlow() {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const timeline = ref.current;
    if (!timeline) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const horizontalLayout = window.matchMedia("(min-width: 48rem)");
    const dots = Array.from(timeline.querySelectorAll<HTMLElement>(".trajectory-dot"));
    let frame = 0;
    let started = performance.now();
    let horizontal = false;
    let length = 0;
    let size = 48;
    let positions: number[] = [];

    const measure = () => {
      const bounds = timeline.getBoundingClientRect();
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      horizontal = horizontalLayout.matches;
      size = rem * 4;
      const origin = horizontal ? bounds.width * .1 : rem * .5;
      length = horizontal ? bounds.width * .8 : bounds.height - origin;
      positions = dots.map(dot => {
        const rect = dot.getBoundingClientRect();
        return horizontal
          ? rect.left + rect.width / 2 - bounds.left - origin
          : rect.top + rect.height / 2 - bounds.top - origin;
      });
    };

    const animate = (now: number) => {
      const elapsed = (now - started) % 11000;
      const progress = Math.min(elapsed / 8000, 1);
      const position = horizontal
        ? -size + (length + size) * progress
        : length - (length + size) * progress;
      timeline.style.setProperty("--trajectory-glow-size", `${size}px`);
      timeline.style.setProperty("--trajectory-glow-opacity", elapsed < 8000 ? ".95" : "0");
      timeline.style.setProperty("--trajectory-position", horizontal ? `${position}px center` : `center ${position}px`);
      dots.forEach((dot, index) => {
        const coordinate = positions[index];
        // Match the soft gradient stops: peak glow exactly at the pulse centre.
        const distance = coordinate !== undefined && elapsed < 8000
          ? Math.abs(coordinate - position - size / 2) / (size / 2)
          : 1;
        const stops = [1, .75, .4, .15, .03, 0];
        const segment = Math.min(4, Math.floor(Math.min(distance, 1) * 5));
        const fraction = Math.min(distance, 1) * 5 - segment;
        const intensity = (stops[segment] ?? 0) * (1 - fraction) + (stops[segment + 1] ?? 0) * fraction;
        if (intensity > 0) dot.style.setProperty("--dot-glow", intensity.toFixed(3));
        else if (dot.style.getPropertyValue("--dot-glow")) dot.style.removeProperty("--dot-glow");
      });
      frame = requestAnimationFrame(animate);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      dots.forEach(dot => dot.style.removeProperty("--dot-glow"));
      timeline.style.removeProperty("--trajectory-position");
      timeline.style.removeProperty("--trajectory-glow-opacity");
      timeline.style.removeProperty("--trajectory-glow-size");
      if (!reducedMotion.matches) {
        measure();
        started = performance.now();
        frame = requestAnimationFrame(animate);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(timeline);
    window.addEventListener("resize", measure);
    horizontalLayout.addEventListener("change", measure);
    reducedMotion.addEventListener("change", restart);
    restart();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      horizontalLayout.removeEventListener("change", measure);
      reducedMotion.removeEventListener("change", restart);
      dots.forEach(dot => dot.style.removeProperty("--dot-glow"));
      timeline.style.removeProperty("--trajectory-position");
      timeline.style.removeProperty("--trajectory-glow-opacity");
      timeline.style.removeProperty("--trajectory-glow-size");
    };
  }, []);

  return ref;
}
