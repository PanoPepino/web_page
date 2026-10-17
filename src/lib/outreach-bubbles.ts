import type { QuestionBubbleData } from "@/components/question-bubble";

type Point = { x: number; y: number };
export type OutreachBubble = QuestionBubbleData & {
  start: Point;
  end: Point;
  radius: number;
  born: number;
};

function pointDistanceSquared(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length)) : 0;
  return (point.x - start.x - t * dx) ** 2 + (point.y - start.y - t * dy) ** 2;
}

/** Minimum separation of complete swept paths, independent of animation timing. */
export function bubblePathsOverlap(a: OutreachBubble, b: OutreachBubble) {
  const ax = a.end.x - a.start.x, ay = a.end.y - a.start.y;
  const bx = b.end.x - b.start.x, by = b.end.y - b.start.y;
  const cx = b.start.x - a.start.x, cy = b.start.y - a.start.y;
  const cross = ax * by - ay * bx;
  if (Math.abs(cross) > 1e-9) {
    const t = (cx * by - cy * bx) / cross;
    const u = (cx * ay - cy * ax) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  const distance = Math.min(
    pointDistanceSquared(a.start, b.start, b.end), pointDistanceSquared(a.end, b.start, b.end),
    pointDistanceSquared(b.start, a.start, a.end), pointDistanceSquared(b.end, a.start, a.end),
  );
  return distance < (a.radius + b.radius) ** 2;
}

export function makeOutreachBubble(
  id: number, width: number, height: number, diameter: number,
  active: OutreachBubble[], animated: boolean, born: number,
): OutreachBubble | null {
  // Include maximum expansion and a four-pixel safety margin around each path.
  const radius = diameter * 1.16 / 2 + 4;
  const inset = radius + 1;
  if (width <= inset * 2 || height <= inset * 2) return null;
  for (let attempt = 0; attempt < 64; attempt++) {
    const start = { x: inset + Math.random() * (width - inset * 2), y: inset + Math.random() * (height - inset * 2) };
    const angle = Math.random() * Math.PI * 2;
    const distance = animated ? 28 + Math.random() * 16 : 0;
    const end = { x: start.x + Math.cos(angle) * distance, y: start.y + Math.sin(angle) * distance };
    if (end.x < inset || end.x > width - inset || end.y < inset || end.y > height - inset) continue;
    const bubble: OutreachBubble = {
      id, start, end, radius, born, animated,
      left: `${start.x}px`, top: `${start.y}px`, dx: `${end.x - start.x}px`, dy: `${end.y - start.y}px`,
    };
    if (!active.some(other => bubblePathsOverlap(bubble, other))) return bubble;
  }
  return null;
}
