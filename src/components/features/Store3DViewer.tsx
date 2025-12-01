import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Box, Plane, Sphere, Line, Cylinder, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState } from "react";
import * as THREE from "three";

interface CustomerPath {
  id: string;
  points: [number, number, number][];
  isReturning: boolean;
  dwellTime: number;
}

interface Store3DViewerProps {
  mode: "footfall" | "layout" | "heatmap";
  // Footfall props
  timeRange?: [number, number];
  showReturning?: boolean;
  showNew?: boolean;
  showHeatmap?: boolean;
  customerPaths?: CustomerPath[];
  // Layout props
  layoutProducts?: Array<{ id: string; name: string; x: number; y: number; color: string }>;
  // Heatmap props
  timeOfDay?: number;
  heatmapData?: Array<{ x: number; y: number; intensity: number }>;
  hotspots?: Array<{ x: number; y: number; intensity: number }>;
}

// 애니메이션되는 고객 구체
const AnimatedCustomer = ({ 
  path, 
  isReturning, 
  speed = 0.5 
}: { 
  path: [number, number, number][]; 
  isReturning: boolean; 
  speed?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);
  
  useFrame((_, delta) => {
    setProgress((prev) => {
      const next = prev + delta * speed;
      return next > path.length - 1 ? 0 : next;
    });
    
    if (meshRef.current && path.length > 1) {
      const index = Math.floor(progress);
      const nextIndex = Math.min(index + 1, path.length - 1);
      const t = progress - index;
      
      const current = path[index];
      const next = path[nextIndex];
      
      meshRef.current.position.x = current[0] + (next[0] - current[0]) * t;
      meshRef.current.position.y = current[1] + (next[1] - current[1]) * t;
      meshRef.current.position.z = current[2] + (next[2] - current[2]) * t;
    }
  });

  const color = isReturning ? "#8b5cf6" : "#3b82f6";

  return (
    <Sphere ref={meshRef} args={[0.25]} position={path[0]}>
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.6}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
};

// 고객 동선 라인
const CustomerPathLine = ({ 
  points, 
  isReturning 
}: { 
  points: [number, number, number][]; 
  isReturning: boolean;
}) => {
  const color = isReturning ? "#8b5cf6" : "#3b82f6";
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.4}
      dashed
      dashScale={0.5}
    />
  );
};

