/**
 * Grid + Backtracking 기반 Footfall Pathfinding
 * 
 * 좌표 체계:
 * - CSV(x, y, z) → 3D Viewer / Path (x, height, depth) = (x, z, y)
 * - 이 파일의 모든 path 포인트는 [x, y(높이), z(깊이)] 형식
 * - 장애물/셀 좌표는 (x, z) 평면 좌표
 */

// ============================================================
// 타입 정의
// ============================================================

export type Cell = { cx: number; cz: number };

export type TimeSlot = "morning" | "afternoon" | "evening";

export type TimeSlotConfig = {
  maxStepsBase: number;
  maxStepsJitter: number;
  minStepsBeforeGoal: number;
  maxVisitPerCell: number;
  checkoutPathRatio: number;
  entryReturnPathRatio: number;
};

export type GridPathOptions = {
  startWorld: [number, number, number];
  targetWorlds: Array<[number, number, number]>;
  slotConfig: TimeSlotConfig;
};

// ============================================================
// 상수 정의
// ============================================================

// 입구 좌표 (평면 기준 -2, 5)
export const ENTRY_POINT: [number, number, number] = [-2, 0.5, 5];

// 계산대 대표점
export const CHECKOUT_POINT: [number, number, number] = [-3, 0.5, -4];

// 계산대 영역 셀들 (goal로 사용)
export const CHECKOUT_CELLS: [number, number, number][] = [
  [-4, 0.5, -4],
  [-4, 0.5, -5],
  [-3, 0.5, -4],
  [-3, 0.5, -5],
  [-2, 0.5, -4],
  [-2, 0.5, -5],
];

// 입구로 돌아가는 경로의 목표 셀들
export const ENTRY_GOAL_CELLS: [number, number, number][] = [
  ENTRY_POINT,
  [ENTRY_POINT[0] - 1, ENTRY_POINT[1], ENTRY_POINT[2]],
  [ENTRY_POINT[0] + 1, ENTRY_POINT[1], ENTRY_POINT[2]],
];

// 매장 바닥 경계
export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax: 7.0,
  zMin: -7.4,
  zMax: 5.3,
};

