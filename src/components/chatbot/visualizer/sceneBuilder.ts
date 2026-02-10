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
 * 존들을 입구(z가 큰 것)부터 안쪽(z가 작은 것) 순으로 연결
 */
function generateFlowFromZones(zones: DynamicZone[]): [number, number, number][] {
  if (zones.length < 2) {
    return [[0, 0.3, 9], [0, 0.3, -5]];
  }

  // z가 큰 순서 (입구 가까운 쪽)부터 작은 순서 (안쪽)로 정렬
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
    const zw = Math.max(2, Math.min(15, zone.w));
    const zd = Math.max(2, Math.min(15, zone.d));
    const seed = zone.id.length * 7 + zone.x * 13 + zone.z * 17;

    // 존 크기에 따라 집기 개수 결정 (작은 존 2개, 큰 존 4개)
    const area = zw * zd;
    const count = area < 12 ? 2 : area < 25 ? 3 : 4;

    for (let i = 0; i < count; i++) {
      const s = seed + i * 31;
      // 존 내부 랜덤 위치 (테두리에서 안쪽으로 margin 유지)
      const marginX = zw * 0.2;
      const marginZ = zd * 0.2;
      const fx = zone.x + (seededRandom(s) - 0.5) * (zw - marginX * 2);
      const fz = zone.z + (seededRandom(s + 1) - 0.5) * (zd - marginZ * 2);

      // 크기 변화 (카운터/테이블/선반 느낌)
      const sizeVariant = seededRandom(s + 2);
      let fw: number, fh: number, fd: number;

      if (sizeVariant < 0.3) {
        // 낮은 테이블/카운터
        fw = 1.0 + seededRandom(s + 3) * 1.5;
        fh = 0.8 + seededRandom(s + 4) * 0.4;
        fd = 0.6 + seededRandom(s + 5) * 0.8;
      } else if (sizeVariant < 0.6) {
        // 높은 선반/진열대
        fw = 0.5 + seededRandom(s + 3) * 1.0;
        fh = 1.4 + seededRandom(s + 4) * 0.8;
        fd = 0.4 + seededRandom(s + 5) * 0.6;
      } else {
        // 중간 크기 집기
        fw = 0.8 + seededRandom(s + 3) * 1.2;
        fh = 1.0 + seededRandom(s + 4) * 0.6;
        fd = 0.5 + seededRandom(s + 5) * 0.7;
      }

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
  dynamicZones?: DynamicZone[]
): SceneConfig {
  const baseConfig = createDefaultSceneConfig();

  // 동적 존이 있으면 기존 존/가구/동선을 교체
  if (dynamicZones && dynamicZones.length > 0) {
    baseConfig.zones = dynamicZonesToRecord(dynamicZones);
    baseConfig.furniture = generateFurnitureForZones(dynamicZones);
    baseConfig.flowCurvePoints = generateFlowFromZones(dynamicZones);
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
 * 존 바닥 플레인 생성
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
    opacity: 0, // 초기에는 보이지 않음
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.copy(position);
  plane.position.y = 0.05; // 바닥에서 약간 위
  return plane;
}

/**
 * 존 테두리 생성
 */
function createZoneBorder(
  w: number,
  d: number,
  color: number,
  position: THREE.Vector3
): THREE.LineSegments {
  const geometry = new THREE.PlaneGeometry(w, d);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    linewidth: 2
  });
  const border = new THREE.LineSegments(edges, material);
  border.rotation.x = -Math.PI / 2;
  border.position.copy(position);
  border.position.y = 0.06;
  return border;
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
    opacity: 0.55,
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
