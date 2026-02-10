/**
 * NEURALTWIN Store Visualizer - Main React Component
 *
 * Three.js 씬을 React 라이프사이클에 통합
 * wireframe-3d-viz.jsx 레퍼런스 기반
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildScene, disposeScene, lerpVector3, applyParamsToConfig, type SceneObjects } from './sceneBuilder';
import { CAMERA_PRESETS, STORE, getZoneColorHex, ZONE_LABELS_KO } from './storeData';
import type { VizState, VizAnnotation, VizKPI, CustomerStage, StoreParams, ZoneScale } from './vizDirectiveTypes';
import KPIBar from './KPIBar';
import StageProgress from './StageProgress';

// ═══════════════════════════════════════════
//  Props 인터페이스
// ═══════════════════════════════════════════

interface StoreVisualizerProps {
  vizState: VizState;
  highlights: string[];
  annotations: VizAnnotation[];
  showFlow: boolean;
  className?: string;

  /** KPI 데이터 — 3D 캔버스 위 좌상단 오버레이 */
  kpis?: VizKPI[];

  /** 고객 여정 단계 — 3D 캔버스 위 하단 오버레이 */
  stage?: CustomerStage;

  /** 파라메트릭 매장 설정 (PHASE H) */
  storeParams?: StoreParams;

  /** 존별 크기 조정 (PHASE H) */
  zoneScale?: ZoneScale;
}

// ═══════════════════════════════════════════
//  어노테이션 위치 타입
// ═══════════════════════════════════════════

