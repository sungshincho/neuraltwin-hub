/**
 * NEURALTWIN Store Visualizer - Main React Component
 *
 * Three.js 씬을 React 라이프사이클에 통합
 * wireframe-3d-viz.jsx 레퍼런스 기반
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildScene, disposeScene, lerpVector3, applyParamsToConfig, type SceneObjects } from './sceneBuilder';
import { CAMERA_PRESETS, STORE, getZoneColorHex, ZONE_LABELS_KO } from './storeData';
import type { VizState, VizAnnotation, StoreParams, ZoneScale } from './vizDirectiveTypes';

// ═══════════════════════════════════════════
//  Props 인터페이스
// ═══════════════════════════════════════════

interface StoreVisualizerProps {
  vizState: VizState;
  highlights: string[];
  annotations: VizAnnotation[];
  showFlow: boolean;
  className?: string;

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
    if (!isUserInteracting.current) {
      const newPos = lerpVector3(camera.position, cameraTargetPos.current, 0.025);
      camera.position.copy(newPos);

      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      const newLookAt = lerpVector3(
        camera.position.clone().add(currentLookAt),
        cameraTargetLookAt.current,
        0.025
      );
      camera.lookAt(newLookAt);

      // OrbitControls target 동기화
      if (controlsRef.current) {
        controlsRef.current.target.lerp(cameraTargetLookAt.current, 0.025);
      }

      // FOV lerp
      camera.fov += (cameraTargetFov.current - camera.fov) * 0.025;
      camera.updateProjectionMatrix();
    }

    // 2. 존 플레인 opacity pulse (하이라이트된 존만)
    Object.values(zonePlanes).forEach(({ plane, border }) => {
      const mat = plane.material as THREE.MeshBasicMaterial;
      const borderMat = border.material as THREE.LineBasicMaterial;

      if (plane.userData.highlighted) {
        // 하이라이트: pulse 애니메이션
        mat.opacity = 0.12 + Math.sin(time * 2) * 0.08;
        borderMat.opacity = 0.5 + Math.sin(time * 2) * 0.2;
      } else {
        // 비활성: 서서히 페이드아웃
        mat.opacity = Math.max(0, mat.opacity - 0.02);
        borderMat.opacity = Math.max(0, borderMat.opacity - 0.02);
      }
    });

    // 3. 동선 표시
    const flowMat = flowLine.material as THREE.LineBasicMaterial;
    if (flowLine.userData.showFlow) {
      flowMat.opacity = Math.min(0.6, flowMat.opacity + 0.02);

      // 점들 이동
      flowDots.forEach((dot) => {
        const dotMat = dot.material as THREE.MeshBasicMaterial;
        dotMat.opacity = Math.min(0.8, dotMat.opacity + 0.02);

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

    // 사용자 인터랙션 감지
    controls.addEventListener('start', () => {
      isUserInteracting.current = true;
    });
    controls.addEventListener('end', () => {
      isUserInteracting.current = false;
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
  }, [animate, storeParams, zoneScale]);

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
            className="absolute pointer-events-none animate-fadeInUp"
            style={{
              left: ann.x,
              top: ann.y,
              transform: 'translate(-50%, -50%)',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: `${ann.color}22`,
              border: `1px solid ${ann.color}66`,
              color: ann.color,
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              zIndex: 10
            }}
          >
            {ann.text}
          </div>
        ) : null
      )}

      {/* 좌상단: RESET VIEW 버튼 */}
      <button
        onClick={resetCamera}
        className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#0a0a0acc]
                   border border-[#1a1a1a] text-[9px] font-mono text-[#64748b]
                   backdrop-blur-sm hover:text-[#0ea5e9] hover:border-[#0ea5e9]
                   transition-colors cursor-pointer"
      >
        RESET VIEW
      </button>

      {/* 좌하단: 현재 뷰 상태 */}
      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#0a0a0acc]
                      border border-[#1a1a1a] text-[9px] font-mono text-[#475569]
                      backdrop-blur-sm">
        VIEW: {vizState.toUpperCase()}
        {highlights.length > 0 && ` · ${highlights.map(h => ZONE_LABELS_KO[h] || h).join(', ')}`}
      </div>

      {/* 우하단: 조작 힌트 */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#0a0a0acc]
                      border border-[#1a1a1a] text-[8px] font-mono text-[#404040]
                      backdrop-blur-sm flex items-center gap-2">
        <span>SCROLL 줌</span>
        <span className="text-[#262626]">·</span>
        <span>L-DRAG 회전</span>
        <span className="text-[#262626]">·</span>
        <span>R-DRAG 이동</span>
      </div>

      {/* 우상단: 범례 (하이라이트 활성 시) */}
      {highlights.length > 0 && (
        <div className="absolute top-3 right-3 px-3 py-2 rounded bg-[#030712dd]
                        border border-[#15243d] backdrop-blur-sm">
          <div className="text-[9px] font-mono text-[#64748b] mb-1.5">ZONES</div>
          <div className="flex flex-col gap-1">
            {highlights.map((zoneId) => (
              <div key={zoneId} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getZoneColorHex(zoneId) }}
                />
                <span className="text-[10px] font-mono text-[#94a3b8]">
                  {ZONE_LABELS_KO[zoneId] || zoneId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
