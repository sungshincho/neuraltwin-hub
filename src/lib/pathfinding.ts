// Grid + Backtracking 기반 Pathfinding System
// 1x1 셀 격자에서 상하좌우 인접 셀로만 이동
// 막히면 백트래킹으로 우회

// ============================================
// 타입 정의
// ============================================
export interface Obstacle {
  x: number;
  z: number;
  radius: number;
}

export interface FurnitureItem {
  file: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

type Cell = { cx: number; cz: number };

type GridPathOptions = {
  startWorld: [number, number, number];
  targetWorld: [number, number, number];
  maxSteps?: number;
  maxVisitPerCell?: number;
  goalRadius?: number;
};

// ============================================
// 상수 정의
// ============================================

// Store floor bounds
export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax: 7.0,
  zMin: -7.4,
  zMax: 5.3,
};

// Semantic anchor points
export const ENTRY_POINT: [number, number, number] = [1.8, 0.5, 5.6];
export const CHECKOUT_POINT: [number, number, number] = [2.7, 0.5, -3.5];

// 4방향 이동
const DIRS: Cell[] = [
  { cx: 1, cz: 0 },
  { cx: -1, cz: 0 },
  { cx: 0, cz: 1 },
  { cx: 0, cz: -1 },
];

// ============================================
// 고정 장애물 좌표 (반경 0.5)
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

// ============================================
// 유틸 함수
// ============================================

const cellKey = (cx: number, cz: number) => `${cx}:${cz}`;

// BLOCKED_CELLS 세트 생성
export const BLOCKED_CELLS = new Set<string>(
  FIXED_OBSTACLES.map((o) => cellKey(Math.round(o.x), Math.round(o.z)))
);

// 셀 → 월드 좌표
export function cellToWorld(cell: Cell, y: number = 0.5): [number, number, number] {
  return [cell.cx, y, cell.cz];
}

// 월드 → 셀 좌표
export function worldToCell(x: number, z: number): Cell {
  return { cx: Math.round(x), cz: Math.round(z) };
}

// 셀이 STORE_BOUNDS 내부인지 확인
export function isCellInsideBounds(cell: Cell): boolean {
  const { cx, cz } = cell;
  return (
    cx >= Math.ceil(STORE_BOUNDS.xMin) &&
    cx <= Math.floor(STORE_BOUNDS.xMax) &&
    cz >= Math.ceil(STORE_BOUNDS.zMin) &&
    cz <= Math.floor(STORE_BOUNDS.zMax)
  );
}

// 셀이 blocked인지 확인
export function isBlockedCell(cell: Cell): boolean {
  return BLOCKED_CELLS.has(cellKey(cell.cx, cell.cz));
}

// 이동 가능한 인접 셀 반환
export function getNeighborCells(
  cell: Cell,
  visitedCount: Map<string, number>,
  maxVisitPerCell: number
): Cell[] {
  const result: Cell[] = [];

  for (const d of DIRS) {
    const next: Cell = { cx: cell.cx + d.cx, cz: cell.cz + d.cz };

    if (!isCellInsideBounds(next)) continue;
    if (isBlockedCell(next)) continue;

    const key = cellKey(next.cx, next.cz);
    const count = visitedCount.get(key) ?? 0;
    if (count >= maxVisitPerCell) continue;

    result.push(next);
  }

  return result;
}

// ============================================
// 백트래킹 기반 경로 생성
// ============================================

export function generatePathWithBacktracking(
  options: GridPathOptions
): [number, number, number][] {
  const {
    startWorld,
    targetWorld,
    maxSteps = 500,
    maxVisitPerCell = 3,
    goalRadius = 1.0,
  } = options;

  const startCell = worldToCell(startWorld[0], startWorld[2]);
  const targetCell = worldToCell(targetWorld[0], targetWorld[2]);

  // path를 스택처럼 사용
  const pathCells: Cell[] = [startCell];

  // 셀별 방문 횟수
  const visitedCount = new Map<string, number>();
  visitedCount.set(cellKey(startCell.cx, startCell.cz), 1);

  // 거리 계산 헬퍼
  const dist2 = (a: Cell, b: Cell) =>
    (a.cx - b.cx) * (a.cx - b.cx) + (a.cz - b.cz) * (a.cz - b.cz);

  const goalRadius2 = goalRadius * goalRadius;

  let steps = 0;

  while (pathCells.length > 0 && steps < maxSteps) {
    steps++;

    const current = pathCells[pathCells.length - 1];

    // 목표 근처 도달 여부 체크
    if (dist2(current, targetCell) <= goalRadius2) {
      break;
    }

    // 현재에서 갈 수 있는 인접 셀 리스트
    let neighbors = getNeighborCells(current, visitedCount, maxVisitPerCell);

    if (neighbors.length === 0) {
      // 인접 셀로 더 나아갈 수 없음 → 백트래킹
      pathCells.pop();
      continue;
    }

    // 목표에 더 가까운 방향 우선 정렬
    neighbors.sort((a, b) => dist2(a, targetCell) - dist2(b, targetCell));

    // 하나 선택해서 이동
    const next = neighbors[0];
    pathCells.push(next);

    const key = cellKey(next.cx, next.cz);
    visitedCount.set(key, (visitedCount.get(key) ?? 0) + 1);
  }

  // 셀 경로를 world 경로로 변환
  const result: [number, number, number][] = pathCells.map((cell) =>
    cellToWorld(cell, startWorld[1] ?? 0.5)
  );

  return result;
}