interface AnnotationPosition {
  zone: string;
  text: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

// ═══════════════════════════════════════════
//  메인 컴포넌트
// ═══════════════════════════════════════════

export default function StoreVisualizer({
  vizState,
  highlights = [],
  annotations = [],
  showFlow,
  className = '',
  kpis,
  stage,
  storeParams,
  zoneScale
}: StoreVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneObjects | null>(null);
  const animationFrameRef = useRef<number>(0);

  // OrbitControls 관련
  const controlsRef = useRef<OrbitControls | null>(null);
  const isUserInteracting = useRef<boolean>(false);

  // 카메라 목표 위치 (lerp용)
  const cameraTargetPos = useRef<THREE.Vector3>(
    new THREE.Vector3(...CAMERA_PRESETS.overview.pos)
  );
  const cameraTargetLookAt = useRef<THREE.Vector3>(
    new THREE.Vector3(...CAMERA_PRESETS.overview.target)
  );
  const cameraTargetFov = useRef<number>(CAMERA_PRESETS.overview.fov);

  // 어노테이션 스크린 좌표
  const [annotationPositions, setAnnotationPositions] = useState<AnnotationPosition[]>([]);

  // 파라메트릭 설정 메모이제이션 (불필요한 씬 재빌드 방지)
  const sceneConfigKey = useMemo(() => {
    if (!storeParams && !zoneScale) return 'default';
    return JSON.stringify({ storeParams, zoneScale });
  }, [storeParams, zoneScale]);

  // ─────────────────────────────────────────
  // 애니메이션 루프
  // ─────────────────────────────────────────
  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const {
      scene,
      camera,
      renderer,
      zonePlanes,
      flowLine,
      flowDots,
      flowCurve,
      particles
    } = sceneRef.current;

    const time = performance.now() * 0.001;

    // OrbitControls 업데이트
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // 1. 카메라 lerp 보간 (사용자 인터랙션 중이 아닐 때만)
    // TODO: 프리셋 전환 애니메이션 속도 조절 필요 시 lerpFactor 변경
    if (!isUserInteracting.current) {
      const lerpFactor = 0.025;

      // 현재 위치가 타겟과 충분히 가까우면 lerp 스킵 (불필요한 미세 보정 방지)
      const posDist = camera.position.distanceTo(cameraTargetPos.current);
      if (posDist > 0.01) {
        const newPos = lerpVector3(camera.position, cameraTargetPos.current, lerpFactor);
        camera.position.copy(newPos);
      }

      // OrbitControls target을 직접 lerp (lookAt 대신 — OrbitControls가 카메라 방향을 관리)
      if (controlsRef.current) {
        const targetDist = controlsRef.current.target.distanceTo(cameraTargetLookAt.current);
        if (targetDist > 0.01) {
          controlsRef.current.target.lerp(cameraTargetLookAt.current, lerpFactor);
        }
      }

      // FOV lerp
      const fovDiff = Math.abs(cameraTargetFov.current - camera.fov);
      if (fovDiff > 0.01) {
        camera.fov += (cameraTargetFov.current - camera.fov) * lerpFactor;
        camera.updateProjectionMatrix();
      }
    }

    // 2. 존 플레인 opacity pulse (하이라이트된 존만)
    Object.values(zonePlanes).forEach(({ plane, border }) => {
      const mat = plane.material as THREE.MeshBasicMaterial;
      const borderMat = border.material as THREE.LineBasicMaterial;

      if (plane.userData.highlighted) {
        // 하이라이트: pulse 애니메이션 (선명도 강화)
        mat.opacity = 0.20 + Math.sin(time * 2) * 0.10;
        borderMat.opacity = 0.75 + Math.sin(time * 2) * 0.20;
      } else {
        // 비활성: 서서히 페이드아웃
        mat.opacity = Math.max(0, mat.opacity - 0.02);
        borderMat.opacity = Math.max(0, borderMat.opacity - 0.02);
      }
    });

    // 3. 동선 표시
    const flowMat = flowLine.material as THREE.LineBasicMaterial;
    if (flowLine.userData.showFlow) {
      flowMat.opacity = Math.min(0.85, flowMat.opacity + 0.02);

      // 점들 이동
      flowDots.forEach((dot) => {
        const dotMat = dot.material as THREE.MeshBasicMaterial;
        dotMat.opacity = Math.min(1.0, dotMat.opacity + 0.02);

        const progress = ((time * 0.15 + dot.userData.offset) % 1);
        const point = flowCurve.getPointAt(progress);
        dot.position.copy(point);
      });
    } else {
      flowMat.opacity = Math.max(0, flowMat.opacity - 0.02);
      flowDots.forEach((dot) => {
        const dotMat = dot.material as THREE.MeshBasicMaterial;
        dotMat.opacity = Math.max(0, dotMat.opacity - 0.02);
      });
    }

    // 4. 파티클 회전
    particles.rotation.y = time * 0.02;

    // 5. 렌더링
    renderer.render(scene, camera);

    // 6. 어노테이션 위치 업데이트 (30fps throttle)
    if (Math.floor(time * 30) % 1 === 0) {
      updateAnnotationPositions();
    }

    // 다음 프레임
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // ─────────────────────────────────────────
  // 어노테이션 3D→2D 좌표 변환
  // ─────────────────────────────────────────
  const updateAnnotationPositions = useCallback(() => {
    if (!sceneRef.current || !canvasRef.current || !annotations?.length) {
      setAnnotationPositions([]);
      return;
    }

    const { camera, renderer } = sceneRef.current;
    const canvas = renderer.domElement;

    const newPositions: AnnotationPosition[] = annotations.map((ann) => {
      const zone = STORE.zones[ann.zone];
      if (!zone) {
        return { ...ann, x: 0, y: 0, visible: false };
      }

      // 3D 월드 좌표 (존 중심 위)
      const worldPos = new THREE.Vector3(zone.x, 2.5, zone.z);

      // 2D 스크린 좌표 변환
      const projected = worldPos.clone().project(camera);

      // 화면 밖인지 확인
      const visible = projected.z < 1 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2;

      const x = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;

      return {
        zone: ann.zone,
        text: ann.text,
        color: ann.color,
        x,
        y,
        visible
      };
    });

    setAnnotationPositions(newPositions);
  }, [annotations]);

  // ─────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // WebGL 컨텍스트 가용성 체크
    const testContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!testContext) {
      console.error('WebGL not available on this canvas');
      return;
    }

