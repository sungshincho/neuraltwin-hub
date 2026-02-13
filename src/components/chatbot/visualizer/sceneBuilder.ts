/**
 * NEURALTWIN Store Visualizer - Three.js Scene Builder
 *
 * Pure Three.js 씬 빌더 (React 독립)
 * wireframe-3d-viz.jsx 레퍼런스 기반
 */

import * as THREE from 'three';
import {
  STORE,
  CAMERA_PRESETS,
  FURNITURE_DATA,
  FLOW_CURVE_POINTS,
  COLORS,
  type ZoneConfig,
  type FurnitureConfig,
  type CameraPreset
} from './storeData';
import type { StoreParams, ZoneScale, DynamicZone } from './vizDirectiveTypes';

// ═══════════════════════════════════════════
//  파라메트릭 씬 설정 (PHASE H)
// ═══════════════════════════════════════════

/**
 * 씬 빌드에 필요한 모든 설정
 * storeParams/zoneScale이 전달되면 기본값 대신 사용
 */
export interface SceneConfig {
  // 매장 기본 치수
  storeWidth: number;
  storeDepth: number;
  storeHeight: number;

  // 존 설정 (스케일 적용 후)
  zones: Record<string, ZoneConfig>;

  // 가구 설정
  furniture: FurnitureConfig[];

  // 동선 포인트
  flowCurvePoints: [number, number, number][];

  // 카메라 프리셋
  cameraPresets: Record<string, CameraPreset>;

  // 시각 파라미터
  gridSize: number;
  gridDivisions: number;
  particleCount: number;
  particleBounds: number;
  fogDensity: number;
}

/**
 * 기본 씬 설정 생성 (STORE 데이터 기반)
 */
export function createDefaultSceneConfig(): SceneConfig {
  return {
    storeWidth: STORE.width,
    storeDepth: STORE.depth,
    storeHeight: STORE.height,
    zones: STORE.zones,
    furniture: FURNITURE_DATA,
    flowCurvePoints: FLOW_CURVE_POINTS,
    cameraPresets: CAMERA_PRESETS,
    gridSize: 30,
    gridDivisions: 30,
    particleCount: 200,
    particleBounds: 40,
    fogDensity: 0.012
  };
}

/**
 * CSS hex 문자열 → Three.js 숫자 색상 변환
 */
function cssHexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16) || 0x64748b;
}

/**
 * DynamicZone[] → Record<string, ZoneConfig> 변환
 */
function dynamicZonesToRecord(zones: DynamicZone[]): Record<string, ZoneConfig> {
  const record: Record<string, ZoneConfig> = {};
  for (const zone of zones) {
    record[zone.id] = {
      x: zone.x,
      z: zone.z,
      w: Math.max(2, Math.min(15, zone.w)),
      d: Math.max(2, Math.min(15, zone.d)),
      color: cssHexToNumber(zone.color),
      label: zone.label
    };
  }
  return record;
}

/**
 * DynamicZone[] → 동적 동선 포인트 생성
 * flowOrder가 string[]이면 해당 순서로 존 연결 (비선형 동선)
 * 아니면 z가 큰 것부터 작은 것 순으로 연결 (기본 선형 동선)
 */
function generateFlowFromZones(
  zones: DynamicZone[],
  flowOrder?: string[]
): [number, number, number][] {
  if (zones.length < 2) {
    return [[0, 0.3, 9], [0, 0.3, -5]];
  }

  const zoneMap = new Map(zones.map(z => [z.id, z]));

  // 비선형 동선: AI가 지정한 존 ID 순서로 연결
  if (flowOrder && flowOrder.length >= 2) {
    const points: [number, number, number][] = [];
    for (const id of flowOrder) {
      const zone = zoneMap.get(id);
      if (zone) {
        points.push([zone.x, 0.3, zone.z]);
      }
    }
    if (points.length >= 2) return points;
    // 매칭 실패 시 아래 기본 로직으로 폴백
  }

  // 기본 선형 동선: z가 큰 순서 (입구)부터 작은 순서 (안쪽)
  const sorted = [...zones].sort((a, b) => b.z - a.z);

  const points: [number, number, number][] = [];
  // 입구 시작점
  points.push([0, 0.3, 10]);

  for (const zone of sorted) {
    points.push([zone.x, 0.3, zone.z]);
  }

  return points;
}

