# Grid + Backtracking 기반 Footfall Pathfinding 최종 가이드 (좌표 체계 + 행동 특성 포함)

> **목표**
> - 오프라인 매장에서 **사람이 실제로 걷는 행동 패턴**을 최대한 비슷하게 구현한다.
> - 블렌더에서 정의한 **피해야 하는 좌표(반경 0.5)** 를 기반으로 격자(Grid)를 만들고,
> - 현재 셀에서 **인접 셀(상/하/좌/우)** 로만 이동하며,
> - 더 이상 나아갈 수 없으면 **되돌아가 우회(백트래킹)** 하는 방식으로 경로를 생성한다.
> - 같은 시간대에 생성되는 여러 path는 **서로 다른 경로**를 가져야 하며,
>   시간대에 따라 **경로 생성 규칙(파라미터)** 도 랜덤하게 바뀌어야 한다.
> - BLOCKED_CELLS는 실제 **행거 / 디스플레이 선반 / 테이블**이 있는 영역으로,  
>   path는 이 위에 절대 올라가지 않지만, **주변을 따라 걷는 경향**을 가져야 한다.

경로 타입은 두 가지가 있다.

1. **입구 → 매장 순회 → 계산대 도착 경로**
2. **입구 → 매장 순회 → 다시 입구로 나가는 경로**

---

## 0. 좌표 체계 관계 정리 (Blender → CSV → 3D Viewer / Path)

### 0-1. CSV → Store3DViewer (furnitureLayout → GLB 배치)

`Store3DViewer.tsx` 안에서 가구 레이아웃은 CSV(`Furniture Product Layout Y Flipped`)를 읽어  
`furnitureLayout` 형태로 들어가고, GLB는 다음과 같이 배치된다:

```ts
const furnitureLayout = [
  { file: 'Shelf_벽면진열대1_1.7x2.5x0.5.glb', x: -7.1, y: 3.2, z: 0.0, rotationY: 90 },
  // ...
];

<primitive
  object={clonedScene}
  scale={1}
  position={[x, z, y]}        // ⚠️ 주의: [x, z, y] 순서
  rotation={[0, (rotationY * Math.PI) / 180, 0]}
/>
```

따라서 CSV 한 줄 `(x_csv, y_csv, z_csv)` 가 있을 때,
three.js 월드 좌표(= GLB 배치 위치)는:

- `Vx = x_csv`
- `Vy = z_csv`  (viewer에서 up 축, 높이)
- `Vz = y_csv`

즉, **CSV의 z 값이 3D 뷰어에서 “높이” 축**으로 쓰이고,  
CSV의 y 값이 3D 뷰어에서 “깊이(앞/뒤, z축)”로 쓰인다.

### 0-2. Blender → CSV 변환 (Furniture Product Layout Y Flipped)

Blender에서 오브젝트 A의 좌표를 `(Bx, By, Bz)` 라고 할 때,  
CSV(`Furniture Product Layout Y Flipped`)에는 다음과 같이 쓴다:

- `Cx = Bx`
- `Cy = -By`   (Blender Y 축이 아래로 뒤집혀 들어감)
- `Cz = Bz`

여기서 `(Cx, Cy, Cz)` 가 곧 CSV의 `(x_csv, y_csv, z_csv)` 이다.

### 0-3. CSV → Path 좌표 (고객 이동 경로)

고객 path는 `Store3DViewer`에서 다음과 같은 포맷을 쓴다:

```ts
// 예시 path
const points: [number, number, number][] = [
  [1.8, 0.5, 5.6], // [x, y(높이), z(깊이)]
  // ...
];
```

이미 GLB 배치에서 `position={[x, z, y]}` 를 사용하고 있으므로,
CSV → Path 좌표 변환도 동일한 패턴으로 맞춘다:

CSV: `(Cx, Cy, Cz)`  
Path: `(Px, Py, Pz)` 이라고 하면,

- `Px = Cx`
- `Py = Cz`   (height = CSV z)
- `Pz = Cy`

즉, 요약하면:

> **CSV(x, y, z)** → **3D Viewer / Path (x, height, depth) = (x, z, y)**

