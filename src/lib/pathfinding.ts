// Fixed-Coordinate Path Generation System
// Based on Blender-exported coordinates (not GLB filenames)

export interface Obstacle {
  x: number;      // floor X (Blender X)
  z: number;      // floor Z (Blender Y)
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

// ============================================
// FIXED OBSTACLES - 가이드 문서의 고정 좌표들
// 모든 장애물 반경: 0.5 (가이드 기준)
// x = Blender X, z = Blender Y (바닥 평면)
// ============================================
export const FIXED_OBSTACLES: Obstacle[] = [
  { x: -6, z: 5, radius: 0.5 },
  { x: -5, z: -1, radius: 0.5 },
  { x: -5, z: 0, radius: 0.5 },
  { x: -5, z: 1, radius: 0.5 },
  { x: -5, z: 2, radius: 0.5 },
  { x: -5, z: 3, radius: 0.5 },
  { x: -5, z: 5, radius: 0.5 },
  { x: -4, z: -5, radius: 0.5 },
  { x: -4, z: -4, radius: 0.5 },
  { x: -4, z: -1, radius: 0.5 },
  { x: -4, z: 5, radius: 0.5 },
  { x: -3, z: -5, radius: 0.5 },
  { x: -3, z: -4, radius: 0.5 },
  { x: -3, z: -1, radius: 0.5 },
  { x: -3, z: 5, radius: 0.5 },
  { x: -2, z: -5, radius: 0.5 },
  { x: -2, z: -4, radius: 0.5 },
  { x: -2, z: -1, radius: 0.5 },
  { x: -2, z: 0, radius: 0.5 },
  { x: -2, z: 1, radius: 0.5 },
  { x: -2, z: 2, radius: 0.5 },
  { x: -2, z: 3, radius: 0.5 },
  { x: -1, z: -5, radius: 0.5 },
  { x: -1, z: -4, radius: 0.5 },
  { x: -1, z: 5, radius: 0.5 },
  { x: 0, z: -6, radius: 0.5 },
  { x: 0, z: -5, radius: 0.5 },
  { x: 0, z: -4, radius: 0.5 },
  { x: 0, z: -3, radius: 0.5 },
  { x: 0, z: -2, radius: 0.5 },
  { x: 0, z: 5, radius: 0.5 },
  { x: 1, z: -5, radius: 0.5 },
  { x: 1, z: -4, radius: 0.5 },
  { x: 1, z: -3, radius: 0.5 },
  { x: 1, z: -2, radius: 0.5 },
  { x: 1, z: 1, radius: 0.5 },
  { x: 1, z: 2, radius: 0.5 },
  { x: 1, z: 5, radius: 0.5 },
  { x: 2, z: -5, radius: 0.5 },
  { x: 2, z: -4, radius: 0.5 },
  { x: 2, z: 1, radius: 0.5 },
  { x: 2, z: 2, radius: 0.5 },
  { x: 2, z: 5, radius: 0.5 },
  { x: 3, z: -6, radius: 0.5 },
  { x: 3, z: -5, radius: 0.5 },
  { x: 3, z: -4, radius: 0.5 },
  { x: 3, z: -3, radius: 0.5 },
  { x: 3, z: 1, radius: 0.5 },
  { x: 3, z: 2, radius: 0.5 },
  { x: 3, z: 5, radius: 0.5 },
  { x: 4, z: -6, radius: 0.5 },
  { x: 4, z: -5, radius: 0.5 },
  { x: 4, z: -4, radius: 0.5 },
  { x: 4, z: -3, radius: 0.5 },
  { x: 4, z: 1, radius: 0.5 },
  { x: 4, z: 2, radius: 0.5 },
  { x: 4, z: 5, radius: 0.5 },
  { x: 5, z: -5, radius: 0.5 },
  { x: 5, z: -4, radius: 0.5 },
  { x: 5, z: 1, radius: 0.5 },
  { x: 5, z: 2, radius: 0.5 },
];

// Helper function to get fixed obstacles
export function getFixedObstacles(): Obstacle[] {
  return FIXED_OBSTACLES;
}

// ============================================
// DEPRECATED: GLB 파일명 기반 로직 (더 이상 사용 안 함)
// ============================================
const DIMENSION_REGEX = /_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)\.glb$/;

/** @deprecated Use FIXED_OBSTACLES instead */
export function parseDimensions(fileName: string): { width: number; height: number; depth: number } | null {
  const match = fileName.match(DIMENSION_REGEX);
  if (!match) return null;
  return {
    width: parseFloat(match[1]),
    height: parseFloat(match[2]),
    depth: parseFloat(match[3]),
  };
}

/** @deprecated Use getFixedObstacles() instead */
export function buildObstacles(furnitureLayout: FurnitureItem[]): Obstacle[] {
  // Return fixed obstacles instead of computing from furniture
  return FIXED_OBSTACLES;
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

  // Add safety margin to obstacle collision check
  const safetyMargin = 0.15; // Extra clearance from obstacles
  
  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;
    const effectiveRadius = o.radius + safetyMargin;
    if (dx * dx + dz * dz < effectiveRadius * effectiveRadius) {
      return false; // too close to furniture
    }
  }
  return true;
}