// 히트맵 셀 애니메이션
const HeatmapCell = ({ 
  x, 
  z, 
  intensity, 
  isHotspot = false 
}: { 
  x: number; 
  z: number; 
  intensity: number; 
  isHotspot?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isHotspot) {
      meshRef.current.position.y = 0.03 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  const getColor = (intensity: number) => {
    if (intensity < 0.2) return '#3b82f6';
    if (intensity < 0.4) return '#06b6d4';
    if (intensity < 0.6) return '#eab308';
    if (intensity < 0.8) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(intensity);

  return (
    <group>
      <Plane 
        ref={meshRef}
        args={[1.7, 1.3]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[x, 0.02, z]}
      >
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={intensity * 0.6 + 0.1}
          emissive={color}
          emissiveIntensity={intensity * 0.4}
        />
      </Plane>
      {isHotspot && (
        <Cylinder args={[0.3, 0.3, intensity * 2, 16]} position={[x, intensity, z]}>
          <meshStandardMaterial 
            color="#ef4444" 
            transparent 
            opacity={0.6}
            emissive="#ef4444"
            emissiveIntensity={0.5}
          />
        </Cylinder>
      )}
    </group>
  );
};

// ============================================================
// threejs기존백업 - 기존 procedural 매장 컴포넌트들
// 필요시 주석 해제하여 사용 가능
// ============================================================

/*
// [threejs기존백업] 매장 벽 컴포넌트
const StoreWalls = () => {
  return (
    <>
      <Box args={[20.4, 4, 0.2]} position={[0, 2, -7.6]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
      <Box args={[0.2, 4, 15.2]} position={[-10.1, 2, 0]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
      <Box args={[0.2, 4, 15.2]} position={[10.1, 2, 0]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
      <Box args={[7, 4, 0.2]} position={[-6.5, 2, 7.6]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
      <Box args={[7, 4, 0.2]} position={[6.5, 2, 7.6]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
      <Box args={[6, 1, 0.2]} position={[0, 3.5, 7.6]}>
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </Box>
    </>
  );
};

// [threejs기존백업] 입구 컴포넌트
const Entrance = () => {
  return (
    <group position={[0, 0, 7.5]}>
      <Box args={[0.15, 3, 0.3]} position={[-3, 1.5, 0]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[0.15, 3, 0.3]} position={[3, 1.5, 0]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[6.3, 0.2, 0.3]} position={[0, 3.1, 0]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[2.8, 2.8, 0.05]} position={[-1.5, 1.4, 0]}>
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
      </Box>
      <Box args={[2.8, 2.8, 0.05]} position={[1.5, 1.4, 0]}>
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
      </Box>
      <Box args={[5, 0.05, 1.5]} position={[0, 0.025, 0.5]}>
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </Box>
      <Box args={[0.3, 0.1, 0.1]} position={[-2.5, 2.8, 0]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
      </Box>
      <Box args={[0.3, 0.1, 0.1]} position={[2.5, 2.8, 0]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
      </Box>
      <Box args={[4, 0.3, 0.05]} position={[0, 3.4, 0.2]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
      </Box>
    </group>
  );
};

// [threejs기존백업] 계산대 컴포넌트
const CheckoutCounter = () => {
  return (
    <group position={[0, 0, -6]}>
      <Box args={[4, 1.1, 1.5]} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.4} roughness={0.5} />
      </Box>
      <Box args={[4.2, 0.08, 1.7]} position={[0, 1.14, 0]}>
        <meshStandardMaterial color="#1a252f" metalness={0.6} roughness={0.3} />
      </Box>
      <Box args={[0.6, 0.5, 0.08]} position={[-1.2, 1.55, 0.3]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </Box>
      <Box args={[0.55, 0.45, 0.02]} position={[-1.2, 1.55, 0.35]}>
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.3} />
      </Box>
      <Box args={[0.15, 0.3, 0.15]} position={[-1.2, 1.25, 0.3]}>
        <meshStandardMaterial color="#333333" metalness={0.7} />
      </Box>
      <Box args={[0.15, 0.12, 0.25]} position={[-0.3, 1.2, 0.4]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[0.12, 0.08, 0.03]} position={[-0.3, 1.22, 0.55]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </Box>
      <Box args={[0.2, 0.15, 0.3]} position={[0.5, 1.22, 0.4]}>
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[0.15, 0.1, 0.02]} position={[0.5, 1.27, 0.56]}>
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
      </Box>
      <Box args={[0.25, 0.2, 0.25]} position={[1.3, 1.2, 0.3]}>
        <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
      </Box>
      <group position={[0, 2.5, 0]}>
        <Box args={[2, 0.4, 0.1]}>
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </Box>
        <Box args={[0.05, 1, 0.05]} position={[-0.9, -0.7, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.6} />
        </Box>
        <Box args={[0.05, 1, 0.05]} position={[0.9, -0.7, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.6} />
        </Box>
      </group>
      <Box args={[0.6, 0.6, 0.6]} position={[0, 0.3, -1]}>
        <meshStandardMaterial color="#6b7280" roughness={0.7} />
      </Box>
    </group>
  );
};

// [threejs기존백업] 진열대 컴포넌트
const ShelfUnit = ({ position, products }: { position: [number, number, number]; products?: string[] }) => {
  const defaultColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  
  return (
    <group position={position}>
      {[[-1.4, -0.4], [1.4, -0.4], [-1.4, 0.4], [1.4, 0.4]].map(([x, z], i) => (
        <Box key={i} args={[0.08, 2, 0.08]} position={[x, 1, z]}>
          <meshStandardMaterial color="#5d4037" metalness={0.3} roughness={0.7} />
        </Box>
      ))}
      {[0.4, 0.9, 1.4, 1.9].map((y, i) => (
        <Box key={i} args={[3, 0.04, 1]} position={[0, y, 0]}>
          <meshStandardMaterial color="#8d6e63" roughness={0.6} />
        </Box>
      ))}
      <Box args={[3, 2, 0.04]} position={[0, 1, -0.52]}>
        <meshStandardMaterial color="#d7ccc8" />
      </Box>
      {Array.from({ length: 9 }).map((_, i) => (
        <Box 
          key={i} 
          args={[0.25, 0.35, 0.25]} 
          position={[-1 + (i % 3) * 0.5, 0.6 + Math.floor(i / 3) * 0.5, 0.25]}
        >
          <meshStandardMaterial 
            color={defaultColors[i % defaultColors.length]} 
            roughness={0.4}
            metalness={0.1}
          />
        </Box>
      ))}
    </group>
  );
};
*/
// ============================================================
// threejs기존백업 끝
// ============================================================

// ============================================================
// 가구/제품 레이아웃 데이터 (furniture_product_layout.csv 기반)
// ============================================================
const furnitureLayout = [
  // Shelf_벽면진열대
  { file: 'Shelf_벽면진열대1_1.7x2.5x0.5.glb', x: -7.1, y: 3.2, z: 0.0, rotationY: 90 },
  { file: 'Shelf_벽면진열대2_1.7x2.5x0.5.glb', x: -7.1, y: 1.3, z: 0.0, rotationY: 90 },
  { file: 'Shelf_벽면진열대3_1.7x2.5x0.5.glb', x: -7.1, y: -0.6, z: 0.0, rotationY: 90 },
  { file: 'Shelf_벽면진열대4_1.7x2.5x0.5.glb', x: -7.1, y: -3.5, z: 0.0, rotationY: 90 },
  { file: 'Shelf_벽면진열대5_1.7x2.5x0.5.glb', x: -7.1, y: -5.4, z: 0.0, rotationY: 90 },
  { file: 'Shelf_벽면진열대6_1.7x2.5x0.5.glb', x: -4.2, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_벽면진열대7_1.7x2.5x0.5.glb', x: -2.5, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_벽면진열대8_1.7x2.5x0.5.glb', x: -0.6, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_벽면진열대9_1.7x2.5x0.5.glb', x: 7.4, y: -1.6, z: 0.0, rotationY: -90 },
  { file: 'Shelf_벽면진열대10_1.7x2.5x0.5.glb', x: 7.4, y: 0.8, z: 0.0, rotationY: -90 },
  { file: 'Shelf_벽면진열대11_1.7x2.5x0.5.glb', x: 7.4, y: 3.2, z: 0.0, rotationY: -90 },
  { file: 'Shelf_벽면진열대12_1.7x2.5x0.5.glb', x: 6.0, y: 5.0, z: 0.0, rotationY: -180 },
  { file: 'Shelf_벽면진열대13_1.7x2.5x0.5.glb', x: 4.0, y: 5.0, z: 0.0, rotationY: -180 },
  // Shelf_측면진열대
  { file: 'Shelf_측면진열대1_1.2x0.4x0.4.glb', x: -0.8, y: 1.2, z: 0.1, rotationY: 90 },
  { file: 'Shelf_측면진열대2_1.9x0.4x0.4.glb', x: 3.6, y: -1.0, z: 0.1, rotationY: 0 },
  // Mannequin
  { file: 'Mannequin_전신마네킹1_0.7x1.8x0.7.glb', x: -2.4, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_전신마네킹2_0.6x1.8x0.6.glb', x: -1.2, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_상반신마네킹_0.4x1.6x0.4.glb', x: -3.5, y: 5.0, z: 0.0, rotationY: 0 },
  // DisplayTable
  { file: 'DisplayTable_중앙테이블_3.6x1.0x1.3.glb', x: -3.0, y: 1.2, z: 0.0, rotationY: 0 },
  { file: 'DisplayTable_원형테이블_0.3x0.8x0.3.glb', x: -4.2, y: -4.5, z: 0.0, rotationY: 0 },
  // CheckoutCounter
  { file: 'CheckoutCounter_계산대_2.9x1.2x0.7.glb', x: 2.8, y: -4.2, z: 0.0, rotationY: 0 },
  // Rack_의류행거
  { file: 'Rack_의류행거1_1.7x1.5x0.5.glb', x: -1.0, y: -2.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거2_1.7x1.5x0.5.glb', x: -1.0, y: -4.8, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거3_1.7x1.5x0.5.glb', x: -0.2, y: -2.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거4_1.7x1.5x0.5.glb', x: -0.2, y: -4.8, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거5_1.7x1.5x0.5.glb', x: 2.0, y: 1.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거6_1.7x1.5x0.5.glb', x: 2.0, y: 0.0, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거7_1.7x1.5x0.5.glb', x: 5.0, y: 1.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거8_1.7x1.5x0.5.glb', x: 5.0, y: 0.0, z: 0.0, rotationY: -90 },
  // Products
  { file: 'Product_상의A_0.4x0.1x0.4.glb', x: -3.5, y: 0.9, z: 0.9, rotationY: 180 },
  { file: 'Product_하의_0.4x0.1x0.4.glb', x: -2.7, y: 1.5, z: 0.9, rotationY: 0 },
  { file: 'Product_상의B_0.5x0.9x0.1.glb', x: -1.0, y: -2.5, z: 0.6, rotationY: 0 },
  { file: 'Product_하의B_0.4x1.1x0.1.glb', x: 2.0, y: 2.5, z: 0.4, rotationY: 0 },
  { file: 'Product_아우터B_0.5x0.9x0.2.glb', x: 5.0, y: 0.0, z: 0.6, rotationY: 0 },
  { file: 'Product_신발_0.3x0.1x0.3.glb', x: -4.0, y: 1.5, z: 0.9, rotationY: 0 },
  { file: 'Product_가방_0.8x0.5x0.5.glb', x: -7.0, y: 3.2, z: 1.6, rotationY: 90 },
  { file: 'Product_모자_0.2x0.2x0.3.glb', x: -7.1, y: 1.3, z: 1.7, rotationY: 90 },
];

// 개별 GLB 가구/제품 로더
const FurnitureItem = ({ 
  file, 
  x, 
  y, 
  z, 
  rotationY = 0 
}: { 
  file: string; 
  x: number; 
  y: number; 
  z: number; 
  rotationY?: number;
}) => {
  const { scene } = useGLTF(`/models/${file}`);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  return (
    <primitive 
      object={clonedScene} 
      scale={1} 
      position={[x, z, y]} 
      rotation={[0, (rotationY * Math.PI) / 180, 0]}
    />
  );
};

// GLB 매장 모델 로더
const GLBStoreModel = () => {
  const { scene } = useGLTF('/models/store-kolon.glb');
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
};

// 전체 가구/제품 배치
const FurnitureLayout = () => {
  return (
    <>
      {furnitureLayout.map((item, idx) => (
        <FurnitureItem 
          key={`${item.file}-${idx}`}
          file={item.file}
          x={item.x}
          y={item.y}
          z={item.z}
          rotationY={item.rotationY}
        />
      ))}
    </>
  );
};

// 3D 매장 모델
const StoreModel = ({ 
  mode, 
  timeRange = [0, 24],
  showReturning = true,
  showNew = true,
  showHeatmap = false,
  customerPaths = [],
  layoutProducts = [],
  timeOfDay = 14,
  heatmapData = [],
  hotspots = []
}: Store3DViewerProps) => {
  
  // 기본 고객 동선 생성
  const defaultPaths = useMemo(() => {
    const paths: CustomerPath[] = [];
    const pathCount = Math.floor((timeRange[1] - timeRange[0]) / 3);
    
    for (let i = 0; i < pathCount; i++) {
      const isReturning = Math.random() > 0.6;
      const pathType = Math.floor(Math.random() * 4);
      
      let points: [number, number, number][] = [];
      
      // 다양한 동선 패턴
      switch (pathType) {
        case 0: // 직선 통과
          points = [
            [0, 0.5, 7],
            [0, 0.5, 3],
            [-3, 0.5, 0],
            [-5, 0.5, -3],
            [0, 0.5, -5],
          ];
          break;
        case 1: // 좌측 진열대 탐색
          points = [
            [0, 0.5, 7],
            [-3, 0.5, 5],
            [-5, 0.5, 3],
            [-5, 0.5, 0],
            [-5, 0.5, -3],
            [-3, 0.5, -5],
            [0, 0.5, -6],
          ];
          break;
        case 2: // 우측 진열대 탐색
          points = [
            [0, 0.5, 7],
            [3, 0.5, 5],
            [5, 0.5, 3],
            [5, 0.5, 0],
            [5, 0.5, -3],
            [3, 0.5, -5],
            [0, 0.5, -6],
          ];
          break;
        case 3: // 전체 순회
          points = [
            [0, 0.5, 7],
            [-5, 0.5, 5],
            [-5, 0.5, 0],
            [-5, 0.5, -3],
            [0, 0.5, -4],
            [5, 0.5, -3],
            [5, 0.5, 0],
            [5, 0.5, 3],
            [0, 0.5, -6],
          ];
          break;
      }
      
      // 약간의 랜덤 변화 추가
      points = points.map(([x, y, z]) => [
        x + (Math.random() - 0.5) * 2,
        y,
        z + (Math.random() - 0.5) * 1
      ] as [number, number, number]);
      
      paths.push({
        id: `path-${i}`,
        points,
        isReturning,
        dwellTime: Math.random() * 10 + 2
      });
    }
    
    return paths;
  }, [timeRange]);

  const activePaths = customerPaths.length > 0 ? customerPaths : defaultPaths;

  return (
    <>
      {/* GLB 매장 모델 */}
      <GLBStoreModel />
      
      {/* 가구/제품 레이아웃 */}
      <FurnitureLayout />

      {/* Footfall 모드 - 고객 동선 시각화 */}
      {mode === "footfall" && (
        <>
          {/* 고객 동선 라인 */}
          {activePaths.map((path, i) => {
            if ((path.isReturning && !showReturning) || (!path.isReturning && !showNew)) {
              return null;
            }
            return (
              <group key={path.id}>
                <CustomerPathLine 
                  points={path.points} 
                  isReturning={path.isReturning} 
                />
                <AnimatedCustomer 
                  path={path.points} 
                  isReturning={path.isReturning}
                  speed={0.3 + Math.random() * 0.4}
                />
              </group>
            );
          })}

          {/* 히트맵 오버레이 */}
          {showHeatmap && (
            <>
              <Plane args={[6, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.02, 0]}>
                <meshStandardMaterial color="#ef4444" transparent opacity={0.35} emissive="#ef4444" emissiveIntensity={0.2} />
              </Plane>
              <Plane args={[6, 4]} rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.02, 0]}>
                <meshStandardMaterial color="#f97316" transparent opacity={0.3} emissive="#f97316" emissiveIntensity={0.15} />
              </Plane>
              <Plane args={[4, 3]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1]}>
                <meshStandardMaterial color="#eab308" transparent opacity={0.4} emissive="#eab308" emissiveIntensity={0.25} />
              </Plane>
              <Plane args={[5, 2]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5.5]}>
                <meshStandardMaterial color="#ef4444" transparent opacity={0.5} emissive="#ef4444" emissiveIntensity={0.3} />
              </Plane>
            </>
          )}

          {/* 구역 라벨 */}
          <group position={[0, 2.5, 7]}>
            <Box args={[1.5, 0.3, 0.05]}>
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
            </Box>
          </group>
        </>
      )}

      {/* Layout 모드 - 레이아웃 시뮬레이션 */}
      {mode === "layout" && (
        <>
          {/* 사용자가 배치한 제품들 시각화 */}
          {layoutProducts.map((product) => {
            const x3d = (product.x / 100) * 16 - 8;
            const z3d = (product.y / 100) * 12 - 6;
            
            const colorMap: { [key: string]: string } = {
              'bg-primary': '#0EA5E9',
              'bg-blue-500': '#3b82f6',
              'bg-purple-500': '#a855f7',
              'bg-amber-500': '#f59e0b'
            };
            const color = colorMap[product.color] || '#0EA5E9';

            return (
              <group key={product.id} position={[x3d, 0, z3d]}>
                {/* 제품 진열대 */}
                <Box args={[1.8, 1.5, 1.2]} position={[0, 0.75, 0]}>
                  <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={0.25}
                    transparent
                    opacity={0.9}
                  />
                </Box>
                {/* 상단 마커 */}
                <Sphere args={[0.25]} position={[0, 1.8, 0]}>
                  <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={0.7} 
                  />
                </Sphere>
                {/* 바닥 강조 */}
                <Plane args={[2.2, 1.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                  <meshStandardMaterial 
                    color={color} 
                    transparent 
                    opacity={0.3}
                    emissive={color}
                    emissiveIntensity={0.2}
                  />
                </Plane>
              </group>
            );
          })}

          {/* 추천 동선 표시 */}
          <Line
            points={[
              [0, 0.1, 7],
              [0, 0.1, 4],
              [-4, 0.1, 2],
              [-4, 0.1, -2],
              [0, 0.1, -4],
              [4, 0.1, -2],
              [4, 0.1, 2],
              [0, 0.1, -6]
            ]}
            color="#10b981"
            lineWidth={3}
            transparent
            opacity={0.5}
            dashed
            dashScale={1}
          />
        </>
      )}

      {/* Heatmap 모드 - 트래픽 히트맵 */}
      {mode === "heatmap" && (
        <>
          {/* 히트맵 데이터 시각화 */}
          {heatmapData.map((cell, idx) => {
            const x3d = (cell.x - 4.5) * 2;
            const z3d = (cell.y - 4.5) * 1.4;
            const isHotspot = cell.intensity > 0.75;
            
            return (
              <HeatmapCell 
                key={idx}
                x={x3d}
                z={z3d}
                intensity={cell.intensity}
                isHotspot={isHotspot}
              />
            );
          })}

          {/* 핫스팟 마커 */}
          {hotspots.map((spot, idx) => {
            const x3d = (spot.x - 4.5) * 2;
            const z3d = (spot.y - 4.5) * 1.4;
            
            return (
              <group key={`hotspot-${idx}`} position={[x3d, 0, z3d]}>
                <Cylinder args={[0.4, 0.4, spot.intensity * 3, 16]} position={[0, spot.intensity * 1.5, 0]}>
                  <meshStandardMaterial 
                    color="#ef4444" 
                    transparent 
                    opacity={0.7}
                    emissive="#ef4444"
                    emissiveIntensity={0.6}
                  />
                </Cylinder>
              </group>
            );
          })}

          {/* 시간대 인디케이터 */}
          <group position={[-9, 3, -7]}>
            <Sphere args={[0.4]}>
              <meshStandardMaterial 
                color="#f59e0b" 
                emissive="#f59e0b" 
                emissiveIntensity={(timeOfDay / 24) * 0.8 + 0.2}
              />
            </Sphere>
            <Box args={[0.8, 0.2, 0.05]} position={[0, -0.6, 0]}>
              <meshStandardMaterial color="#333" />
            </Box>
          </group>
        </>
      )}
    </>
  );
};

// GLB 파일 프리로드
useGLTF.preload('/models/store-kolon.glb');
furnitureLayout.forEach(item => useGLTF.preload(`/models/${item.file}`));

export const Store3DViewer = (props: Store3DViewerProps) => {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden bg-gradient-to-b from-muted/10 to-muted/30 border border-border/50">
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={50} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={45}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
          />
          
          {/* 조명 */}
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[12, 18, 10]} 
            intensity={0.9} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* 천장 조명 */}
          {[[-6, -4], [-6, 0], [-6, 4], [0, -4], [0, 0], [0, 4], [6, -4], [6, 0], [6, 4]].map(([x, z], i) => (
            <pointLight 
              key={i} 
              position={[x, 3.8, z]} 
              intensity={0.5} 
              distance={8} 
              decay={2} 
              color="#fffaf0" 
            />
          ))}
          
          {/* 진열대 스팟 조명 */}
          <pointLight position={[-6, 2.5, 0]} intensity={0.4} distance={5} color="#ffffff" />
          <pointLight position={[6, 2.5, 0]} intensity={0.4} distance={5} color="#ffffff" />
          
          {/* 입구 조명 */}
          <pointLight position={[0, 2, 7]} intensity={0.6} distance={6} color="#ffffff" />
          
          {/* 계산대 조명 */}
          <pointLight position={[0, 2.5, -6]} intensity={0.5} distance={5} color="#ffffff" />
          
          {/* 3D 매장 모델 */}
          <StoreModel {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
};