### 0-4. 이 가이드에서 사용하는 좌표들의 해석 기준

- 이 문서에서 나오는 모든 **path 포인트**는 `[x, y, z] = [x, 높이, z]` 형식이다.
- 이 문서에서 나오는 모든 **장애물/셀 좌표**는 `(x, z)` 평면 좌표로 이해하면 된다.
  - 예: `(-2, 5)` 라고 쓰면, path 포인트 `[ -2, 0.5, 5 ]` 의 바닥 투영점이다.
- 향후 Blender에서 직접 좌표를 딴 뒤 path/장애물에 추가하고 싶다면,
  1. Blender `(Bx, By, Bz)` → CSV `(Cx, Cy, Cz) = (Bx, -By, Bz)`  
  2. CSV `(Cx, Cy, Cz)` → Path `[Px, Py, Pz] = [Cx, Cz, Cy]`  
  를 거쳐서 이 문서의 좌표계와 맞추면 된다.

이제부터 이어지는 섹션들(입구/계산대 좌표, blocked 셀, grid, backtracking 등)은  
**위 변환 규칙을 전제로 한, 3D Viewer / Path 좌표계 기준 설명**이다.

---

## 1. 입구 / 계산대 좌표 정의

### 1-1. 입구(ENTRY_POINT)

- 입구는 블렌더 평면 좌표 기준 **(-2, 5)** 지점이다.
- 3D world 좌표로는 y를 0.5로 두어 다음과 같이 정의한다.

```ts
export const ENTRY_POINT: [number, number, number] = [-2, 0.5, 5];
```

- 평면(x, z) 기준으로 보면:
  - **입구(ENTRY_POINT)** = (-2, 5)

### 1-2. 계산대 영역(CHECKOUT 영역)

계산대가 포함된 셀 좌표는 다음과 같다 (블렌더 평면 좌표 = (x, z)):

- (-4, -5)
- (-4, -4)
- (-3, -5)
- (-3, -4)
- (-2, -5)
- (-2, -4)
- (-1, -5)
- (-1, -4)

이 셀들은 **계산대 영역(Goal Region)** 또는  
다시 이동 가능하게 풀어준 셀로, **막힌 셀(blocked)이 아니라 도달 가능한 영역**이다.

대표점(중심값) 하나를 골라 CHECKOUT 상수로 사용할 수 있다. 예를 들어:

```ts
export const CHECKOUT_POINT: [number, number, number] = [-3, 0.5, -4];
```

> Grid 기반 경로에서는 위 여섯 셀 전체를 “도착 가능 영역”으로 보고,  
> 그 중 아무 셀에 도달해도 계산대에 도착한 것으로 처리할 수 있다.

---

## 2. 공간 바닥 경계(STORE_BOUNDS)

경로는 아래 네 꼭짓점으로 정의되는 바닥 영역 안에서만 움직여야 한다.

```ts
export const STORE_BOUNDS = {
  xMin: -6.5,
  xMax:  7.0,
  zMin: -7.4,
  zMax:  5.3,
};
```

**모든 경로 포인트 (x, z)에 대해:**

```ts
xMin <= x && x <= xMax;
zMin <= z && z <= zMax;
```

을 만족해야 한다.

- 랜덤 포인트 샘플링, detour 포인트 선택, grid 셀 이동 모두 이 범위를 벗어나면 안 된다.
- 필요할 경우, 경로 생성 후 최종적으로 `Math.min/Math.max` 를 이용해 bounds 안으로 클램프해도 된다.

---

## 3. 피해야 하는 좌표 → blocked 셀 정의

블렌더에서 추출한 “피해야 하는 좌표” 리스트에서,
- **계산대 영역 셀 6개**:
  - (-4,-4), (-4,-5), (-3,-4), (-3,-5), (-2,-4), (-2,-5)
- **다시 움직일 수 있는 영역으로 변경할 셀 2개**:
  - (-1,-4), (-1,-5)

은 **walkable(이동 가능)** 영역으로 취급하고,  
나머지 셀은 모두 **막힌 셀(blocked)** 으로 취급한다.

