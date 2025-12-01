/**
 * Walkable Path Cases 기반 Footfall Pathfinding
 * 
 * 15개의 사전 정의된 경로 케이스를 시간대에 따라 랜덤 선택
 * 좌표: [x, 0.5, z] 형식 (바닥 평면 기준)
 */

// ============================================================
// 타입 정의
// ============================================================

export type Cell = { cx: number; cz: number };
export type TimeSlot = "morning" | "afternoon" | "evening";

// ============================================================
// 15개 사전 정의 경로 케이스
// ============================================================

const PATH_CASES: [number, number][][] = [
  // Case 1 - 26 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-6,-3],[-5,-3],[-5,-2],[-6,-2],[-6,-3],[-6,-4],[-6,-5],[-5,-5],[-5,-4],[-5,-3],[-4,-3],[-3,-3],[-3,-4],[-2,-4]],
  
  // Case 2 - 17 좌표
  [[-2,5],[-2,4],[-3,4],[-3,3],[-4,3],[-4,2],[-4,1],[-4,0],[-3,0],[-3,1],[-3,2],[-3,3],[-4,3],[-4,4],[-3,4],[-2,4],[-1,4]],
  
  // Case 3 - 24 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-5,-2],[-4,-2],[-3,-2],[-2,-2],[-2,-3],[-3,-3],[-3,-2],[-4,-2],[-5,-2],[-5,-3],[-5,-4],[-5,-5]],
  
  // Case 4 - 23 좌표
  [[-2,5],[-2,4],[-1,4],[-1,3],[-1,2],[0,2],[0,1],[0,0],[0,-1],[-1,-1],[-1,-2],[-1,-3],[-1,-4],[-2,-4],[-3,-4],[-3,-3],[-2,-3],[-2,-2],[-1,-2],[-1,-1],[0,-1],[0,0],[-1,0]],
  
  // Case 5 - 14 좌표
  [[-2,5],[-2,4],[-1,4],[-1,3],[0,3],[1,3],[2,3],[3,3],[4,3],[4,4],[5,4],[5,5],[6,5],[6,4]],
  
  // Case 6 - 27 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-5,-2],[-5,-3],[-4,-3],[-4,-4],[-5,-4],[-6,-4],[-6,-5],[-6,-6],[-6,-7],[-5,-7],[-4,-7],[-4,-6],[-4,-5],[-4,-4],[-5,-4]],
  
  // Case 7 - 14 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-6,-3],[-6,-4]],
  
  // Case 8 - 22 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-6,-3],[-6,-4],[-5,-4],[-4,-4],[-4,-5],[-5,-5],[-6,-5],[-6,-4],[-5,-4],[-5,-5]],
  
  // Case 9 - 12 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-4,3],[-3,3],[-3,4],[-2,4],[-1,4],[0,4],[0,3],[-1,3]],
  
  // Case 10 - 20 좌표
  [[-2,5],[-2,4],[-3,4],[-3,3],[-4,3],[-4,4],[-5,4],[-6,4],[-6,3],[-6,2],[-6,1],[-6,0],[-6,-1],[-6,-2],[-6,-3],[-5,-3],[-5,-4],[-5,-5],[-5,-6],[-5,-7]],
  
  // Case 11 - 17 좌표
  [[-2,5],[-2,4],[-3,4],[-3,3],[-3,2],[-3,1],[-3,0],[-4,0],[-4,1],[-3,1],[-3,0],[-4,0],[-4,1],[-4,2],[-4,3],[-3,3],[-3,4]],
  
  // Case 12 - 15 좌표
  [[-2,5],[-2,4],[-3,4],[-4,4],[-4,3],[-3,3],[-3,4],[-2,4],[-1,4],[0,4],[0,3],[1,3],[2,3],[3,3],[3,4]],
  
  // Case 13 - 15 좌표
  [[-2,5],[-2,4],[-1,4],[-1,3],[-1,2],[0,2],[0,1],[0,0],[0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[4,0],[3,0]],
  
  // Case 14 - 21 좌표
  [[-2,5],[-2,4],[-1,4],[-1,3],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[6,4],[7,4],[7,3],[6,3],[6,2],[7,2],[7,3],[7,4],[6,4],[5,4]],
  
  // Case 15 - 17 좌표
  [[-2,5],[-2,4],[-1,4],[0,4],[1,4],[1,3],[0,3],[0,2],[-1,2],[-1,1],[-1,0],[-1,-1],[-1,-2],[-2,-2],[-3,-2],[-4,-2],[-4,-3]],
];

// 시간대별 선호 케이스 (특정 케이스에 가중치 부여)
const TIME_SLOT_WEIGHTS: Record<TimeSlot, number[]> = {
  // 오전: 짧은 경로 선호 (Case 5, 7, 9, 12)
  morning: [1, 1, 1, 1, 3, 1, 3, 1, 3, 1, 1, 3, 1, 1, 1],
  // 오후: 긴 경로 선호 (Case 1, 3, 6, 8, 10)
  afternoon: [3, 1, 3, 1, 1, 3, 1, 3, 1, 3, 1, 1, 1, 1, 1],
  // 저녁: 중간 길이 선호 (Case 2, 4, 11, 13, 15)
  evening: [1, 3, 1, 3, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 3],
};

// ============================================================
// 상수 정의 (하위 호환성)
// ============================================================

export const ENTRY_POINT: [number, number, number] = [-2, 0.5, 5];
export const CHECKOUT_POINT: [number, number, number] = [-3, 0.5, -4];

export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax: 7.0,
  zMin: -7.4,
  zMax: 5.3,
};

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

