# Furniture-Aware Pathfinding System

This document explains the complete pathfinding logic used in the NeuralTwin 3D store visualization to ensure customer paths avoid furniture and product obstacles.

## Overview

The pathfinding system generates realistic customer movement paths within a 3D retail store environment. Paths are generated from an entry point, through random waypoints, to a checkout counter—all while avoiding collisions with furniture (shelves, racks, tables) and products.

---

## File Location

```
src/lib/pathfinding.ts
```

---

## Core Data Structures

### Obstacle Interface
```typescript
export interface Obstacle {
  file: string;      // GLB filename
  x: number;         // floor X position (from CSV x column)
  z: number;         // floor Z position (from CSV y column)
  radius: number;    // collision radius for circular approximation
}
```

### FurnitureItem Interface
```typescript
export interface FurnitureItem {
  file: string;      // GLB filename
  x: number;         // X position
  y: number;         // Y position (becomes Z on floor)
  z: number;         // Z position (height)
  rotationY: number; // Y-axis rotation
}
```

---

## Store Configuration

### Store Bounds
Defines the walkable floor area in viewer coordinates:
```typescript
export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax: 7.0,
  zMin: -7.4,
  zMax: 5.3,
};
```

### Semantic Anchor Points
```typescript
export const ENTRY_POINT: [number, number, number] = [1.8, 0.5, 5.6];
export const CHECKOUT_POINT: [number, number, number] = [2.7, 0.5, -3.5];
```

---

## Key Functions

### 1. Parse Dimensions from GLB Filename

Extracts width, height, and depth from GLB filenames (e.g., `Shelf_WallShelf1_1.7x2.5x0.5.glb`).

```typescript
const DIMENSION_REGEX = /_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)\.glb$/;

export function parseDimensions(fileName: string): { width: number; height: number; depth: number } | null {
  const match = fileName.match(DIMENSION_REGEX);
  if (!match) return null;
  return {
    width: parseFloat(match[1]),
    height: parseFloat(match[2]),
    depth: parseFloat(match[3]),
  };
}
```

---

### 2. Build Obstacles from Furniture Layout

Converts furniture items into circular collision obstacles.

```typescript
export function buildObstacles(furnitureLayout: FurnitureItem[]): Obstacle[] {
  return furnitureLayout
    .map((item) => {
      const dims = parseDimensions(item.file);
      if (!dims) return null;

      // Circular approximation: 85% of max(width, depth)
      // Minimum radius of 0.6m for small objects
      const baseRadius = Math.max(dims.width, dims.depth) * 0.85;
      const radius = Math.max(baseRadius, 0.6);

      return {
        file: item.file,
        x: item.x,           // floor X = x_csv
        z: item.y,           // floor Z = y_csv (note: y in data = Z on floor)
        radius,
      };
    })
    .filter((o): o is Obstacle => o !== null);
}
```

**Key Points:**
- Uses circular collision approximation for simplicity
- `radius = max(width, depth) * 0.85` provides good coverage
- Minimum radius of 0.6m ensures small objects still block paths

---

### 3. Boundary and Collision Checks

#### Check if Point is Inside Store Bounds
```typescript
export function isInsideStoreBounds(x: number, z: number): boolean {
  return (
    x >= STORE_BOUNDS.xMin &&
    x <= STORE_BOUNDS.xMax &&
    z >= STORE_BOUNDS.zMin &&
    z <= STORE_BOUNDS.zMax
  );
}
```

#### Check if Point is Walkable
```typescript
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
```

**Collision Detection Formula:**
```
distance² = (x - obstacle.x)² + (z - obstacle.z)²
collision = distance² < radius²
```

---

### 4. Sample Random Walkable Point

Generates random points within store bounds that don't collide with obstacles.

```typescript
export function sampleRandomWalkablePoint(
  obstacles: Obstacle[],
  maxAttempts = 100
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
```

---

### 5. Path Segment Collision Detection

#### Check if Path is Clear
```typescript
function isPathClear(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[],
  steps = 20
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
```

**Linear Interpolation:**
```
point(t) = start + (end - start) * t
where t ∈ [0, 1]
```

#### Find Blocking Obstacle
```typescript
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
```

---

### 6. Detour Point Finding

When a path is blocked, find a point to go around the obstacle.

```typescript
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
  
  // Try both sides with margin
  const detourDistance = blocker.radius + 0.8;
  const directions = [1, -1];
  
  for (const dir of directions) {
    const detourX = blocker.x + perpX * detourDistance * dir;
    const detourZ = blocker.z + perpZ * detourDistance * dir;
    
    if (isWalkablePoint(detourX, detourZ, obstacles)) {
      const detourPoint: [number, number, number] = [detourX, 0.5, detourZ];
      
      if (isPathClear(start, detourPoint, obstacles, 15) && 
          isPathClear(detourPoint, end, obstacles, 15)) {
        return detourPoint;
      }
    }
  }
  
  // Fallback: random points around midpoint
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
```

**Perpendicular Vector Calculation:**
```
Given direction vector (dx, dz):
perpendicular = (-dz/len, dx/len)  // normalized
```

---

### 7. Recursive Path Smoothing

Recursively subdivides blocked path segments until they're clear.