/**
 * 존 라벨로부터 업종별 집기 타입 추론
 */
type FixtureType = 'rack' | 'shelf' | 'table' | 'counter' | 'mannequin' | 'display_case' | 'refrigerator' | 'gondola' | 'seating_set' | 'kiosk' | 'showcase';

function inferFixtureType(label: string, zoneType?: string): FixtureType {
  const lc = label.toLowerCase();
  // 존 타입 기반 추론 (우선순위 높음)
  if (zoneType === 'checkout') return 'counter';
  if (zoneType === 'seating') return 'seating_set';
  // 라벨 기반 추론
  if (/행거|의류|패션|옷|rack/.test(lc)) return 'rack';
  if (/냉장|음료|refrigerat/.test(lc)) return 'refrigerator';
  if (/곤돌라|대형|마트|gondola/.test(lc)) return 'gondola';
  if (/좌석|seating|카페|소파|의자/.test(lc)) return 'seating_set';
  if (/키오스크|kiosk|주문/.test(lc)) return 'kiosk';
  if (/쇼케이스|showcase|전시|갤러리/.test(lc)) return 'showcase';
  if (/선반|진열|식료|grocery|shelf/.test(lc)) return 'shelf';
  if (/테이블|시식|tasting|table/.test(lc)) return 'table';
  if (/카운터|계산|checkout|counter|바|bar/.test(lc)) return 'counter';
  if (/마네킹|mannequin|피팅|fitting/.test(lc)) return 'mannequin';
  return 'display_case';
}

/**
 * 집기 타입별 크기 프리셋
 */
function getFixtureDimensions(type: string, rand: () => number): { w: number; h: number; d: number } {
  switch (type) {
    case 'rack':         return { w: 2.0 + rand() * 1.0, h: 1.8 + rand() * 0.4, d: 0.5 + rand() * 0.3 };
    case 'shelf':        return { w: 1.5 + rand() * 1.0, h: 1.5 + rand() * 0.8, d: 0.6 + rand() * 0.4 };
    case 'table':        return { w: 1.8 + rand() * 1.2, h: 0.7 + rand() * 0.2, d: 1.0 + rand() * 0.8 };
    case 'counter':      return { w: 2.5 + rand() * 1.5, h: 0.9 + rand() * 0.2, d: 0.6 + rand() * 0.3 };
    case 'mannequin':    return { w: 0.4 + rand() * 0.2, h: 1.6 + rand() * 0.3, d: 0.3 + rand() * 0.15 };
    case 'refrigerator': return { w: 1.8 + rand() * 0.8, h: 2.0 + rand() * 0.3, d: 0.7 + rand() * 0.3 };
    case 'gondola':      return { w: 3.0 + rand() * 2.0, h: 1.6 + rand() * 0.4, d: 0.8 + rand() * 0.4 };
    case 'seating_set':  return { w: 1.2 + rand() * 0.8, h: 0.8 + rand() * 0.2, d: 1.2 + rand() * 0.8 };
    case 'kiosk':        return { w: 0.6 + rand() * 0.3, h: 1.4 + rand() * 0.3, d: 0.5 + rand() * 0.2 };
    case 'showcase':     return { w: 1.5 + rand() * 1.0, h: 1.0 + rand() * 0.5, d: 0.6 + rand() * 0.4 };
    case 'display_case':
    default:             return { w: 1.2 + rand() * 1.0, h: 1.2 + rand() * 0.6, d: 0.8 + rand() * 0.6 };
  }
}

/**
 * 동적 존 내부에 자동 와이어프레임 집기(fixture) 생성
 * 각 존에 2~4개의 박스를 배치하여 시각적 밀도 확보
 */
