// Furniture-Aware Path Generation System
// Based on furniture_product_layout data

export interface Obstacle {
  file: string;
  x: number;      // floor X (x_csv)
  z: number;      // floor Z (y_csv)
  radius: number; // collision radius
}

export interface FurnitureItem {
  file: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

// Store floor bounds (viewer coordinates)
export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax: 7.0,
  zMin: -7.4,
  zMax: 5.3,
};

// Semantic anchor points
export const ENTRY_POINT: [number, number, number] = [1.8, 0.5, 5.6];
export const CHECKOUT_POINT: [number, number, number] = [2.7, 0.5, -3.5];

// Parse dimensions from GLB filename (e.g., "Shelf_벽면진열대1_1.7x2.5x0.5.glb")
const DIMENSION_REGEX = /_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)\.glb$/;

export function parseDimensions(fileName: string): { width: number; height: number; depth: number } | null {
  const match = fileName.match(DIMENSION_REGEX);
  if (!match) {
    return null;
  }
  return {
    width: parseFloat(match[1]),
    height: parseFloat(match[2]),
    depth: parseFloat(match[3]),
  };
}

// Build obstacles from furniture layout
export function buildObstacles(furnitureLayout: FurnitureItem[]): Obstacle[] {
  return furnitureLayout
    .map((item) => {
      const dims = parseDimensions(item.file);
      if (!dims) return null;

      // Use circular approximation: radius = 60% of max(width, depth)
      const radius = Math.max(dims.width, dims.depth) * 0.6;

      return {
        file: item.file,
        x: item.x,           // floor X = x_csv
        z: item.y,           // floor Z = y_csv (coordinate mapping)
        radius,
      };
    })
    .filter((o): o is Obstacle => o !== null);
}

// Check if point is inside store bounds
export function isInsideStoreBounds(x: number, z: number): boolean {
  return (
    x >= STORE_BOUNDS.xMin &&
    x <= STORE_BOUNDS.xMax &&
    z >= STORE_BOUNDS.zMin &&
    z <= STORE_BOUNDS.zMax
  );
}

// Check if point is walkable (inside bounds and not colliding with obstacles)
export function isWalkablePoint(x: number, z: number, obstacles: Obstacle[]): boolean {
  if (!isInsideStoreBounds(x, z)) return false;

  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;
    if (dx * dx + dz * dz < o.radius * o.radius) {
      return false; // too close to furniture
    }
  }
  return true;
}

// Sample a random walkable point
export function sampleRandomWalkablePoint(
  obstacles: Obstacle[],
  maxAttempts = 50
): [number, number, number] | null {
  for (let i = 0; i < maxAttempts; i++) {
    const x = STORE_BOUNDS.xMin + Math.random() * (STORE_BOUNDS.xMax - STORE_BOUNDS.xMin);
    const z = STORE_BOUNDS.zMin + Math.random() * (STORE_BOUNDS.zMax - STORE_BOUNDS.zMin);

    if (isWalkablePoint(x, z, obstacles)) {
      const y = 0.5 + (Math.random() - 0.5) * 0.1; // small height noise
      return [x, y, z];
    }
  }
  return null;
}

// Generate a random furniture-aware path
export function generateRandomPath(obstacles: Obstacle[]): [number, number, number][] {
  const points: [number, number, number][] = [];

  // 1) Entry (slightly jittered)
  const entry: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.5,
    ENTRY_POINT[1],
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.5,
  ];
  if (isWalkablePoint(entry[0], entry[2], obstacles)) {
    points.push(entry);
  } else {
    points.push(ENTRY_POINT);
  }

  // 2) Random waypoints in the store (2-4 waypoints)
  const waypointCount = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < waypointCount; i++) {
    const p = sampleRandomWalkablePoint(obstacles);
    if (p) {
      points.push(p);
    }
  }

  // 3) Checkout (slightly jittered)
  const checkout: [number, number, number] = [
    CHECKOUT_POINT[0] + (Math.random() - 0.5) * 0.5,
    CHECKOUT_POINT[1],
    CHECKOUT_POINT[2] + (Math.random() - 0.5) * 0.5,
  ];
  if (isWalkablePoint(checkout[0], checkout[2], obstacles)) {
    points.push(checkout);
  } else {
    points.push(CHECKOUT_POINT);
  }

  // Fallback: if something went wrong, use simple entry → checkout
  if (points.length < 2) {
    return [ENTRY_POINT, CHECKOUT_POINT];
  }

  return points;
}

// Generate path that exits without purchase (returns to entry)
export function generateBrowseOnlyPath(obstacles: Obstacle[]): [number, number, number][] {
  const points: [number, number, number][] = [];

  // Entry
  const entry: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.5,
    ENTRY_POINT[1],
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.5,
  ];
  points.push(isWalkablePoint(entry[0], entry[2], obstacles) ? entry : ENTRY_POINT);

  // 1-2 quick waypoints
  const waypointCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < waypointCount; i++) {
    const p = sampleRandomWalkablePoint(obstacles);
    if (p) points.push(p);
  }

  // Return to entry
  const exit: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.3,
    ENTRY_POINT[1],
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.3,
  ];
  points.push(exit);

  return points;
}