### 3-1. 계산대/해제된 셀 목록 (walkable special)

아래 셀들은 **계산대 영역** 혹은 **다시 이동 가능하게 해둔 영역**이다.

- (-4, -5)
- (-4, -4)
- (-3, -5)
- (-3, -4)
- (-2, -5)
- (-2, -4)
- (-1, -5)
- (-1, -4)

### 3-2. 최종 blocked 셀 목록

아래 좌표들은 **path가 절대 위치하면 안 되는 셀**이다.  
각 좌표 (x, z)는 셀 중심이며, 반경 0.5의 사각형(1x1 셀 전체)이 통행 불가 영역이다.

- (-6, 5)
- (-5, -1)
- (-5, 0)
- (-5, 1)
- (-5, 2)
- (-5, 3)
- (-5, 5)
- (-4, -1)
- (-4, 5)
- (-3, -1)
- (-3, 5)
- (-2, -1)
- (-2, 0)
- (-2, 1)
- (-2, 2)
- (-2, 3)
- (-1, 5)
- (0, -6)
- (0, -5)
- (0, -4)
- (0, -3)
- (0, -2)
- (0, 5)
- (1, -5)
- (1, -4)
- (1, -3)
- (1, -2)
- (1, 1)
- (1, 2)
- (1, 5)
- (2, -5)
- (2, -4)
- (2, 1)
- (2, 2)
- (2, 5)
- (3, -6)
- (3, -5)
- (3, -4)
- (3, -3)
- (3, 1)
- (3, 2)
- (3, 5)
- (4, -6)
- (4, -5)
- (4, -4)
- (4, -3)
- (4, 1)
- (4, 2)
- (4, 5)
- (5, -5)
- (5, -4)
- (5, 1)
- (5, 2)

### 3-3. 코드에서의 정의

```ts
const cellKey = (cx: number, cz: number) => `${cx}:${cz}`;

// 피해야 하는 셀들을 원형 장애물처럼 유지하고 싶다면 (디버그/시각화용)
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
  { x: 5, z: 2, radius: 0.5 }
];

// 실제 통행 불가 여부 판단은 BLOCKED_CELLS로 한다.
export const BLOCKED_CELLS = new Set<string>(
  FIXED_OBSTACLES.map(o => cellKey(Math.round(o.x), Math.round(o.z)))
);
```

> BLOCKED_CELLS (계산대 영역 제외)는 모두 **행거 / 디스플레이 선반 / 테이블**이 있는 위치이다.

---

## 4. 셀 / 월드 좌표 변환 및 유틸 함수

```ts
export type Cell = { cx: number; cz: number };

export const cellKey = (cx: number, cz: number) => `${cx}:${cz}`;

export function cellToWorld(cell: Cell, y: number = 0.5): [number, number, number] {
  // 셀 중앙을 world 좌표로 사용 (y는 고정 높이)
  return [cell.cx, y, cell.cz];
}

export function worldToCell(x: number, z: number): Cell {
  // world 좌표를 가장 가까운 셀로 반올림
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
```

---

## 5. 인접 셀(상하좌우) 후보 생성 + 최근 방문 회피

```ts
const DIRS: Cell[] = [
  { cx:  1, cz:  0 },
  { cx: -1, cz:  0 },
  { cx:  0, cz:  1 },
  { cx:  0, cz: -1 },
];

const RECENT_MEMORY = 5; // 최근 5 셀 안에서는 다시 안 가려고 시도

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

    if (!isCellInsideBounds(next)) continue;    // STORE_BOUNDS 밖이면 제외
    if (isBlockedCell(next)) continue;          // 피해야 하는 셀은 제외

    const key = cellKey(next.cx, next.cz);
    const count = visitedCount.get(key) ?? 0;
    if (count >= maxVisitPerCell) continue;     // 같은 셀에 너무 많이 들르지 않도록 제한

    result.push(next);
  }

  return result;
}
```