function generateFurnitureForZones(zones: DynamicZone[]): FurnitureConfig[] {
  const furniture: FurnitureConfig[] = [];

  // 시드 기반 의사 난수 (같은 존에 항상 같은 배치)
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (const zone of zones) {
    // entrance/corridor 타입은 비어있어야 하므로 가구 생성 스킵
    const zoneType = (zone as { type?: string }).type;
    if (zoneType === 'entrance' || zoneType === 'corridor') continue;

    // 라벨 기반 추가 스킵 판단 (type 미설정 시 라벨로 추론)
    const labelLc = zone.label.toLowerCase();
    if (!zoneType && /입구|감압|통로|복도|entrance|corridor|decompression/.test(labelLc)) continue;

    const zw = Math.max(2, Math.min(15, zone.w));
    const zd = Math.max(2, Math.min(15, zone.d));
    const seed = zone.id.length * 7 + zone.x * 13 + zone.z * 17;

    // 존 크기에 따라 집기 개수 결정
    const area = zw * zd;
    // seating/experience는 가구 밀도 낮게, display는 높게
    const densityFactor = (zoneType === 'seating' || zoneType === 'experience') ? 0.6 : 1;
    const baseCount = area < 10 ? 3 : area < 20 ? 4 : 5;
    const count = Math.max(1, Math.round(baseCount * densityFactor));

    for (let i = 0; i < count; i++) {
      const s = seed + i * 31;
      // 존 내부 랜덤 위치 (테두리에서 안쪽으로 margin 유지)
      const marginX = zw * 0.15;
      const marginZ = zd * 0.15;
      const fx = zone.x + (seededRandom(s) - 0.5) * (zw - marginX * 2);
      const fz = zone.z + (seededRandom(s + 1) - 0.5) * (zd - marginZ * 2);

      // 존 타입 + 라벨 기반 집기 타입 추론
      const fixtureType = inferFixtureType(zone.label, zoneType);
      const fixtureRand = () => seededRandom(s + 3 + furniture.length);
      const { w: fw, h: fh, d: fd } = getFixtureDimensions(fixtureType, fixtureRand);

      furniture.push({
        x: fx,
        z: fz,
        w: fw,
        h: fh,
        d: fd,
        label: `${zone.label} 집기`
      });
    }
  }

  return furniture;
}

/**
 * storeParams + zoneScale + dynamicZones를 적용하여 SceneConfig 생성
 */
export function applyParamsToConfig(
  storeParams?: StoreParams,
  zoneScale?: ZoneScale,
  dynamicZones?: DynamicZone[],
  flowOrder?: string[]
): SceneConfig {
  const baseConfig = createDefaultSceneConfig();

  // 동적 존이 있으면 기존 존/가구/동선을 교체
  if (dynamicZones && dynamicZones.length > 0) {
    baseConfig.zones = dynamicZonesToRecord(dynamicZones);
    baseConfig.furniture = generateFurnitureForZones(dynamicZones);
    baseConfig.flowCurvePoints = generateFlowFromZones(dynamicZones, flowOrder);
  }

  // storeParams 적용
  if (storeParams) {
    if (storeParams.storeWidth) {
      baseConfig.storeWidth = storeParams.storeWidth;
      baseConfig.gridSize = Math.max(30, storeParams.storeWidth * 1.5);
      baseConfig.particleBounds = Math.max(40, storeParams.storeWidth * 2);
    }
    if (storeParams.storeDepth) {
      baseConfig.storeDepth = storeParams.storeDepth;
      baseConfig.gridSize = Math.max(baseConfig.gridSize, storeParams.storeDepth * 1.5);
      baseConfig.particleBounds = Math.max(baseConfig.particleBounds, storeParams.storeDepth * 2);
    }
    if (storeParams.storeHeight) {
      baseConfig.storeHeight = storeParams.storeHeight;
    }
    baseConfig.gridDivisions = Math.floor(baseConfig.gridSize);
  }

  // zoneScale 적용
  if (zoneScale) {
    const scaledZones: Record<string, ZoneConfig> = {};
    for (const [zoneId, zone] of Object.entries(baseConfig.zones)) {
      const scale = zoneScale[zoneId];
      if (scale) {
        scaledZones[zoneId] = {
          ...zone,
          w: zone.w * (scale.scaleX ?? 1),
          d: zone.d * (scale.scaleZ ?? 1)
        };
      } else {
        scaledZones[zoneId] = zone;
      }
    }
    baseConfig.zones = scaledZones;
  }

  return baseConfig;
}

// ═══════════════════════════════════════════
//  반환 타입 정의
// ═══════════════════════════════════════════

export interface ZonePlaneObjects {
  plane: THREE.Mesh;
  border: THREE.LineSegments;
}

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  zonePlanes: Record<string, ZonePlaneObjects>;
  flowLine: THREE.Line;
  flowDots: THREE.Mesh[];
  flowCurve: THREE.CatmullRomCurve3;
  furnitureObjects: THREE.LineSegments[];
  particles: THREE.Points;
  entranceGate: THREE.LineSegments;
}

