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
  COLORS
} from './storeData';

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
    opacity: 0
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
  height: number
): SceneObjects {
  // ─────────────────────────────────────────
  // 1. Scene 설정
  // ─────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);
  scene.fog = new THREE.FogExp2(COLORS.fog, 0.012);  // 더 넓은 시야

  // ─────────────────────────────────────────
  // 2. Camera 설정
  // ─────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    CAMERA_PRESETS.overview.fov,
    width / height,
    0.1,
    100
  );
  camera.position.set(...CAMERA_PRESETS.overview.pos);
  camera.lookAt(new THREE.Vector3(...CAMERA_PRESETS.overview.target));

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
  // 4. Grid Helper
  // ─────────────────────────────────────────
  const gridHelper = new THREE.GridHelper(30, 30, COLORS.grid.primary, COLORS.grid.secondary);
  scene.add(gridHelper);

  // ─────────────────────────────────────────
  // 5. 매장 외벽
  // ─────────────────────────────────────────
  const wallMaterial = new THREE.LineBasicMaterial({
    color: COLORS.walls,
    transparent: true,
    opacity: 0.3
  });

  const storeWalls = createWireBox(
    STORE.width,
    STORE.height,
    STORE.depth,
    wallMaterial,
    new THREE.Vector3(0, STORE.height / 2, 0)
  );
  scene.add(storeWalls);

  // ─────────────────────────────────────────
  // 6. 입구 표시
  // ─────────────────────────────────────────
  const entranceMaterial = new THREE.LineBasicMaterial({
    color: COLORS.entrance,
    transparent: true,
    opacity: 0.8
  });

  // 입구 게이트 (바닥)
  const entranceGateGeometry = new THREE.PlaneGeometry(4, 1);
  const entranceGateEdges = new THREE.EdgesGeometry(entranceGateGeometry);
  const entranceGate = new THREE.LineSegments(entranceGateEdges, entranceMaterial.clone());
  entranceGate.rotation.x = -Math.PI / 2;
  entranceGate.position.set(0, 0.02, STORE.depth / 2 - 0.5);
  scene.add(entranceGate);

  // ─────────────────────────────────────────
  // 7. 가구 (와이어프레임)
  // ─────────────────────────────────────────
  const furnitureMaterial = new THREE.LineBasicMaterial({
    color: COLORS.furniture,
    transparent: true,
    opacity: 0.3
  });

  const furnitureObjects: THREE.LineSegments[] = [];

  FURNITURE_DATA.forEach((furniture) => {
    const obj = createWireBox(
      furniture.w,
      furniture.h,
      furniture.d,
      furnitureMaterial,
      new THREE.Vector3(furniture.x, furniture.h / 2, furniture.z)
    );
    obj.userData.label = furniture.label;
    scene.add(obj);
    furnitureObjects.push(obj);
  });

  // ─────────────────────────────────────────
  // 8. 존 하이라이트 플레인 + 테두리
  // ─────────────────────────────────────────
  const zonePlanes: Record<string, ZonePlaneObjects> = {};

  Object.entries(STORE.zones).forEach(([zoneId, zone]) => {
    const position = new THREE.Vector3(zone.x, 0, zone.z);

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
  // 9. 고객 동선 (CatmullRomCurve3)
  // ─────────────────────────────────────────
  const flowCurvePoints = FLOW_CURVE_POINTS.map(
    (p) => new THREE.Vector3(p[0], p[1], p[2])
  );
  const flowCurve = new THREE.CatmullRomCurve3(flowCurvePoints);

  // 동선 라인
  const flowPoints = flowCurve.getPoints(80);
  const flowLineGeometry = new THREE.BufferGeometry().setFromPoints(flowPoints);
  const flowLineMaterial = new THREE.LineBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0
  });
  const flowLine = new THREE.Line(flowLineGeometry, flowLineMaterial);
  scene.add(flowLine);

  // 동선 점들 (5개)
  const flowDots: THREE.Mesh[] = [];
  const dotGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
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
  // 10. 배경 파티클
  // ─────────────────────────────────────────
  const particleCount = 200;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 1] = Math.random() * 15;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
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

  // 렌더러 정리
  renderer.dispose();
  renderer.forceContextLoss();
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