    // 파라메트릭 설정 적용 (PHASE H)
    const sceneConfig = (storeParams || zoneScale)
      ? applyParamsToConfig(storeParams, zoneScale)
      : undefined;

    // 씬 빌드 (파라메트릭 config 전달)
    const sceneObjects = buildScene(
      canvas,
      container.clientWidth,
      container.clientHeight,
      sceneConfig
    );
    sceneRef.current = sceneObjects;

    // OrbitControls 설정
    const controls = new OrbitControls(sceneObjects.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI * 0.45; // 수평선 아래로 카메라 회전 제한
    controls.target.set(...CAMERA_PRESETS.overview.target);

    // 사용자 인터랙션 감지 — 종료 시 현재 카메라 위치를 타겟에 저장하여 스냅백 방지
    controls.addEventListener('start', () => {
      isUserInteracting.current = true;
    });
    controls.addEventListener('end', () => {
      isUserInteracting.current = false;
      // 사용자가 조작한 최종 위치를 lerp 타겟으로 저장 → 원래 위치로 돌아가지 않음
      if (sceneRef.current) {
        cameraTargetPos.current.copy(sceneRef.current.camera.position);
        cameraTargetLookAt.current.copy(controls.target);
        cameraTargetFov.current = sceneRef.current.camera.fov;
      }
    });

    controlsRef.current = controls;

    // 애니메이션 시작
    animationFrameRef.current = requestAnimationFrame(animate);

    // 리사이즈 핸들러
    const resizeObserver = new ResizeObserver((entries) => {
      if (!sceneRef.current) return;

      const entry = entries[0];
      const { width, height } = entry.contentRect;

      if (width > 0 && height > 0) {
        sceneRef.current.camera.aspect = width / height;
        sceneRef.current.camera.updateProjectionMatrix();
        sceneRef.current.renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    // 정리
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (sceneRef.current) {
        disposeScene(sceneRef.current);
        sceneRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, sceneConfigKey]);

  // ─────────────────────────────────────────
  // vizState 변경 시 카메라 업데이트
  // ─────────────────────────────────────────
  useEffect(() => {
    const preset = CAMERA_PRESETS[vizState];
    if (preset) {
      cameraTargetPos.current = new THREE.Vector3(...preset.pos);
      cameraTargetLookAt.current = new THREE.Vector3(...preset.target);
      cameraTargetFov.current = preset.fov;
    }
  }, [vizState]);

  // ─────────────────────────────────────────
  // 카메라 리셋 함수
  // ─────────────────────────────────────────
  const resetCamera = useCallback(() => {
    const preset = CAMERA_PRESETS[vizState];
    if (preset && controlsRef.current) {
      cameraTargetPos.current = new THREE.Vector3(...preset.pos);
      cameraTargetLookAt.current = new THREE.Vector3(...preset.target);
      cameraTargetFov.current = preset.fov;
      controlsRef.current.target.copy(cameraTargetLookAt.current);
    }
  }, [vizState]);

  // ─────────────────────────────────────────
  // highlights 변경 시 존 하이라이트 업데이트
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;

    const { zonePlanes } = sceneRef.current;

    // 모든 존 하이라이트 해제
    Object.values(zonePlanes).forEach(({ plane }) => {
      plane.userData.highlighted = false;
    });

    // 지정된 존만 하이라이트
    highlights.forEach((zoneId) => {
      const zoneObj = zonePlanes[zoneId];
      if (zoneObj) {
        zoneObj.plane.userData.highlighted = true;
      }
    });
  }, [highlights]);

  // ─────────────────────────────────────────
  // showFlow 변경 시 동선 표시 업데이트
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.flowLine.userData.showFlow = showFlow;
  }, [showFlow]);

  // ─────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Three.js Canvas */}
      <div ref={containerRef} className="w-full h-full overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      {/* 어노테이션 오버레이 */}
      {annotationPositions.map((ann, index) =>
        ann.visible ? (
          <div
            key={`${ann.zone}-${index}`}
            className="absolute pointer-events-none animate-fade-in-up viz-annotation"
            style={{
              left: ann.x,
              top: ann.y,
              transform: 'translate(-50%, -50%)',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: `${ann.color}33`,
              border: `1px solid ${ann.color}88`,
              color: ann.color,
              fontSize: '12px',
              fontFamily: "'Fira Code', 'Noto Sans KR', monospace",
              fontWeight: 600,
              backdropFilter: 'blur(6px)',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              zIndex: 10,
              lineHeight: 1.5
            }}
          >
            {ann.text}
          </div>
        ) : null
      )}

      {/* ── 상단 영역: KPI Bar + RESET VIEW ── */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        {kpis && kpis.length > 0 && (
          <div className="pointer-events-auto">
            <KPIBar kpis={kpis} />
          </div>
        )}
        {/* RESET VIEW 버튼 — KPI 유무 상관없이 상단 우측 고정 */}
        <button
          onClick={resetCamera}
          className="absolute pointer-events-auto px-2 py-1 sm:px-3 sm:py-1.5 rounded bg-[#0a0a0acc] border border-[#1e293b] text-[9px] sm:text-[11px] text-[#94a3b8] backdrop-blur-sm hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-colors cursor-pointer"
          style={{
            right: 8,
            top: kpis && kpis.length > 0 ? 64 : 8,
            fontFamily: "'Fira Code', 'Noto Sans KR', monospace"
          }}
        >
          RESET VIEW
        </button>
      </div>

      {/* ── 우측 중앙: ZONES 범례 (하이라이트 활성 시) ── */}
      {highlights.length > 0 && (
        <div
          className="absolute right-2 sm:right-3 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded bg-[#030712dd] border border-[#1e293b] backdrop-blur-sm z-10"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        >
          <div
            className="text-[9px] sm:text-[10px] text-[#94a3b8] mb-1.5 sm:mb-2 font-semibold tracking-wider"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            ZONES
          </div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {highlights.map((zoneId) => (
              <div key={zoneId} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                  style={{ backgroundColor: getZoneColorHex(zoneId) }}
                />
                <span
                  className="text-[10px] sm:text-[12px] text-[#cbd5e1]"
                  style={{ fontFamily: "'Noto Sans KR', 'Fira Code', sans-serif" }}
                >
                  {ZONE_LABELS_KO[zoneId] || zoneId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 하단 영역: VIEW 라벨 + 조작힌트 → StageProgress 순서 ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        {/* VIEW 라벨 + 조작 힌트 (Stage 위쪽 행) */}
        <div className="flex items-center justify-between px-2 sm:px-3 mb-1">
          {/* 좌: 현재 뷰 상태 */}
          <div
            className="pointer-events-auto px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-[#0a0a0acc]
                        border border-[#1e293b] text-[9px] sm:text-[11px] text-[#94a3b8]
                        backdrop-blur-sm truncate max-w-[160px] sm:max-w-[280px]"
            style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
          >
            VIEW: {vizState.toUpperCase()}
            {highlights.length > 0 && ` · ${highlights.map(h => ZONE_LABELS_KO[h] || h).join(', ')}`}
          </div>

          {/* 우: 조작 힌트 (모바일 숨김) */}
          <div
            className="pointer-events-auto px-3 py-1.5 rounded bg-[#0a0a0acc]
                        border border-[#1e293b] text-[10px] text-[#64748b]
                        backdrop-blur-sm hidden sm:flex items-center gap-2.5"
            style={{ fontFamily: "'Fira Code', 'Noto Sans KR', monospace" }}
          >
            <span>SCROLL 줌</span>
            <span className="text-[#334155]">·</span>
            <span>L-DRAG 회전</span>
            <span className="text-[#334155]">·</span>
            <span>R-DRAG 이동</span>
          </div>
        </div>

        {/* Stage Progress 바 (최하단) */}
        {stage && (
          <StageProgress stage={stage} />
        )}
      </div>
    </div>
  );
}