// ═══════════════════════════════════════════
//  헬퍼 함수
// ═══════════════════════════════════════════

/**
 * 와이어프레임 박스 생성
 */
function createWireBox(
  w: number,
  h: number,
  d: number,
  material: THREE.LineBasicMaterial,
  position: THREE.Vector3
): THREE.LineSegments {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, material.clone());
  line.position.copy(position);
  return line;
}

/**
 * 존 바닥 플레인 생성 (미세 그리드 패턴)
 */
function createZonePlane(
  w: number,
  d: number,
  color: number,
  position: THREE.Vector3
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(w, d);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.copy(position);
  plane.position.y = 0.05;

  // 존 내부 미세 그리드 (1m 간격)
  const gridW = Math.floor(w);
  const gridD = Math.floor(d);
  if (gridW > 1 && gridD > 1) {
    const innerGrid = new THREE.GridHelper(
      Math.max(w, d),
      Math.max(gridW, gridD),
      color,
      color
    );
    innerGrid.material.transparent = true;
    (innerGrid.material as THREE.Material).opacity = 0.04;
    // GridHelper는 XZ 평면이므로 회전 불필요
    // 부모 plane은 XZ 회전됨 → grid는 plane.add 대신 별도 위치
    innerGrid.position.copy(position);
    innerGrid.position.y = 0.04;
    // 씬에 직접 추가하지 않고, plane과 같은 위치에 배치
    // plane에 userData로 참조 저장 (씬 빌더에서 추가)
    plane.userData.innerGrid = innerGrid;
  }

  return plane;
}

/**
 * 존 테두리 생성 (대시 + 코너 마커)
 */
function createZoneBorder(
  w: number,
  d: number,
  color: number,
  position: THREE.Vector3
): THREE.LineSegments {
  // 메인 테두리 (dashed)
  const hw = w / 2, hd = d / 2;
  const cornerLen = Math.min(w, d) * 0.15; // 코너 마커 길이

  // 대시 테두리 vertices
  const borderVerts: number[] = [];
  // Top edge
  borderVerts.push(-hw, 0, -hd, hw, 0, -hd);
  // Right edge
  borderVerts.push(hw, 0, -hd, hw, 0, hd);
  // Bottom edge
  borderVerts.push(hw, 0, hd, -hw, 0, hd);
  // Left edge
  borderVerts.push(-hw, 0, hd, -hw, 0, -hd);

  const borderGeo = new THREE.BufferGeometry();
  borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(borderVerts, 3));

  const borderMat = new THREE.LineDashedMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    dashSize: 0.4,
    gapSize: 0.2,
    linewidth: 1,
  });

  const borderLine = new THREE.LineSegments(borderGeo, borderMat);
  borderLine.computeLineDistances();
  borderLine.rotation.x = 0; // already in XZ plane
  borderLine.position.copy(position);
  borderLine.position.y = 0.06;

  // 코너 마커 (밝은 L자 표시)
  const cornerVerts: number[] = [];
  // Top-left corner
  cornerVerts.push(-hw, 0, -hd, -hw + cornerLen, 0, -hd);
  cornerVerts.push(-hw, 0, -hd, -hw, 0, -hd + cornerLen);
  // Top-right corner
  cornerVerts.push(hw, 0, -hd, hw - cornerLen, 0, -hd);
  cornerVerts.push(hw, 0, -hd, hw, 0, -hd + cornerLen);
  // Bottom-right corner
  cornerVerts.push(hw, 0, hd, hw - cornerLen, 0, hd);
  cornerVerts.push(hw, 0, hd, hw, 0, hd - cornerLen);
  // Bottom-left corner
  cornerVerts.push(-hw, 0, hd, -hw + cornerLen, 0, hd);
  cornerVerts.push(-hw, 0, hd, -hw, 0, hd - cornerLen);

  const cornerGeo = new THREE.BufferGeometry();
  cornerGeo.setAttribute('position', new THREE.Float32BufferAttribute(cornerVerts, 3));

  const cornerMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    linewidth: 2,
  });

  const cornerMarkers = new THREE.LineSegments(cornerGeo, cornerMat);
  // borderLine의 자식이므로 로컬 좌표 사용 (부모 기준 상대 오프셋)
  cornerMarkers.position.set(0, 0.01, 0); // borderLine(y=0.06)으로부터 +0.01 → y=0.07
  borderLine.add(cornerMarkers);

  return borderLine;
}