- **사람처럼 걷기**를 위한 핵심 규칙들:
  - 상/하/좌/우 인접 셀 중에서만 이동한다.
  - BLOCKED_CELLS(행거/선반/테이블)는 아예 제외한다.
  - 셀별 방문 횟수를 제한해서 같은 셀을 계속 도는 패턴을 줄인다.
  - 최근 방문한 셀은 한동안 다시 안 가려고 한다.

---

## 6. 시간대별 파라미터 조합 (TimeSlotConfig)

시간대(timeRange)에 따라 경로 생성의 느낌을 바꾸기 위해,  
**시간대별 설정(TimeSlotConfig)** 을 둔다.

```ts
export type TimeSlot = "morning" | "afternoon" | "evening";

export type TimeSlotConfig = {
  maxStepsBase: number;          // 기본 최대 스텝
  maxStepsJitter: number;        // 최대 스텝 랜덤 편차
  minStepsBeforeGoal: number;    // 목표(입구/계산대)로 돌아가기 전 최소 스텝
  maxVisitPerCell: number;       // 셀별 최대 방문 횟수
  checkoutPathRatio: number;     // 계산대로 가는 path 비율
  entryReturnPathRatio: number;  // 입구로 나가는 path 비율
};

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
```

> 실제 구현에서는 timeRange(예: "13:00-14:00")를 받아서  
> 이를 `TimeSlot`으로 매핑하거나,  
> timeRange 해시값을 랜덤 seed처럼 사용해도 된다.

---

## 7. 가구/디스플레이 주변 선호도 (행동 특성 반영)

### 7-1. BLOCKED_CELLS 주변(행거/선반/테이블 주변)을 따라 걷는 경향

```ts
// 어떤 셀이 "가구/디스플레이 주변"인지 판단
export function isNearFixture(cell: Cell): boolean {
  // 네 방향 중 하나라도 BLOCKED_CELLS인 경우
  return [
    { cx: cell.cx + 1, cz: cell.cz },
    { cx: cell.cx - 1, cz: cell.cz },
    { cx: cell.cx,     cz: cell.cz + 1 },
    { cx: cell.cx,     cz: cell.cz - 1 },
  ].some((n) => isBlockedCell(n));
}
```

- BLOCKED_CELLS는 실제 **행거 / 선반 / 테이블**이 있는 자리이다.
- path는 이 셀은 피하지만,  
  **인접 셀은 선호해서 “가구 옆으로 스윽 지나가는”** 동선이 된다.

`dwellTime`을 계산할 때도 이 정보를 활용할 수 있다.

```ts
const baseDwell = Math.random() * 3 + 1;
const nearFixtureBonus = isNearFixture(cell) ? Math.random() * 2 : 0;
const dwellTime = baseDwell + nearFixtureBonus;
```

> 가구 근처 셀 위에 있을 때 더 오래 머무르게 하면,  
> **제품 구경 / 진열대 앞에서 서 있는** 느낌을 줄 수 있다.

### 7-2. STORE_BOUNDS 밖의 벽 디스플레이 선반들 (간접 attractor)

아래 좌표들은 **STORE_BOUNDS 바깥**이라 path가 직접 갈 수는 없지만,  
벽면 디스플레이 선반 / 진열대가 놓여 있는 위치이다.

- (7, 4)
- (7, 3)
- (7, 2)
- (7, 1)
- (7, 0)
- (7, -1)
- (7, -2)
- (7, -3)
- (7, -4)
- (7, -5)
- (7, -6)
- (8, 0)
- (8, 1)
- (8, 2)
- (8, 3)
- (8, 4)
- (8, 5)
- (-7.5, -2)
- (-7.5, -1)
- (-7.5, 0)
- (-7.5, 1)
- (-7.5, 2)
- (-7.5, 3)
- (-7.5, 4)

이 좌표들은 다음과 같이 **행동 특성에 간접적으로 반영**할 수 있다.