// 피해야 하는 셀 목록 (행거/디스플레이 선반/테이블)
// 계산대 영역과 (-1,-4), (-1,-5)는 제외됨
export const FIXED_OBSTACLES: { x: number; z: number; radius: number }[] = [
  { x: -6, z: 5, radius: 0.5 },
  { x: -5, z: -1, radius: 0.5 },
  { x: -5, z: 0, radius: 0.5 },
  { x: -5, z: 1, radius: 0.5 },
  { x: -5, z: 2, radius: 0.5 },
  { x: -5, z: 3, radius: 0.5 },
  { x: -5, z: 5, radius: 0.5 },
  { x: -4, z: -1, radius: 0.5 },
  { x: -4, z: 5, radius: 0.5 },
  { x: -3, z: -1, radius: 0.5 },
  { x: -3, z: 5, radius: 0.5 },
  { x: -2, z: -1, radius: 0.5 },
  { x: -2, z: 0, radius: 0.5 },
  { x: -2, z: 1, radius: 0.5 },
  { x: -2, z: 2, radius: 0.5 },
  { x: -2, z: 3, radius: 0.5 },
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

// ============================================================
// 유틸리티 함수
// ============================================================

export const cellKey = (cx: number, cz: number): string => `${cx}:${cz}`;

// BLOCKED_CELLS Set 생성
export const BLOCKED_CELLS = new Set<string>(
  FIXED_OBSTACLES.map(o => cellKey(Math.round(o.x), Math.round(o.z)))
);

export function cellToWorld(cell: Cell, y: number = 0.5): [number, number, number] {
  return [cell.cx, y, cell.cz];
}

export function worldToCell(x: number, z: number): Cell {
  return { cx: Math.round(x), cz: Math.round(z) };
}

export function isCellInsideBounds(cell: Cell): boolean {
  const { cx, cz } = cell;
  return (
    cx >= Math.ceil(STORE_BOUNDS.xMin) &&
    cx <= Math.floor(STORE_BOUNDS.xMax) &&
    cz >= Math.ceil(STORE_BOUNDS.zMin) &&
    cz <= Math.floor(STORE_BOUNDS.zMax)
  );
}

export function isBlockedCell(cell: Cell): boolean {
  return BLOCKED_CELLS.has(cellKey(cell.cx, cell.cz));
}

// ============================================================
// 인접 셀 및 방문 관련 함수
// ============================================================

const DIRS: Cell[] = [
  { cx: 1, cz: 0 },
  { cx: -1, cz: 0 },
  { cx: 0, cz: 1 },
  { cx: 0, cz: -1 },
];

const RECENT_MEMORY = 5;

export function isRecentlyVisited(cell: Cell, history: Cell[]): boolean {
  return history
    .slice(-RECENT_MEMORY)
    .some((h) => h.cx === cell.cx && h.cz === cell.cz);
}

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

// ============================================================
// 시간대별 파라미터 설정
// ============================================================

export function getTimeSlotConfig(slot: TimeSlot): TimeSlotConfig {
  switch (slot) {
    case "morning":
      return {
        maxStepsBase: 400,
        maxStepsJitter: 80,
        minStepsBeforeGoal: 8,
        maxVisitPerCell: 3,
        checkoutPathRatio: 0.7,
        entryReturnPathRatio: 0.3,
      };
    case "afternoon":
      return {
        maxStepsBase: 550,
        maxStepsJitter: 120,
        minStepsBeforeGoal: 12,
        maxVisitPerCell: 4,
        checkoutPathRatio: 0.6,
        entryReturnPathRatio: 0.4,
      };
    case "evening":
    default:
      return {
        maxStepsBase: 500,
        maxStepsJitter: 100,
        minStepsBeforeGoal: 10,
        maxVisitPerCell: 4,
        checkoutPathRatio: 0.4,
        entryReturnPathRatio: 0.6,
      };
  }
}

export function getTimeSlotFromRange(timeRange: string): TimeSlot {
  const hour = parseInt(timeRange.slice(0, 2), 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// ============================================================
// 가구/디스플레이 주변 선호도 함수
// ============================================================

/**
 * 셀이 가구/디스플레이 주변인지 확인
 * BLOCKED_CELLS(행거/선반/테이블) 옆 셀을 선호하도록 함
 */
export function isNearFixture(cell: Cell): boolean {
  return [
    { cx: cell.cx + 1, cz: cell.cz },
    { cx: cell.cx - 1, cz: cell.cz },
    { cx: cell.cx, cz: cell.cz + 1 },
    { cx: cell.cx, cz: cell.cz - 1 },
  ].some((n) => isBlockedCell(n));
}

/**
 * 벽 디스플레이 라인에 대한 선호도 점수
 * STORE_BOUNDS 밖의 벽면 디스플레이를 간접적으로 끌어당김
 */
export function wallAffinityScore(cell: Cell): number {
  // 오른쪽 벽 (x≈7) 과 왼쪽 벽 (x≈-7) 기준
  const rightWallDist = Math.abs(cell.cx - 6);
  const leftWallDist = Math.abs(cell.cx + 6);

  // 벽에 가까우면 음수 점수로 선호도 부여
  const rightBonus = rightWallDist <= 2 ? -0.5 : 0;
  const leftBonus = leftWallDist <= 2 ? -0.5 : 0;

  return rightBonus + leftBonus;
}

// ============================================================
// 백트래킹 기반 경로 생성 로직
// ============================================================

export function generatePathWithBacktracking(
  options: GridPathOptions
): [number, number, number][] {
  const { startWorld, targetWorlds, slotConfig } = options;
  const { maxStepsBase, maxStepsJitter, minStepsBeforeGoal, maxVisitPerCell } = slotConfig;

  // 시간대별로 maxSteps를 랜덤하게 조정
  const jitter = Math.floor((Math.random() * 2 - 1) * maxStepsJitter);
  const maxSteps = Math.max(50, maxStepsBase + jitter);

  const startCell = worldToCell(startWorld[0], startWorld[2]);
  const targetCells = targetWorlds.map((t) => worldToCell(t[0], t[2]));

  // path를 스택처럼 사용
  const pathCells: Cell[] = [startCell];

  // 셀별 방문 횟수
  const visitedCount = new Map<string, number>();
  visitedCount.set(cellKey(startCell.cx, startCell.cz), 1);

  const dist2 = (a: Cell, b: Cell) =>
    (a.cx - b.cx) * (a.cx - b.cx) + (a.cz - b.cz) * (a.cz - b.cz);

  const goalRadius2 = 1.0 * 1.0;

  let steps = 0;

  while (pathCells.length > 0 && steps < maxSteps) {
    steps++;

    const current = pathCells[pathCells.length - 1];

    // 최소 스텝 이상 진행한 경우에만 goal 도달 체크
    const canCheckGoal = steps >= minStepsBeforeGoal;
    const reachedGoal =
      canCheckGoal &&
      targetCells.some((target) => dist2(current, target) <= goalRadius2);

    if (reachedGoal) break;

    // 현재에서 갈 수 있는 인접 셀 리스트
    let neighbors = getNeighborCells(current, visitedCount, maxVisitPerCell);

    // 직전 셀은 제외해서 바로 되돌아가기를 피함
    const prevCell = pathCells.length >= 2 ? pathCells[pathCells.length - 2] : null;

    if (prevCell) {
      neighbors = neighbors.filter(
        (n) => !(n.cx === prevCell.cx && n.cz === prevCell.cz)
      );
    }

    if (neighbors.length === 0) {
      // 백트래킹: 더 나아갈 수 없으면 한 칸 뒤로
      pathCells.pop();
      continue;
    }

    // 최근 방문 셀은 가능한 피함
    const recentHistory = pathCells;
    let candidates = neighbors.filter((n) => !isRecentlyVisited(n, recentHistory));
    if (candidates.length === 0) {
      candidates = neighbors;
    }

    // 랜덤성 + 목표 방향 + 가구 주변 + 벽 선호도
    candidates.sort(() => Math.random() - 0.5);

    candidates.sort((a, b) => {
      const da = Math.min(...targetCells.map((t) => dist2(a, t)));
      const db = Math.min(...targetCells.map((t) => dist2(b, t)));

      const aNearFixture = isNearFixture(a) ? -1 : 0;
      const bNearFixture = isNearFixture(b) ? -1 : 0;

      const aWall = wallAffinityScore(a);
      const bWall = wallAffinityScore(b);

      return da + aNearFixture + aWall - (db + bNearFixture + bWall);
    });

    const next = candidates[0];
    pathCells.push(next);

    const key = cellKey(next.cx, next.cz);
    visitedCount.set(key, (visitedCount.get(key) ?? 0) + 1);
  }

  // 셀 경로를 world 경로로 변환
  let result: [number, number, number][] = pathCells.map((cell) =>
    cellToWorld(cell, startWorld[1] ?? 0.5)
  );

  // 최소 2개 점 보장
  if (result.length === 1) {
    result = [result[0], result[0]];
  } else if (result.length === 0) {
    const fallbackTarget = targetWorlds[0] ?? startWorld;
    result = [startWorld, fallbackTarget];
  }

  return result;
}

// ============================================================
// 경로 생성 함수
// ============================================================

/**
 * 계산대 도착 경로 (입구 → 매장 순회 → 계산대)
 */
export function generatePathToCheckout(slot: TimeSlot): [number, number, number][] {
  const startWorld: [number, number, number] = ENTRY_POINT;
  const config = getTimeSlotConfig(slot);

  return generatePathWithBacktracking({
    startWorld,
    targetWorlds: CHECKOUT_CELLS,
    slotConfig: config,
  });
}

/**
 * 입구로 다시 나가는 경로 (입구 → 매장 순회 → 입구)
 */
export function generatePathBackToEntry(slot: TimeSlot): [number, number, number][] {
  const startWorld: [number, number, number] = ENTRY_POINT;
  const config = getTimeSlotConfig(slot);

  return generatePathWithBacktracking({
    startWorld,
    targetWorlds: ENTRY_GOAL_CELLS,
    slotConfig: config,
  });
}

/**
 * 시간대에 따라 랜덤하게 계산대/입구 경로 생성
 */
export function generateRandomCustomerPath(timeRange: string): [number, number, number][] {
  const slot = getTimeSlotFromRange(timeRange);
  const config = getTimeSlotConfig(slot);

  const r = Math.random();
  const total = config.checkoutPathRatio + config.entryReturnPathRatio;
  const checkoutThreshold = config.checkoutPathRatio / total;

  if (r < checkoutThreshold) {
    return generatePathToCheckout(slot);
  } else {
    return generatePathBackToEntry(slot);
  }
}

// ============================================================
// 하위 호환성을 위한 레거시 함수들
// ============================================================

/** @deprecated Use FIXED_OBSTACLES directly */
export function buildObstacles() {
  return FIXED_OBSTACLES;
}

/** @deprecated Use isCellInsideBounds with worldToCell */
export function isInsideStoreBounds(x: number, z: number): boolean {
  return (
    x >= STORE_BOUNDS.xMin &&
    x <= STORE_BOUNDS.xMax &&
    z >= STORE_BOUNDS.zMin &&
    z <= STORE_BOUNDS.zMax
  );
}

/** @deprecated Use !isBlockedCell with worldToCell */
export function isWalkablePoint(x: number, z: number): boolean {
  const cell = worldToCell(x, z);
  return isCellInsideBounds(cell) && !isBlockedCell(cell);
}

/** @deprecated Use generateRandomCustomerPath */
export function generateRandomPath(timeRange?: string): [number, number, number][] {
  return generateRandomCustomerPath(timeRange ?? "12:00-13:00");
}

/** @deprecated Use generatePathBackToEntry */
export function generateBrowseOnlyPath(timeRange?: string): [number, number, number][] {
  const slot = getTimeSlotFromRange(timeRange ?? "12:00-13:00");
  return generatePathBackToEntry(slot);
}