```typescript
function smoothSegment(
  start: [number, number, number],
  end: [number, number, number],
  obstacles: Obstacle[],
  depth = 0
): [number, number, number][] {
  // Limit recursion depth
  if (depth > 3) return [end];
  
  // If path is clear, return endpoint
  if (isPathClear(start, end, obstacles)) {
    return [end];
  }
  
  // Find detour point
  const detour = findDetourPoint(start, end, obstacles);
  if (detour) {
    // Recursively smooth both segments
    const firstHalf = smoothSegment(start, detour, obstacles, depth + 1);
    const secondHalf = smoothSegment(detour, end, obstacles, depth + 1);
    return [...firstHalf, ...secondHalf];
  }
  
  // Fallback: create waypoints around obstacle
  const blocker = findBlockingObstacle(start, end, obstacles);
  if (blocker) {
    const angleToStart = Math.atan2(start[2] - blocker.z, start[0] - blocker.x);
    const angleToEnd = Math.atan2(end[2] - blocker.z, end[0] - blocker.x);
    
    const clearance = blocker.radius + 0.8;
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
  
  // Last resort: return endpoint (may pass through obstacle)
  return [end];
}
```

---

### 8. Full Path Smoothing

Applies smoothing to all segments of a path.

```typescript
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
```

---

### 9. Path Generation Functions

#### Generate Random Purchase Path
```typescript
export function generateRandomPath(obstacles: Obstacle[]): [number, number, number][] {
  const points: [number, number, number][] = [];

  // 1) Entry (slightly jittered)
  const entry: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.5,
    ENTRY_POINT[1],
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.5,
  ];
  points.push(isWalkablePoint(entry[0], entry[2], obstacles) ? entry : ENTRY_POINT);

  // 2) Random waypoints (2-4)
  const waypointCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < waypointCount; i++) {
    const p = sampleRandomWalkablePoint(obstacles);
    if (p) points.push(p);
  }

  // 3) Checkout (slightly jittered)
  const checkout: [number, number, number] = [
    CHECKOUT_POINT[0] + (Math.random() - 0.5) * 0.5,
    CHECKOUT_POINT[1],
    CHECKOUT_POINT[2] + (Math.random() - 0.5) * 0.5,
  ];
  points.push(isWalkablePoint(checkout[0], checkout[2], obstacles) ? checkout : CHECKOUT_POINT);

  // Fallback
  if (points.length < 2) {
    return smoothPathAroundObstacles([ENTRY_POINT, CHECKOUT_POINT], obstacles);
  }

  return smoothPathAroundObstacles(points, obstacles);
}
```

#### Generate Browse-Only Path (No Purchase)
```typescript
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

  return smoothPathAroundObstacles(points, obstacles);
}
```

---

## Algorithm Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATH GENERATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. Load Furniture Data (CSV)
         │
         ▼
2. Build Obstacles Array
   ┌─────────────────────────────────────┐
   │ For each furniture item:            │
   │   - Parse dimensions from filename  │
   │   - Calculate collision radius      │
   │   - Create obstacle {x, z, radius}  │
   └─────────────────────────────────────┘
         │
         ▼
3. Generate Initial Waypoints
   ┌─────────────────────────────────────┐
   │ - Entry point (jittered)            │
   │ - 2-4 random walkable points        │
   │ - Checkout/Exit point (jittered)    │
   └─────────────────────────────────────┘
         │
         ▼
4. Smooth Path Around Obstacles
   ┌─────────────────────────────────────────────────────────────┐
   │ For each segment (point[i] → point[i+1]):                   │
   │                                                             │
   │   ┌─ Is path clear? ─────────────────────────────────────┐  │
   │   │  YES: Keep endpoint                                  │  │
   │   │  NO:  Find detour point                              │  │
   │   │       │                                              │  │
   │   │       ├─ Try perpendicular directions (both sides)   │  │
   │   │       │   detour = obstacle + perpendicular * dist   │  │
   │   │       │                                              │  │
   │   │       ├─ Fallback: Random points around midpoint     │  │
   │   │       │                                              │  │
   │   │       └─ Create waypoints around obstacle edges      │  │
   │   │                                                      │  │
   │   │  Recursively smooth sub-segments (depth ≤ 3)         │  │
   │   └──────────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────────┘
         │
         ▼
5. Return Smoothed Path Array
   [[x,y,z], [x,y,z], [x,y,z], ...]
```

---

## Usage Example

```typescript
import { 
  buildObstacles, 
  generateRandomPath, 
  generateBrowseOnlyPath,
  FurnitureItem 
} from '@/lib/pathfinding';

// 1. Load furniture layout from CSV
const furnitureLayout: FurnitureItem[] = [
  { file: 'Shelf_WallShelf1_1.7x2.5x0.5.glb', x: 2.0, y: -3.0, z: 0, rotationY: 0 },
  { file: 'Rack_Hanger1_1.7x1.5x0.5.glb', x: -1.5, y: 1.0, z: 0, rotationY: 90 },
  // ... more items
];

// 2. Build obstacles from furniture
const obstacles = buildObstacles(furnitureLayout);

// 3. Generate paths
const purchasePath = generateRandomPath(obstacles);
const browseOnlyPath = generateBrowseOnlyPath(obstacles);

// 4. Use paths for customer visualization
// Each path is an array of [x, y, z] coordinates
```

---

## Performance Considerations

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `maxAttempts` for random point | 100 | Prevent infinite loops in dense layouts |
| `steps` for path clear check | 20 | Balance between accuracy and performance |
| `recursion depth` limit | 3 | Prevent stack overflow |
| `detour distance` | radius + 0.8m | Clearance margin around obstacles |
| `minimum radius` | 0.6m | Ensure small objects block paths |

---

## Coordinate System Reference

```
        +Z (North)
          ↑
          │
          │
    ──────┼──────→ +X (East)
          │
          │
        -Z (South)

Y-axis = Height (vertical)
Floor level: Y ≈ 0.5
```

**CSV to 3D Mapping:**
- CSV `x` → 3D `x` (floor X)
- CSV `y` → 3D `z` (floor Z)
- CSV `z` → 3D `y` (height, usually 0)
