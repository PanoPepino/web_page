import { useEffect, useRef } from "react";

type Controls = {
  mass: number;
  x: number;
  y: number;
  speed: number;
  direction: number;
};

type Orbit = {
  r: number;
  phi: number;
  radialVelocity: number;
  energy: number;
  angularMomentum: number;
  trail: Array<{ x: number; y: number; createdAt: number }>;
  state: "active" | "finished";
};

const TRAIL_DURATION_MS = 2000;
const DEFAULTS: Controls = { mass: 2.2, x: -16, y: 5, speed: 0.65, direction: 4 };
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function SpacetimeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef(DEFAULTS);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const pointer = { x: 0, y: 0, hovering: false, pressed: false };
    const blackHole = { x: 0, y: 0, pinned: false, mass: controlsRef.current.mass };
    let orbit: Orbit | null = null;
    let launchTimer = 0;
    let pressStarted = 0;
    let lastMassUpdate = 0;
    let previousTime = performance.now();
    let frame = 0;
    let curvature = 0;
    let disappearing = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(canvas);
    const gridColor = styles.getPropertyValue("--spacetime-grid").trim();
    const particleColor = styles.getPropertyValue("--spacetime-particle").trim();
    const horizonColor = styles.getPropertyValue("--spacetime-horizon").trim();

    const dimensions = () => {
      const box = canvas.getBoundingClientRect();
      return { box, width: box.width, height: box.height, scale: Math.min(box.width, box.height) / 45 };
    };

    const resize = () => {
      const { box } = dimensions();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(box.width * ratio));
      canvas.height = Math.max(1, Math.floor(box.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const launch = (settings: Controls, delay = 0) => {
      window.clearTimeout(launchTimer);
      const begin = () => {
        const { width, height, scale } = dimensions();
        if (!blackHole.pinned) {
          blackHole.x = width * 0.58;
          blackHole.y = height * 0.43;
          blackHole.pinned = true;
        }
        blackHole.mass = settings.mass;
        disappearing = false;
        const x = settings.x;
        const y = settings.y;
        const r = Math.hypot(x, y);
        const eventHorizon = 2 * settings.mass;
        if (r <= eventHorizon * 1.08) {
          orbit = null;
          return;
        }
        const phi = Math.atan2(y, x);
        const heading = settings.direction * Math.PI / 180;
        const radialSpeed = settings.speed * Math.cos(heading - phi);
        const tangentialSpeed = settings.speed * Math.sin(heading - phi);
        const gamma = 1 / Math.sqrt(1 - settings.speed * settings.speed);
        const energy = Math.sqrt(1 - eventHorizon / r) * gamma;
        const angularMomentum = r * gamma * tangentialSpeed;
        orbit = {
          r,
          phi,
          radialVelocity: gamma * radialSpeed * Math.sqrt(1 - eventHorizon / r),
          energy,
          angularMomentum,
          trail: [],
          state: "active",
        };
      };
      if (delay > 0) launchTimer = window.setTimeout(begin, delay);
      else begin();
    };

    const localPoint = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const move = (event: PointerEvent) => {
      const point = localPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.hovering = true;
    };
    const enter = (event: PointerEvent) => {
      move(event);
    };
    const leave = () => {
      pointer.hovering = false;
    };
    const press = (event: PointerEvent) => {
      const point = localPoint(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.pressed = true;
      pressStarted = performance.now();
      lastMassUpdate = 0;
      blackHole.x = point.x;
      blackHole.y = point.y;
      blackHole.mass = 1;
      blackHole.pinned = true;
      disappearing = false;
      curvature = 0;
      orbit = null;
      window.clearTimeout(launchTimer);
      canvas.setPointerCapture(event.pointerId);
    };
    const release = (event: PointerEvent) => {
      if (!pointer.pressed) return;
      pointer.pressed = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const mass = Number(clamp(1 + (performance.now() - pressStarted) / 750, 1, 4.5).toFixed(1));
      blackHole.mass = mass;
      const { width, height, scale } = dimensions();
      const createCandidate = (safeFallback = false): Controls => {
        const edge = Math.floor(Math.random() * 4);
        const margin = 18 + Math.random() * 22;
        let startX = 0;
        let startY = 0;
        if (edge === 0 || edge === 1) {
          startX = edge === 0 ? -margin : width + margin;
          startY = height * (0.12 + Math.random() * 0.76);
        } else {
          startX = width * (0.12 + Math.random() * 0.76);
          startY = edge === 2 ? -margin : height + margin;
        }
        const x = (startX - blackHole.x) / scale;
        const y = (blackHole.y - startY) / scale;
        const distance = Math.hypot(x, y);
        const inwardX = -x / distance;
        const inwardY = -y / distance;
        const tangentX = -inwardY;
        const tangentY = inwardX;
        const handedness = Math.random() > 0.5 ? 1 : -1;
        const impact = handedness * mass * (safeFallback ? 10 + Math.random() * 2 : 3.4 + Math.random() * 6.4);
        const aimX = inwardX * distance + tangentX * impact;
        const aimY = inwardY * distance + tangentY * impact;
        return {
          mass,
          x,
          y,
          speed: Number((0.65 + Math.random() * 0.15).toFixed(2)),
          direction: Math.atan2(aimY, aimX) * 180 / Math.PI,
        };
      };
      let next = createCandidate();
      for (let attempt = 0; attempt < 256 && !isScatteringTrajectory(next); attempt += 1) next = createCandidate(attempt > 40);
      if (!isScatteringTrajectory(next)) return;
      controlsRef.current = next;
      launch(next, 1000);
    };

    canvas.addEventListener("pointerenter", enter);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointerdown", press);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const mapGridPoint = (x: number, y: number, width: number, height: number) => {
      if (curvature < 0.01) return { x, y };
      const centerX = blackHole.pinned ? blackHole.x : pointer.x;
      const centerY = blackHole.pinned ? blackHole.y : pointer.y;
      const mass = blackHole.pinned ? blackHole.mass : controlsRef.current.mass;
      const dx = centerX - x;
      const dy = centerY - y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const pinnedBoost = blackHole.pinned ? 1.22 : 1;
      const reach = Math.min(width, height) * (0.25 + mass * 0.09) * pinnedBoost;
      const pull = curvature * Math.exp(-(distance * distance) / (reach * reach)) * Math.min(distance * (0.12 + mass * 0.07) * pinnedBoost, 22 + mass * 13);
      return { x: x + dx / distance * pull, y: y + dy / distance * pull };
    };

    const drawGridLine = (horizontal: boolean, fixed: number, length: number, width: number, height: number) => {
      context.beginPath();
      for (let point = -96; point <= length + 96; point += 6) {
        const mapped = horizontal ? mapGridPoint(point, fixed, width, height) : mapGridPoint(fixed, point, width, height);
        if (point === -96) context.moveTo(mapped.x, mapped.y);
        else context.lineTo(mapped.x, mapped.y);
      }
      context.stroke();
    };

    // Exact equatorial timelike Schwarzschild equations in proper time:
    // r¨ = -M/r² + L²/r³ - 3ML²/r⁴, phi˙ = L/r².
    const derivative = (state: [number, number, number], mass: number, angularMomentum: number): [number, number, number] => {
      const [r, , radialVelocity] = state;
      const safeRadius = Math.max(r, 2 * mass * 0.98);
      return [
        radialVelocity,
        angularMomentum / (safeRadius * safeRadius),
        -mass / (safeRadius * safeRadius) + angularMomentum * angularMomentum / (safeRadius ** 3) - 3 * mass * angularMomentum * angularMomentum / (safeRadius ** 4),
      ];
    };
    const rk4 = (state: [number, number, number], step: number, mass: number, angularMomentum: number): [number, number, number] => {
      const add = (base: [number, number, number], delta: [number, number, number], factor: number): [number, number, number] => [
        base[0] + delta[0] * factor,
        base[1] + delta[1] * factor,
        base[2] + delta[2] * factor,
      ];
      const k1 = derivative(state, mass, angularMomentum);
      const k2 = derivative(add(state, k1, step / 2), mass, angularMomentum);
      const k3 = derivative(add(state, k2, step / 2), mass, angularMomentum);
      const k4 = derivative(add(state, k3, step), mass, angularMomentum);
      return [
        state[0] + step * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
        state[1] + step * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6,
        state[2] + step * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) / 6,
      ];
    };

    function isScatteringTrajectory(settings: Controls) {
      const initialRadius = Math.hypot(settings.x, settings.y);
      const horizon = 2 * settings.mass;
      if (initialRadius <= horizon * 1.2) return false;
      const phi = Math.atan2(settings.y, settings.x);
      const heading = settings.direction * Math.PI / 180;
      const gamma = 1 / Math.sqrt(1 - settings.speed * settings.speed);
      const angularMomentum = initialRadius * gamma * settings.speed * Math.sin(heading - phi);
      if (Math.abs(angularMomentum) < settings.mass * 2.8) return false;
      let state: [number, number, number] = [
        initialRadius,
        phi,
        gamma * settings.speed * Math.cos(heading - phi) * Math.sqrt(1 - horizon / initialRadius),
      ];
      let approached = false;
      for (let index = 0; index < 24000; index += 1) {
        state = rk4(state, 0.045, settings.mass, angularMomentum);
        if (!Number.isFinite(state[0]) || state[0] <= horizon * 1.12) return false;
        if (state[0] < initialRadius * 0.82) approached = true;
        if (approached && state[2] > 0 && state[0] >= initialRadius * 1.03) return true;
      }
      return false;
    }

    const draw = (time: number) => {
      const elapsed = Math.min((time - previousTime) / 16.667, 2);
      previousTime = time;
      const { width, height, scale } = dimensions();
      context.clearRect(0, 0, width, height);

      const curvatureTarget = blackHole.pinned ? (disappearing ? 0 : 1) : (pointer.hovering ? 1 : 0);
      curvature = reducedMotion ? curvatureTarget : curvature + (curvatureTarget - curvature) * Math.min(elapsed * 0.06, 1);
      if (Math.abs(curvatureTarget - curvature) < 0.005) curvature = curvatureTarget;
      if (disappearing && curvature === 0) {
        blackHole.pinned = false;
        disappearing = false;
        pointer.hovering = false;
      }

      if (pointer.pressed && time - lastMassUpdate > 80) {
        lastMassUpdate = time;
        const mass = Number(clamp(1 + (time - pressStarted) / 750, 1, 4.5).toFixed(1));
        blackHole.mass = mass;
        if (controlsRef.current.mass !== mass) {
          const next = { ...controlsRef.current, mass };
          controlsRef.current = next;
        }
      }

      context.strokeStyle = gridColor;
      context.lineWidth = 0.7;
      for (let y = -96; y <= height + 96; y += 28) drawGridLine(true, y, width, width, height);
      for (let x = -96; x <= width + 96; x += 28) drawGridLine(false, x, height, width, height);

      if (blackHole.pinned) {
        context.save();
        context.globalAlpha = curvature;
        const fullHorizonRadius = 2 * blackHole.mass * scale;
        const horizonRadius = fullHorizonRadius * Math.max(curvature, 0.05);
        context.setLineDash([4, 5]);
        context.lineDashOffset = -curvature * Math.PI * fullHorizonRadius;
        context.strokeStyle = horizonColor;
        context.lineWidth = 1;
        context.beginPath();
        context.arc(blackHole.x, blackHole.y, horizonRadius, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = styles.getPropertyValue("--spacetime-black-hole").trim();
        context.beginPath();
        context.arc(blackHole.x, blackHole.y, Math.max(5, horizonRadius), 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (orbit) {
        if (orbit.state === "active" && !reducedMotion) {
          const integrationSteps = 4;
          for (let index = 0; index < integrationSteps; index += 1) {
            const next = rk4([orbit.r, orbit.phi, orbit.radialVelocity], 0.045 * elapsed, blackHole.mass, orbit.angularMomentum);
            orbit.r = next[0]; orbit.phi = next[1]; orbit.radialVelocity = next[2];
            if (orbit.r <= 2 * blackHole.mass) {
              orbit.state = "finished";
              break;
            }
            const point = { x: blackHole.x + orbit.r * Math.cos(orbit.phi) * scale, y: blackHole.y - orbit.r * Math.sin(orbit.phi) * scale, createdAt: time };
            orbit.trail.push(point);
            if (point.x < -100 || point.x > width + 100 || point.y < -100 || point.y > height + 100) {
              orbit.state = "finished";
              break;
            }
          }
        }
        const cutoff = time - TRAIL_DURATION_MS;
        while (orbit.trail.length > 1 && orbit.trail[1]!.createdAt <= cutoff) orbit.trail.shift();
        if (orbit.trail.length === 1 && orbit.trail[0]!.createdAt <= cutoff) orbit.trail.length = 0;
        else if (orbit.trail.length > 1 && orbit.trail[0]!.createdAt < cutoff) {
          const first = orbit.trail[0]!;
          const second = orbit.trail[1]!;
          const fraction = (cutoff - first.createdAt) / (second.createdAt - first.createdAt);
          orbit.trail[0] = {
            x: first.x + (second.x - first.x) * fraction,
            y: first.y + (second.y - first.y) * fraction,
            createdAt: cutoff,
          };
        }
        context.save();
        context.strokeStyle = particleColor;
        context.lineWidth = 1.15;
        for (let index = 1; index < orbit.trail.length; index += 1) {
          const previous = orbit.trail[index - 1];
          const point = orbit.trail[index];
          if (!previous || !point) continue;
          const ageOpacity = clamp(1 - (time - point.createdAt) / TRAIL_DURATION_MS, 0, 1);
          if (ageOpacity <= 0) continue;
          context.globalAlpha = ageOpacity * 0.6;
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
        const current = orbit.trail[orbit.trail.length - 1];
        if (current && orbit.state === "active") {
          context.globalAlpha = 1;
          context.fillStyle = particleColor;
          context.beginPath();
          context.arc(current.x, current.y, 2.4, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
        if (orbit.state === "finished" && orbit.trail.length === 0) {
          orbit = null;
          disappearing = true;
        }
      }
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.clearTimeout(launchTimer);
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerenter", enter);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointerdown", press);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 size-full touch-none" aria-label="Interactive Schwarzschild geodesic demonstration" />;
}