// ═══════════════════════════════════════════
//  메인 씬 빌더
// ═══════════════════════════════════════════

export function buildScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  config?: SceneConfig
): SceneObjects {
  // 설정 적용 (기본값 또는 전달된 config)
  const cfg = config ?? createDefaultSceneConfig();

  // ─────────────────────────────────────────
  // 1. Scene 설정
  // ─────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);
  scene.fog = new THREE.FogExp2(COLORS.fog, cfg.fogDensity);

  // ─────────────────────────────────────────
  // 2. Camera 설정 (매장 크기에 맞게 거리 조정)
  // ─────────────────────────────────────────
  const cameraDistance = Math.max(cfg.storeWidth, cfg.storeDepth) * 1.1;
  const camera = new THREE.PerspectiveCamera(
    cfg.cameraPresets.overview.fov,
    width / height,
    0.1,
    cameraDistance * 5
  );
  camera.position.set(...cfg.cameraPresets.overview.pos);
  camera.lookAt(new THREE.Vector3(...cfg.cameraPresets.overview.target));

  // ─────────────────────────────────────────
  // 3. Renderer 설정
  // ─────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ─────────────────────────────────────────
  // 4. Grid Helper (파라메트릭)
  // ─────────────────────────────────────────
  const gridHelper = new THREE.GridHelper(
    cfg.gridSize,
    cfg.gridDivisions,
    COLORS.grid.primary,
    COLORS.grid.secondary
  );
  scene.add(gridHelper);

  // ─────────────────────────────────────────
  // 5. 매장 외벽 (파라메트릭)
  // ─────────────────────────────────────────
  const wallMaterial = new THREE.LineBasicMaterial({
    color: COLORS.walls,
    transparent: true,
    opacity: 0.65,
    linewidth: 2
  });

  const storeWalls = createWireBox(
    cfg.storeWidth,
    cfg.storeHeight,
    cfg.storeDepth,
    wallMaterial,
    new THREE.Vector3(0, cfg.storeHeight / 2, 0)
  );
  scene.add(storeWalls);

  // ─────────────────────────────────────────
  // 6. 입구 표시 (파라메트릭)
  // ─────────────────────────────────────────
  const entranceMaterial = new THREE.LineBasicMaterial({
    color: COLORS.entrance,
    transparent: true,
    opacity: 1.0,
    linewidth: 2
  });

  // 입구 게이트 (바닥) - 매장 크기에 비례
  const entranceWidth = Math.min(4, cfg.storeWidth * 0.2);
  const entranceGateGeometry = new THREE.PlaneGeometry(entranceWidth, 1);
  const entranceGateEdges = new THREE.EdgesGeometry(entranceGateGeometry);
  const entranceGate = new THREE.LineSegments(entranceGateEdges, entranceMaterial.clone());
  entranceGate.rotation.x = -Math.PI / 2;
  entranceGate.position.set(0, 0.02, cfg.storeDepth / 2 - 0.5);
  scene.add(entranceGate);

  // ─────────────────────────────────────────
  // 7. 가구 (와이어프레임, 파라메트릭)
  // ─────────────────────────────────────────
  const furnitureMaterial = new THREE.LineBasicMaterial({
    color: COLORS.furniture,
    transparent: true,
    opacity: 0.7,
    linewidth: 2
  });

  const furnitureObjects: THREE.LineSegments[] = [];

  // 매장 크기 비율 계산 (가구 위치 조정용)
  const widthRatio = cfg.storeWidth / STORE.width;
  const depthRatio = cfg.storeDepth / STORE.depth;

  cfg.furniture.forEach((furniture) => {
    // 가구 위치를 매장 크기 비율에 맞게 조정
    const adjustedX = furniture.x * widthRatio;
    const adjustedZ = furniture.z * depthRatio;

    const obj = createWireBox(
      furniture.w,
      furniture.h,
      furniture.d,
      furnitureMaterial,
      new THREE.Vector3(adjustedX, furniture.h / 2, adjustedZ)
    );
    obj.userData.label = furniture.label;
    scene.add(obj);
    furnitureObjects.push(obj);
  });

  // ─────────────────────────────────────────
  // 8. 존 하이라이트 플레인 + 테두리 (파라메트릭)
  // ─────────────────────────────────────────
  const zonePlanes: Record<string, ZonePlaneObjects> = {};

  Object.entries(cfg.zones).forEach(([zoneId, zone]) => {
    // 존 위치를 매장 크기 비율에 맞게 조정
    const adjustedX = zone.x * widthRatio;
    const adjustedZ = zone.z * depthRatio;
    const position = new THREE.Vector3(adjustedX, 0, adjustedZ);

    const plane = createZonePlane(zone.w, zone.d, zone.color, position);
    plane.userData.zoneId = zoneId;
    plane.userData.highlighted = false;
    scene.add(plane);
    // 존 내부 미세 그리드 추가
    if (plane.userData.innerGrid) {
      scene.add(plane.userData.innerGrid);
    }

    const border = createZoneBorder(zone.w, zone.d, zone.color, position);
    border.userData.zoneId = zoneId;
    scene.add(border);

    zonePlanes[zoneId] = { plane, border };
  });

  // ─────────────────────────────────────────
  // 9. 고객 동선 (CatmullRomCurve3, 파라메트릭)
  // ─────────────────────────────────────────
  // 동선 포인트를 매장 크기에 맞게 조정
  const flowCurvePoints = cfg.flowCurvePoints.map(
    (p) => new THREE.Vector3(p[0] * widthRatio, p[1], p[2] * depthRatio)
  );
  const flowCurve = new THREE.CatmullRomCurve3(flowCurvePoints);

  // 동선 라인
  const flowPoints = flowCurve.getPoints(80);
  const flowLineGeometry = new THREE.BufferGeometry().setFromPoints(flowPoints);
  const flowLineMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0,
    linewidth: 2
  });
  const flowLine = new THREE.Line(flowLineGeometry, flowLineMaterial);
  scene.add(flowLine);

  // 동선 점들 (5개)
  const flowDots: THREE.Mesh[] = [];
  const dotGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0
  });

  for (let i = 0; i < 5; i++) {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone());
    dot.userData.offset = i * 0.2; // 각 점 간 간격
    scene.add(dot);
    flowDots.push(dot);
  }

  // ─────────────────────────────────────────
  // 10. 배경 파티클 (파라메트릭)
  // ─────────────────────────────────────────
  const particleCount = cfg.particleCount;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * cfg.particleBounds;
    particlePositions[i * 3 + 1] = Math.random() * 15;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * cfg.particleBounds;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: COLORS.particle,
    size: 0.08,
    transparent: true,
    opacity: 0.4
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // ─────────────────────────────────────────
  // 반환
  // ─────────────────────────────────────────
  return {
    scene,
    camera,
    renderer,
    zonePlanes,
    flowLine,
    flowDots,
    flowCurve,
    furnitureObjects,
    particles,
    entranceGate
  };
}