// ============================================
// 공개 API (기존 함수명 유지)
// ============================================

// 기존 코드와 호환을 위한 헬퍼
export function getFixedObstacles(): Obstacle[] {
  return FIXED_OBSTACLES;
}

// 랜덤 경로 생성 (Entry → Checkout)
export function generateRandomPath(_obstacles?: Obstacle[]): [number, number, number][] {
  // 시작점 약간 jitter
  const startWorld: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.3,
    0.5,
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.3,
  ];
  
  // 끝점 약간 jitter
  const targetWorld: [number, number, number] = [
    CHECKOUT_POINT[0] + (Math.random() - 0.5) * 0.3,
    0.5,
    CHECKOUT_POINT[2] + (Math.random() - 0.5) * 0.3,
  ];

  return generatePathWithBacktracking({
    startWorld,
    targetWorld,
    maxSteps: 800,
    maxVisitPerCell: 4,
    goalRadius: 1.5,
  });
}

// Browse-only 경로 (Entry → 매장 내부 → Entry로 복귀)
export function generateBrowseOnlyPath(_obstacles?: Obstacle[]): [number, number, number][] {
  const startWorld: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.3,
    0.5,
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.3,
  ];

  // 매장 내부 랜덤 포인트를 중간 목표로
  const midX = STORE_BOUNDS.xMin + Math.random() * (STORE_BOUNDS.xMax - STORE_BOUNDS.xMin);
  const midZ = STORE_BOUNDS.zMin + Math.random() * (STORE_BOUNDS.zMax - STORE_BOUNDS.zMin);
  const midWorld: [number, number, number] = [midX, 0.5, midZ];

  // Entry로 복귀
  const endWorld: [number, number, number] = [
    ENTRY_POINT[0] + (Math.random() - 0.5) * 0.2,
    0.5,
    ENTRY_POINT[2] + (Math.random() - 0.5) * 0.2,
  ];

  // 1단계: Entry → 중간 포인트
  const path1 = generatePathWithBacktracking({
    startWorld,
    targetWorld: midWorld,
    maxSteps: 400,
    maxVisitPerCell: 3,
    goalRadius: 2.0,
  });

  // 2단계: 중간 포인트 → Entry
  const lastPoint = path1.length > 0 ? path1[path1.length - 1] : startWorld;
  const path2 = generatePathWithBacktracking({
    startWorld: lastPoint,
    targetWorld: endWorld,
    maxSteps: 400,
    maxVisitPerCell: 3,
    goalRadius: 1.5,
  });

  // 경로 합치기 (중복 제거)
  return [...path1, ...path2.slice(1)];
}

// ============================================
// DEPRECATED: 기존 함수들 (호환용)
// ============================================

/** @deprecated Use FIXED_OBSTACLES instead */
export function buildObstacles(_furnitureLayout: FurnitureItem[]): Obstacle[] {
  return FIXED_OBSTACLES;
}

/** @deprecated Use isCellInsideBounds instead */
export function isInsideStoreBounds(x: number, z: number): boolean {
  return (
    x >= STORE_BOUNDS.xMin &&
    x <= STORE_BOUNDS.xMax &&
    z >= STORE_BOUNDS.zMin &&
    z <= STORE_BOUNDS.zMax
  );
}

/** @deprecated Use grid-based pathfinding instead */
export function isWalkablePoint(x: number, z: number, _obstacles: Obstacle[]): boolean {
  if (!isInsideStoreBounds(x, z)) return false;
  const cell = worldToCell(x, z);
  return !isBlockedCell(cell);
}

/** @deprecated Use grid-based pathfinding instead */
export function sampleRandomWalkablePoint(
  _obstacles: Obstacle[],
  maxAttempts = 100
): [number, number, number] | null {
  for (let i = 0; i < maxAttempts; i++) {
    const x = STORE_BOUNDS.xMin + Math.random() * (STORE_BOUNDS.xMax - STORE_BOUNDS.xMin);
    const z = STORE_BOUNDS.zMin + Math.random() * (STORE_BOUNDS.zMax - STORE_BOUNDS.zMin);
    const cell = worldToCell(x, z);
    
    if (isCellInsideBounds(cell) && !isBlockedCell(cell)) {
      const y = 0.5 + (Math.random() - 0.5) * 0.1;
      return [cell.cx, y, cell.cz];
    }
  }
  return null;
}