```ts
// 디스플레이 벽 포인트 (STORE_BOUNDS 밖)
const DISPLAY_WALL_POINTS: { x: number; z: number }[] = [
  { x: 7,   z: 4 },
  { x: 7,   z: 3 },
  // ... (위 목록 전체)
  { x: -7.5, z: 4 },
];

// 매장 내부에서 "벽 디스플레이와 평행한 라인"을 선호하도록 bias 추가
export function wallAffinityScore(cell: Cell): number {
  // 오른쪽 벽 (x≈7~8) 과 왼쪽 벽 (x≈-7.5) 기준으로 간단 예시
  const rightWallDist = Math.abs(cell.cx - 6);   // 내부 xMax 근처
  const leftWallDist  = Math.abs(cell.cx + 6);   // 내부 xMin 근처

  // 벽에 어느 정도 가까우면 작은 음수 점수로 선호도 부여
  const rightBonus = rightWallDist <= 2 ? -0.5 : 0;
  const leftBonus  = leftWallDist  <= 2 ? -0.5 : 0;

  return rightBonus + leftBonus;
}
```

> 이렇게 하면, path가 **벽 디스플레이 라인을 따라 걷는 느낌**이 약하게 섞이고,  
> 중앙/한쪽으로만 치우친 비현실적인 동선을 줄일 수 있다.

---

## 8. 백트래킹 기반 경로 생성 로직 (최종 버전)

### 8-1. 옵션 타입 정의

```ts
export type GridPathOptions = {
  startWorld: [number, number, number];
  targetWorlds: Array<[number, number, number]>; // 여러 목표(계산대 영역 셀들 또는 입구)
  slotConfig: TimeSlotConfig;
};
```

### 8-2. 핵심 로직

```ts
export function generatePathWithBacktracking(options: GridPathOptions): [number, number, number][] {
  const {
    startWorld,
    targetWorlds,
    slotConfig,
  } = options;

  const { maxStepsBase, maxStepsJitter, minStepsBeforeGoal, maxVisitPerCell } = slotConfig;

  // 시간대별로 maxSteps를 살짝 랜덤하게 흔들어줌
  const jitter = Math.floor((Math.random() * 2 - 1) * maxStepsJitter); // -jitter ~ +jitter
  const maxSteps = Math.max(50, maxStepsBase + jitter);

  const startCell = worldToCell(startWorld[0], startWorld[2]);
  const targetCells = targetWorlds.map(t => worldToCell(t[0], t[2]));

  // path를 스택처럼 사용 (배열 끝이 현재 위치)
  const pathCells: Cell[] = [startCell];

  // 셀별 방문 횟수
  const visitedCount = new Map<string, number>();
  visitedCount.set(cellKey(startCell.cx, startCell.cz), 1);

  const dist2 = (a: Cell, b: Cell) =>
    (a.cx - b.cx) * (a.cx - b.cx) + (a.cz - b.cz) * (a.cz - b.cz);

  const goalRadius2 = 1.0 * 1.0; // 목표 셀과의 거리 허용치(셀 단위)

  let steps = 0;

  while (pathCells.length > 0 && steps < maxSteps) {
    steps++;

    const current = pathCells[pathCells.length - 1];

    // 1) 최소 스텝 이상 진행한 경우에만 goal 도달 체크
    const canCheckGoal = steps >= minStepsBeforeGoal;

    const reachedGoal =
      canCheckGoal &&
      targetCells.some(target => dist2(current, target) <= goalRadius2);

    if (reachedGoal) break;

    // 2) 현재에서 갈 수 있는 인접 셀 리스트
    let neighbors = getNeighborCells(current, visitedCount, maxVisitPerCell);

    // 직전 셀은 우선 제외해서 "바로 되돌아가기"를 피함
    const prevCell =
      pathCells.length >= 2 ? pathCells[pathCells.length - 2] : null;

    if (prevCell) {
      neighbors = neighbors.filter(
        (n) => !(n.cx === prevCell.cx && n.cz === prevCell.cz)
      );
    }

    if (neighbors.length === 0) {
      // 🔴 인접 셀로 더 나아갈 수 없는 경우 → 백트래킹
      //    "피해야 하는 좌표에 의해 인접 좌표로 더 못 나아간다면
      //     왔던 좌표를 되돌아간다" 요구사항을 그대로 구현한 부분
      pathCells.pop(); // 한 칸 뒤로 돌아감
      continue;
    }

    // 3) 최근 방문 셀은 가능한 피함
    const recentHistory = pathCells;
    let candidates = neighbors.filter(
      (n) => !isRecentlyVisited(n, recentHistory)
    );
    if (candidates.length === 0) {
      candidates = neighbors; // 전부 최근 방문이면 그냥 neighbors 사용
    }

    // 4) 랜덤성 + 목표 방향 + 가구 주변 + 벽 선호도
    candidates.sort(() => Math.random() - 0.5);

    candidates.sort((a, b) => {
      const da = Math.min(...targetCells.map(t => dist2(a, t)));
      const db = Math.min(...targetCells.map(t => dist2(b, t)));

      const aNearFixture = isNearFixture(a) ? -1 : 0;
      const bNearFixture = isNearFixture(b) ? -1 : 0;

      const aWall = wallAffinityScore(a);
      const bWall = wallAffinityScore(b);

      return (da + aNearFixture + aWall) - (db + bNearFixture + bWall);
    });

    const next = candidates[0];
    pathCells.push(next);

    const key = cellKey(next.cx, next.cz);
    visitedCount.set(key, (visitedCount.get(key) ?? 0) + 1);
  }

  // 셀 경로를 world 경로로 변환
  let result: [number, number, number][] = pathCells.map(cell =>
    cellToWorld(cell, startWorld[1] ?? 0.5)
  );

  // 최소 2개 점 보장 (Line 컴포넌트 안전성)
  if (result.length === 1) {
    result = [result[0], result[0]];
  } else if (result.length === 0) {
    const fallbackTarget = targetWorlds[0] ?? startWorld;
    result = [startWorld, fallbackTarget];
  }

  return result;
}
```