export function getTimeSlotFromRange(timeRange: string): TimeSlot {
  const hour = parseInt(timeRange.slice(0, 2), 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * (x, z) 평면 좌표를 3D 좌표로 변환
 */
function toWorld(point: [number, number]): [number, number, number] {
  return [point[0], 0.5, point[1]];
}

/**
 * 가중치 배열을 기반으로 랜덤 인덱스 선택
 */
function weightedRandomIndex(weights: number[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  
  return weights.length - 1;
}

// ============================================================
// 메인 경로 생성 함수
// ============================================================

/**
 * 시간대에 따라 15개 케이스 중 랜덤 선택하여 경로 반환
 */
export function generateRandomCustomerPath(timeRange: string): [number, number, number][] {
  const slot = getTimeSlotFromRange(timeRange);
  const weights = TIME_SLOT_WEIGHTS[slot];
  
  // 가중치 기반 랜덤 케이스 선택
  const caseIndex = weightedRandomIndex(weights);
  const selectedCase = PATH_CASES[caseIndex];
  
  // 2D 좌표를 3D 좌표로 변환
  return selectedCase.map(toWorld);
}

/**
 * 특정 케이스 번호로 경로 생성 (1-15)
 */
export function getPathByCase(caseNumber: number): [number, number, number][] {
  const index = Math.max(0, Math.min(14, caseNumber - 1));
  return PATH_CASES[index].map(toWorld);
}

/**
 * 경로가 계산대(-z 영역)에 도달하는지 확인
 */
export function pathReachesCheckout(path: [number, number, number][]): boolean {
  return path.some(p => p[2] <= -3);
}

// ============================================================
// 하위 호환성 함수들
// ============================================================

export const cellKey = (cx: number, cz: number): string => `${cx}:${cz}`;

export const BLOCKED_CELLS = new Set<string>(
  FIXED_OBSTACLES.map(o => cellKey(Math.round(o.x), Math.round(o.z)))
);

export function isNearFixture(cell: Cell): boolean {
  return [
    { cx: cell.cx + 1, cz: cell.cz },
    { cx: cell.cx - 1, cz: cell.cz },
    { cx: cell.cx, cz: cell.cz + 1 },
    { cx: cell.cx, cz: cell.cz - 1 },
  ].some((n) => BLOCKED_CELLS.has(cellKey(n.cx, n.cz)));
}

/** @deprecated Use generateRandomCustomerPath */
export function generateRandomPath(timeRange?: string): [number, number, number][] {
  return generateRandomCustomerPath(timeRange ?? "12:00-13:00");
}
