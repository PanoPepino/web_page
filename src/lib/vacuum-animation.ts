type Point = { x: number; y: number };

export type VacuumFrame = {
  phase: "waiting" | "tunneling" | "rolling" | "fading";
  point: Point;
  scale: number;
  opacity: number;
  equationsOpacity: number;
  complete: boolean;
};

export const FALSE_VACUUM = { x: 84, y: 112 };
export const TRUE_VACUUM = { x: 282, y: 150 };
export const POTENTIAL_PATH = "M400 34C354 40 342 148 282 150C228 150 234 47 184 42C140 37 138 112 84 112C53 112 30 83 8 72";
const TUNNEL_MS = 900;
const ROLL_MS = 5000;
const FADE_MS = 1000;
export const VACUUM_CYCLE_MS = TUNNEL_MS + ROLL_MS + FADE_MS;

// Same cubic as the SVG, traversed from barrier crest towards the true minimum.
function descentPoint(t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * 184 + 3 * u ** 2 * t * 234 + 3 * u * t ** 2 * 228 + t ** 3 * TRUE_VACUUM.x,
    y: u ** 3 * 42 + 3 * u ** 2 * t * 47 + 3 * u * t ** 2 * 150 + t ** 3 * TRUE_VACUUM.y,
  };
}

// Exit on the far slope at the same potential as the false vacuum.
let low = 0;
let high = 1;
for (let i = 0; i < 48; i++) {
  const mid = (low + high) / 2;
  if (descentPoint(mid).y < FALSE_VACUUM.y) low = mid;
  else high = mid;
}
const EXIT_T = (low + high) / 2;
export const TUNNEL_EXIT = descentPoint(EXIT_T);

export const WAITING_VACUUM_FRAME: VacuumFrame = {
  phase: "waiting", point: FALSE_VACUUM, scale: .72,
  opacity: 0, equationsOpacity: 0, complete: false,
};

export function vacuumFrame(elapsedMs: number): VacuumFrame {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= VACUUM_CYCLE_MS) return { ...WAITING_VACUUM_FRAME, complete: true };
  const rollingTime = Math.max(0, elapsed - TUNNEL_MS);
  const fade = Math.max(0, (rollingTime - ROLL_MS) / FADE_MS);
  const tunneling = elapsed < TUNNEL_MS;
  // Exponential approach never reaches t = 1, even while the bubble fades.
  const rollT = 1 - (1 - EXIT_T) * Math.exp(-rollingTime / 4000);
  return {
    phase: tunneling ? "tunneling" : fade > 0 ? "fading" : "rolling",
    point: tunneling
      ? { x: FALSE_VACUUM.x + (TUNNEL_EXIT.x - FALSE_VACUUM.x) * elapsed / TUNNEL_MS, y: FALSE_VACUUM.y }
      : descentPoint(rollT),
    scale: .72 + .36 * Math.min(rollingTime / ROLL_MS, 1) + .04 * fade,
    opacity: Math.min(elapsed / 250, 1) * (1 - fade),
    equationsOpacity: 1 - fade,
    complete: false,
  };
}