// ═══════════════════════════════════════════
//  씬 정리 (메모리 해제)
// ═══════════════════════════════════════════

export function disposeScene(sceneObjects: SceneObjects): void {
  const { scene, renderer } = sceneObjects;

  // 씬의 모든 오브젝트 정리
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      if (object.material instanceof THREE.Material) {
        object.material.dispose();
      } else if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose());
      }
    }
    if (object instanceof THREE.LineSegments || object instanceof THREE.Line) {
      object.geometry?.dispose();
      if (object.material instanceof THREE.Material) {
        object.material.dispose();
      }
    }
    if (object instanceof THREE.Points) {
      object.geometry?.dispose();
      if (object.material instanceof THREE.Material) {
        object.material.dispose();
      }
    }
  });

  // 렌더러 정리 (forceContextLoss 제거 - 같은 캔버스 재사용 시 문제 발생)
  renderer.dispose();
}

// ═══════════════════════════════════════════
//  유틸리티: Lerp 보간
// ═══════════════════════════════════════════

export function lerpValue(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function lerpVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  factor: number
): THREE.Vector3 {
  return new THREE.Vector3(
    lerpValue(current.x, target.x, factor),
    lerpValue(current.y, target.y, factor),
    lerpValue(current.z, target.z, factor)
  );
}