// Sample a random walkable point
export function sampleRandomWalkablePoint(
  obstacles: Obstacle[],
  maxAttempts = 100  // increased from 50
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

// Check if a line segment between two points is walkable (collision-free)
function isPathClear(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[],
  steps = 30 // Increased from 20 for better collision detection
): boolean {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = start[0] + (end[0] - start[0]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    
    if (!isWalkablePoint(x, z, obstacles)) {
      return false;
    }
  }
  return true;
}

// Find the blocking obstacle between two points
function findBlockingObstacle(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[]
): Obstacle | null {
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = start[0] + (end[0] - start[0]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    
    for (const o of obstacles) {
      const dx = x - o.x;
      const dz = z - o.z;
      if (dx * dx + dz * dz < o.radius * o.radius) {
        return o;
      }
    }
  }
  return null;
}

// Find detour point by going around the blocking obstacle
function findDetourPoint(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[]
): [number, number, number] | null {
  const blocker = findBlockingObstacle(start, end, obstacles);
  if (!blocker) return null;
  
  // Calculate perpendicular direction to path
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return null;
  
  // Perpendicular unit vector
  const perpX = -dz / len;
  const perpZ = dx / len;
  
  // Try both sides of the obstacle with increasing distance (increased margin from 0.8 to 1.2)
  const detourDistance = blocker.radius + 1.2; // Go around with larger margin
  const directions = [1, -1]; // Try both perpendicular directions
  
  for (const dir of directions) {
    // Create detour point perpendicular to the line, at obstacle position
    const detourX = blocker.x + perpX * detourDistance * dir;
    const detourZ = blocker.z + perpZ * detourDistance * dir;
    
    if (isWalkablePoint(detourX, detourZ, obstacles)) {
      const detourPoint: [number, number, number] = [detourX, 0.5, detourZ];
      
      // Check if both path segments are clear with more steps
      if (isPathClear(start, detourPoint, obstacles, 25) && 
          isPathClear(detourPoint, end, obstacles, 25)) {
        return detourPoint;
      }
    }
  }
  
  // Fallback: try random points around the midpoint
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  
  for (let attempt = 0; attempt < 20; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 2;
    
    const detourX = midX + Math.cos(angle) * radius;
    const detourZ = midZ + Math.sin(angle) * radius;
    
    if (isWalkablePoint(detourX, detourZ, obstacles)) {
      const detourPoint: [number, number, number] = [detourX, 0.5, detourZ];
      
      if (isPathClear(start, detourPoint, obstacles, 10) && 
          isPathClear(detourPoint, end, obstacles, 10)) {
        return detourPoint;
      }
    }
  }
  
  return null;
}

// Recursively smooth path segments that are blocked
function smoothSegment(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[],
  depth = 0
): [number, number, number][] {
  // Limit recursion depth
  if (depth > 3) return [end];
  
  // If path is clear, just return the endpoint
  if (isPathClear(start, end, obstacles)) {
    return [end];
  }
  
  // Path is blocked, find a detour
  const detour = findDetourPoint(start, end, obstacles);
  if (detour) {
    // Recursively smooth both segments
    const firstHalf = smoothSegment(start, detour, obstacles, depth + 1);
    const secondHalf = smoothSegment(detour, end, obstacles, depth + 1);
    return [...firstHalf, ...secondHalf];
  }
  
  // No detour found - try to step around obstacle manually
  const blocker = findBlockingObstacle(start, end, obstacles);
  if (blocker) {
    // Create waypoints that go around the obstacle
    const angleToStart = Math.atan2(start[2] - blocker.z, start[0] - blocker.x);
    const angleToEnd = Math.atan2(end[2] - blocker.z, end[0] - blocker.x);
    
    const clearance = blocker.radius + 1.2; // Increased from 0.8 to 1.2
    const wp1: [number, number, number] = [
      blocker.x + Math.cos(angleToStart) * clearance,
      0.5,
      blocker.z + Math.sin(angleToStart) * clearance
    ];
    const wp2: [number, number, number] = [
      blocker.x + Math.cos(angleToEnd) * clearance,
      0.5,
      blocker.z + Math.sin(angleToEnd) * clearance
    ];
    
    if (isWalkablePoint(wp1[0], wp1[2], obstacles) && 
        isWalkablePoint(wp2[0], wp2[2], obstacles)) {
      return [wp1, wp2, end];
    }
  }
  
  // Last resort: just return the endpoint (will pass through obstacle)
  return [end];
}

// Smooth path by adding detour points where needed
function smoothPathAroundObstacles(
  points: [number, number, number][],
  obstacles: Obstacle[]
): [number, number, number][] {
  if (points.length < 2) return points;
  
  const smoothed: [number, number, number][] = [points[0]];
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    const segment = smoothSegment(current, next, obstacles);
    smoothed.push(...segment);
  }
  
  return smoothed;
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
    return smoothPathAroundObstacles([ENTRY_POINT, CHECKOUT_POINT], obstacles);
  }

  // Smooth path to avoid obstacles between waypoints
  return smoothPathAroundObstacles(points, obstacles);
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

  // Smooth path to avoid obstacles between waypoints
  return smoothPathAroundObstacles(points, obstacles);
}