이 로직은 다음 요구사항을 모두 만족한다.

- 인접 셀(상하좌우)만 사용해서 이동
- BLOCKED_CELLS는 절대 밟지 않음
- 인접 셀끼리 왔다갔다 반복(핑퐁)하는 패턴 최소화
- 충분히 둘러보기 전에는 입구/계산대로 바로 돌아가지 않음 (`minStepsBeforeGoal`)
- 가구/선반/테이블 주변 셀과 벽 디스플레이 라인을 약하게 선호
- 시간대(timeSlot)에 따라 path 길이 / 행동 특성이 달라짐

---

## 9. 두 종류의 경로 생성 함수

### 9-1. 계산대 도착 경로 (입구 → 매장 순회 → 계산대)

```ts
// 계산대 영역의 셀들을 world 좌표로 변환
const CHECKOUT_CELLS: [number, number, number][] = [
  [-4, 0.5, -4],
  [-4, 0.5, -5],
  [-3, 0.5, -4],
  [-3, 0.5, -5],
  [-2, 0.5, -4],
  [-2, 0.5, -5],
];

export function generatePathToCheckout(slot: TimeSlot): [number, number, number][] {
  const startWorld: [number, number, number] = ENTRY_POINT;
  const config = getTimeSlotConfig(slot);

  return generatePathWithBacktracking({
    startWorld,
    targetWorlds: CHECKOUT_CELLS,
    slotConfig: config,
  });
}
```

### 9-2. 입구로 다시 나가는 경로 (입구 → 매장 순회 → 입구)

```ts
const ENTRY_GOAL_CELLS: [number, number, number][] = [
  ENTRY_POINT,
  [ENTRY_POINT[0] - 1, ENTRY_POINT[1], ENTRY_POINT[2]],
  [ENTRY_POINT[0] + 1, ENTRY_POINT[1], ENTRY_POINT[2]],
];

export function generatePathBackToEntry(slot: TimeSlot): [number, number, number][] {
  const startWorld: [number, number, number] = ENTRY_POINT;
  const config = getTimeSlotConfig(slot);

  return generatePathWithBacktracking({
    startWorld,
    targetWorlds: ENTRY_GOAL_CELLS,
    slotConfig: config,
  });
}
```

- 두 함수 모두 **같은 규칙(인접 셀 + 백트래킹 + 사람처럼 걷기)** 를 공유하고,
- 목표만 계산대 쪽 / 입구 쪽으로 달라진다.

