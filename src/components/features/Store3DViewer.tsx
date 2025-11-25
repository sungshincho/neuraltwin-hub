import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Card } from "@/components/ui/card";
import * as THREE from "three";

interface Store3DViewerProps {
  mode?: "footfall" | "layout" | "heatmap";
  timeRange?: [number, number];
  showReturning?: boolean;
  showNew?: boolean;
  showHeatmap?: boolean;
}

function StoreFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#1a1a2e" opacity={0.8} transparent />
    </mesh>
  );
}

function FootfallPoints({ showReturning = true, showNew = true }: { showReturning?: boolean; showNew?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const points = Array.from({ length: 20 }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 8,
      0.5,
      (Math.random() - 0.5) * 8,
    ] as [number, number, number],
    isReturning: Math.random() > 0.5,
  }));

  return (
    <group ref={groupRef}>
      {points.map((point, i) => {
        const show = (point.isReturning && showReturning) || (!point.isReturning && showNew);
        if (!show) return null;
        
        return (
          <mesh key={i} position={point.position}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial 
              color={point.isReturning ? "#8b5cf6" : "#06b6d4"} 
              emissive={point.isReturning ? "#8b5cf6" : "#06b6d4"}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function LayoutObjects() {
  return (
    <>
      {/* 진열대 */}
      <mesh position={[-3, 1, 0]}>
        <boxGeometry args={[1.5, 2, 4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[3, 1, 0]}>
        <boxGeometry args={[1.5, 2, 4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {/* 계산대 */}
      <mesh position={[0, 0.75, -4]}>
        <boxGeometry args={[2, 1.5, 1]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </>
  );
}

function HeatmapOverlay({ show = false }: { show?: boolean }) {
  if (!show) return null;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial 
        color="#8b5cf6" 
        opacity={0.2} 
        transparent 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export const Store3DViewer = ({ 
  mode = "footfall", 
  showReturning = true, 
  showNew = true,
  showHeatmap = false 
}: Store3DViewerProps) => {
  return (
    <Card className="glass p-6 h-96">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={20}
        />
        
        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* 매장 요소 */}
        <StoreFloor />
        <LayoutObjects />
        
        {mode === "footfall" && (
          <FootfallPoints showReturning={showReturning} showNew={showNew} />
        )}
        
        <HeatmapOverlay show={showHeatmap} />
        
        {/* 그리드 헬퍼 */}
        <gridHelper args={[10, 10, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />
      </Canvas>
    </Card>
  );
};
