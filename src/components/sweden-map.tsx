import { currentLocation } from "@/data/location";
import { swedenPolygons } from "@/data/sweden-boundary";
import { swedenLakePolygons } from "@/data/sweden-lakes";

type Coordinate = [longitude: number, latitude: number];

const width = 200;
const height = 480;
const padding = 12;

// One Mercator projection determines both the country outline and the marker.
function mercator([longitude, latitude]: Coordinate): Coordinate {
  const phi = latitude * Math.PI / 180;
  return [
    longitude * Math.PI / 180,
    -Math.log(Math.tan(Math.PI / 4 + phi / 2)),
  ];
}

const projectedPoints = swedenPolygons.flatMap(polygon =>
  polygon.flatMap(ring => ring.map(point => mercator(point as Coordinate))),
);
const xs = projectedPoints.map(([x]) => x);
const ys = projectedPoints.map(([, y]) => y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const scale = Math.min(
  (width - 2 * padding) / (maxX - minX),
  (height - 2 * padding) / (maxY - minY),
);
const translateX = (width - (maxX - minX) * scale) / 2 - minX * scale;
const translateY = (height - (maxY - minY) * scale) / 2 - minY * scale;

function project(point: Coordinate): Coordinate {
  const [x, y] = mercator(point);
  return [x * scale + translateX, y * scale + translateY];
}

function polygonPath(polygons: number[][][][]): string {
  return polygons.map(polygon => polygon.map(ring => {
    const points = ring.map(point => project(point as Coordinate));
    return points.map(([x, y], index) =>
      `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`,
    ).join(" ") + " Z";
  }).join(" ")).join(" ");
}

const outline = polygonPath(swedenPolygons);
const lakes = polygonPath(swedenLakePolygons);
const landWithLakeHoles = `${outline} ${lakes}`;

function pointInRing([longitude, latitude]: Coordinate, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as Coordinate;
    const [xj, yj] = ring[j] as Coordinate;
    if ((yi > latitude) !== (yj > latitude)
      && longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inSweden(point: Coordinate): boolean {
  return swedenPolygons.some(([outer, ...holes]) =>
    outer !== undefined
      && pointInRing(point, outer)
      && !holes.some(hole => pointInRing(point, hole)),
  );
}

export function SwedenMap() {
  const location: Coordinate = [currentLocation.longitude, currentLocation.latitude];
  const marker = inSweden(location) ? project(location) : null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full translate-x-[6%]"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={landWithLakeHoles} fillRule="evenodd" className="fill-primary/15 stroke-primary/35" strokeWidth="2" />
        {marker && <>
          <circle cx={marker[0]} cy={marker[1]} r="13" className="location-pulse fill-[var(--spacetime-particle)] opacity-25" />
          <circle cx={marker[0]} cy={marker[1]} r="5" className="fill-[var(--spacetime-particle)]" />
          <circle cx={marker[0]} cy={marker[1]} r="2" className="fill-background" />
        </>}
      </svg>
      <span className="absolute bottom-5 right-5 rounded-full border border-primary/20 bg-background/80 px-2.5 py-1 text-[10px] font-medium text-primary backdrop-blur-sm sm:right-6">
        {currentLocation.label}
      </span>
    </div>
  );
}