---

## 10. 시간대 / timeRange에 따른 다양한 path 생성

`Store3DViewer.tsx` 또는 `FootfallVisualizer3D.tsx`에서  
timeRange(예: `"09:00-10:00"`)를 기반으로 TimeSlot을 결정하고,  
여러 path를 생성할 때마다 랜덤하게 계산대/입구 path를 섞어준다.

```ts
function getTimeSlotFromRange(timeRange: string): TimeSlot {
  // 예시 구현: start hour 기준으로 슬랏 나누기
  const hour = parseInt(timeRange.slice(0, 2), 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function generateRandomCustomerPath(timeRange: string): [number, number, number][] {
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
```

여러 path를 만들 때:

```ts
const defaultPaths = useMemo(() => {
  const paths: CustomerPath[] = [];
  for (let i = 0; i < 20; i++) {
    const points = generateRandomCustomerPath(timeRange); // timeRange: "13:00-14:00" 등
    paths.push({
      id: `grid-customer-${i}`,
      points,
      isReturning: points.some(p => p[2] < 0), // 예시: z<0이면 계산대 쪽
      dwellTime: Math.random() * 5 + 1,
    });
  }
  return paths;
}, [timeRange]);
```

이렇게 하면:

- **같은 timeRange 안에서도**  
  - 각 path마다
    - 이웃 셀 선택 순서,
    - maxSteps(조금씩 다름),
    - minStepsBeforeGoal,
    - 목표 셀 순서,  
    - 가구/벽 선호도 적용 결과  
    등이 랜덤하게 섞이면서
  - **서로 다른 경로**를 가지게 된다.
- **timeRange가 바뀌면** `TimeSlotConfig` 자체가 달라지기 때문에,  
  - 오전/오후/저녁마다
    - 평균 path 길이,
    - 계산대 vs 퇴장 path 비율,
    - 셀 재방문 정도 등도 자연스럽게 달라진다.

---

## 11. 최종 체크 리스트

- [ ] `ENTRY_POINT`가 (-2, 5) 위치로 잘 잡혀 있는지 확인
- [ ] 계산대 영역 셀 6개가 **BLOCKED_CELLS에 포함되지 않고**, goal 영역으로 사용되는지 확인
- [ ] (-1,-4), (-1,-5) 셀은 BLOCKED_CELLS에서 제거되어, 실제로 경로가 지나갈 수 있는지 확인
- [ ] `BLOCKED_CELLS`가 본 문서 3-2 섹션의 목록과 정확히 일치하는지 확인
- [ ] `generatePathWithBacktracking`이 인접 셀 기반 + 백트래킹 + “사람처럼 걷기” 규칙(직전 셀 회피, 최근 히스토리 회피, 최소 스텝, 가구/벽 선호도)을 모두 적용하는지 확인
- [ ] `generatePathToCheckout`, `generatePathBackToEntry` 두 종류의 경로 생성 함수가 잘 연결되어 있는지 확인
- [ ] 같은 timeRange 내에서 여러 path를 생성했을 때, 경로가 눈에 띄게 다양하게 생성되는지 확인
- [ ] 오전/오후/저녁(timeSlot)에 따라 path 길이와 패턴이 다르게 보이는지 확인
- [ ] 3D 뷰어에서 sphere + line이 피해야 하는 사각형 영역을 절대 관통하지 않는지 육안 검증
- [ ] BLOCKED_CELLS 주변 / 벽 디스플레이 라인을 따라 걷는 동작이 어느 정도 보이는지 확인

---

이 가이드를 그대로 구현하면,

> - 입구(-2,5)에서 들어와,
> - 피해야 하는 셀(반경 0.5 사각형)을 절대 밟지 않고,
> - 인접 셀로만 사람처럼 랜덤하게 움직이며,
> - 일부는 계산대로, 일부는 다시 입구로 나가고,
> - 시간대가 바뀌면 전체 동선 패턴도 자연스럽게 달라지고,
> - 행거/테이블/벽 디스플레이 주변을 따라 걷는

현실적인 오프라인 매장 footfall path를 만들 수 있습니다.
