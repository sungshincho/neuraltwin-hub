import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Box, Plane, Sphere } from "@react-three/drei";
import { Suspense } from "react";

interface Store3DViewerProps {
  mode: "footfall" | "layout" | "heatmap";
  // Footfall props
  timeRange?: [number, number];
  showReturning?: boolean;
  showNew?: boolean;
  showHeatmap?: boolean;
  // Layout props
  layoutProducts?: Array<{ id: string; name: string; x: number; y: number; color: string }>;
  // Heatmap props
  timeOfDay?: number;
  heatmapData?: Array<{ x: number; y: number; intensity: number }>;
}

// 3D 매장 모델
const StoreModel = ({ 
  mode, 
  timeRange = [0, 24],
  showReturning = true,
  showNew = true,
  showHeatmap = false,
  layoutProducts = [],
  timeOfDay = 14,
  heatmapData = []
}: Store3DViewerProps) => {
  return (
    <>
      {/* 바닥 - 타일 패턴 */}
      <Plane 
        args={[20, 15]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color="#f8f9fa" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>
      
      {/* 바닥 그리드 라인 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Box key={`grid-x-${i}`} args={[0.02, 0.01, 15]} position={[-10 + i, 0.005, 0]}>
          <meshStandardMaterial color="#e9ecef" transparent opacity={0.3} />
        </Box>
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <Box key={`grid-z-${i}`} args={[20, 0.01, 0.02]} position={[0, 0.005, -7.5 + i]}>
          <meshStandardMaterial color="#e9ecef" transparent opacity={0.3} />
        </Box>
      ))}

      {/* 벽들 */}
      <Box args={[20, 4, 0.3]} position={[0, 2, -7.5]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Box>
      <Box args={[20, 4, 0.3]} position={[0, 2, 7.5]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Box>
      <Box args={[0.3, 4, 15]} position={[-10, 2, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Box>
      <Box args={[0.3, 4, 15]} position={[10, 2, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Box>

      {/* 천장 조명 */}
      <Box args={[1.5, 0.1, 1.5]} position={[-5, 3.9, -3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>
      <Box args={[1.5, 0.1, 1.5]} position={[0, 3.9, -3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>
      <Box args={[1.5, 0.1, 1.5]} position={[5, 3.9, -3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>
      <Box args={[1.5, 0.1, 1.5]} position={[-5, 3.9, 3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>
      <Box args={[1.5, 0.1, 1.5]} position={[0, 3.9, 3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>
      <Box args={[1.5, 0.1, 1.5]} position={[5, 3.9, 3]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffeb3b" emissiveIntensity={0.5} />
      </Box>

      {/* 입구 프레임 */}
      <Box args={[3, 3, 0.2]} position={[0, 1.5, 7.4]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.4} />
      </Box>
      <Box args={[3.5, 0.3, 0.3]} position={[0, 3.2, 7.4]}>
        <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.4} />
      </Box>

      {/* 왼쪽 진열대 - 선반 구조 */}
      {[-3, 0, 3].map((z, idx) => (
        <group key={`left-shelf-${idx}`} position={[-5, 0, z]}>
          {/* 기둥 */}
          <Box args={[0.1, 1.8, 0.1]} position={[-1.4, 0.9, -0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[1.4, 0.9, -0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[-1.4, 0.9, 0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[1.4, 0.9, 0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          {/* 선반들 */}
          <Box args={[3, 0.05, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          <Box args={[3, 0.05, 1]} position={[0, 1, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          <Box args={[3, 0.05, 1]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          {/* 백판 */}
          <Box args={[3, 1.8, 0.05]} position={[0, 0.9, -0.5]}>
            <meshStandardMaterial color="#a1887f" />
          </Box>
          {/* 상품들 */}
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={`product-${i}`} args={[0.3, 0.4, 0.3]} position={[-1.2 + (i % 3) * 0.6, 0.7 + Math.floor(i / 3) * 0.5, 0.3]}>
              <meshStandardMaterial 
                color={['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'][i]} 
                roughness={0.3}
                metalness={0.1}
              />
            </Box>
          ))}
        </group>
      ))}

      {/* 오른쪽 진열대 */}
      {[-3, 0, 3].map((z, idx) => (
        <group key={`right-shelf-${idx}`} position={[5, 0, z]}>
          <Box args={[0.1, 1.8, 0.1]} position={[-1.4, 0.9, -0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[1.4, 0.9, -0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[-1.4, 0.9, 0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[0.1, 1.8, 0.1]} position={[1.4, 0.9, 0.4]}>
            <meshStandardMaterial color="#5d4037" metalness={0.2} roughness={0.8} />
          </Box>
          <Box args={[3, 0.05, 1]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          <Box args={[3, 0.05, 1]} position={[0, 1, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          <Box args={[3, 0.05, 1]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </Box>
          <Box args={[3, 1.8, 0.05]} position={[0, 0.9, -0.5]}>
            <meshStandardMaterial color="#a1887f" />
          </Box>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={`product-${i}`} args={[0.3, 0.4, 0.3]} position={[-1.2 + (i % 3) * 0.6, 0.7 + Math.floor(i / 3) * 0.5, 0.3]}>
              <meshStandardMaterial 
                color={['#e67e22', '#16a085', '#8e44ad', '#c0392b', '#27ae60', '#2980b9'][i]} 
                roughness={0.3}
                metalness={0.1}
              />
            </Box>
          ))}
        </group>
      ))}

      {/* 계산대 - 더 현실적으로 */}
      <group position={[0, 0, -6]}>
        {/* 카운터 베이스 */}
        <Box args={[2.5, 1, 1.2]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#34495e" metalness={0.3} roughness={0.6} />
        </Box>
        {/* 카운터 상판 */}
        <Box args={[2.5, 0.1, 1.2]} position={[0, 1.05, 0]}>
          <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.4} />
        </Box>
        {/* POS 시스템 */}
        <Box args={[0.4, 0.3, 0.3]} position={[-0.5, 1.25, 0]}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </Box>
        {/* 스캐너 */}
        <Box args={[0.2, 0.15, 0.2]} position={[0.3, 1.18, 0.2]}>
          <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.3} />
        </Box>
        {/* 직원 의자 */}
        <Box args={[0.5, 0.5, 0.5]} position={[0, 0.3, -0.8]}>
          <meshStandardMaterial color="#7f8c8d" />
        </Box>
        <Box args={[0.1, 0.4, 0.1]} position={[0, 0.7, -0.8]}>
          <meshStandardMaterial color="#95a5a6" metalness={0.6} />
        </Box>
      </group>

      {/* 쇼핑 카트 */}
      <Box args={[0.4, 0.6, 0.6]} position={[8, 0.3, 6]}>
        <meshStandardMaterial color="#c0392b" metalness={0.5} roughness={0.5} />
      </Box>
      <Box args={[0.4, 0.6, 0.6]} position={[8.5, 0.3, 6]}>
        <meshStandardMaterial color="#c0392b" metalness={0.5} roughness={0.5} />
      </Box>

      {/* Footfall 시각화 - 고객 동선 표시 */}
      {mode === "footfall" && (
        <>
          {/* 입구 */}
          <Box args={[0.5, 2, 0.5]} position={[0, 1, 7]}>
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </Box>
          
          {/* 시간대에 따른 고객 수 조절 */}
          {showNew && Array.from({ length: Math.floor((timeRange[1] - timeRange[0]) / 4) }).map((_, i) => (
            <Sphere key={`new-${i}`} args={[0.3]} position={[
              (Math.random() - 0.5) * 16,
              0.9,
              (Math.random() - 0.5) * 12
            ]}>
              <meshStandardMaterial 
                color="#3b82f6" 
                emissive="#3b82f6" 
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </Sphere>
          ))}

          {showReturning && Array.from({ length: Math.floor((timeRange[1] - timeRange[0]) / 6) }).map((_, i) => (
            <Sphere key={`returning-${i}`} args={[0.3]} position={[
              (Math.random() - 0.5) * 16,
              0.9,
              (Math.random() - 0.5) * 12
            ]}>
              <meshStandardMaterial 
                color="#8b5cf6" 
                emissive="#8b5cf6" 
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </Sphere>
          ))}

          {/* 히트맵 오버레이 */}
          {showHeatmap && (
            <>
              <Plane args={[8, 6]} rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.02, -2]}>
                <meshStandardMaterial color="#ef4444" transparent opacity={0.4} />
              </Plane>
              <Plane args={[6, 5]} rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.02, 2]}>
                <meshStandardMaterial color="#f59e0b" transparent opacity={0.3} />
              </Plane>
            </>
          )}
        </>
      )}

      {/* Layout A/B - 레이아웃 변경 시뮬레이션 */}
      {mode === "layout" && (
        <>
          {/* 기본 진열대들 */}
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, -3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, 0]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, 3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>

          {/* 사용자가 배치한 제품들 시각화 */}
          {layoutProducts.map((product) => {
            // 2D 좌표(0-100%)를 3D 좌표(-8 ~ 8, -5 ~ 5)로 변환
            const x3d = (product.x / 100) * 16 - 8;
            const z3d = (product.y / 100) * 10 - 5;
            
            // 색상 변환
            const colorMap: { [key: string]: string } = {
              'bg-primary': '#0EA5E9',
              'bg-blue-500': '#3b82f6',
              'bg-purple-500': '#a855f7',
              'bg-amber-500': '#f59e0b'
            };
            const color = colorMap[product.color] || '#0EA5E9';

            return (
              <group key={product.id} position={[x3d, 1.2, z3d]}>
                <Box args={[1.5, 1.5, 1]}>
                  <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={0.3}
                  />
                </Box>
                {/* 제품 라벨 */}
                <Sphere args={[0.3]} position={[0, 1.2, 0]}>
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
                </Sphere>
              </group>
            );
          })}

          {/* 동선 화살표 표시 */}
          <Box args={[0.3, 0.3, 4]} position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} transparent opacity={0.6} />
          </Box>
        </>
      )}

      {/* Traffic Heatmap - 히트맵 오버레이 */}
      {mode === "heatmap" && (
        <>
          {/* 진열대들 */}
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, -3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, 0]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[-5, 0.75, 3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[5, 0.75, -3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[5, 0.75, 0]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>
          <Box args={[3, 1.5, 1]} position={[5, 0.75, 3]}>
            <meshStandardMaterial color="#8b7355" />
          </Box>

          {/* 히트맵 데이터 시각화 */}
          {heatmapData.map((cell, idx) => {
            // 10x10 그리드를 3D 공간에 매핑
            const x3d = (cell.x - 4.5) * 2;
            const z3d = (cell.y - 4.5) * 1.5;
            
            // 강도에 따른 색상
            const getColor = (intensity: number) => {
              if (intensity < 0.2) return '#3b82f6';
              if (intensity < 0.4) return '#06b6d4';
              if (intensity < 0.6) return '#eab308';
              if (intensity < 0.8) return '#f97316';
              return '#ef4444';
            };

            return (
              <Plane 
                key={idx}
                args={[1.8, 1.3]} 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[x3d, 0.02, z3d]}
              >
                <meshStandardMaterial 
                  color={getColor(cell.intensity)} 
                  transparent 
                  opacity={cell.intensity * 0.7}
                  emissive={getColor(cell.intensity)}
                  emissiveIntensity={cell.intensity * 0.3}
                />
              </Plane>
            );
          })}

          {/* 시간대 표시 구 */}
          <Sphere args={[0.5]} position={[-8, 2.5, -6]}>
            <meshStandardMaterial 
              color="#0EA5E9" 
              emissive="#0EA5E9" 
              emissiveIntensity={(timeOfDay / 24) * 0.8}
            />
          </Sphere>
        </>
      )}
    </>
  );
};

export const Store3DViewer = (props: Store3DViewerProps) => {
  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-b from-muted/20 to-muted/40">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.2}
          />
          
          {/* 조명 - 더 현실적인 매장 조명 */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 15, 8]} 
            intensity={0.8} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          {/* 천장 조명들 */}
          <pointLight position={[-5, 3.5, -3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          <pointLight position={[0, 3.5, -3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          <pointLight position={[5, 3.5, -3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          <pointLight position={[-5, 3.5, 3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          <pointLight position={[0, 3.5, 3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          <pointLight position={[5, 3.5, 3]} intensity={0.6} distance={8} decay={2} color="#fff8dc" />
          {/* 진열대 조명 */}
          <pointLight position={[-5, 2.5, 0]} intensity={0.4} distance={6} decay={2} color="#ffffff" />
          <pointLight position={[5, 2.5, 0]} intensity={0.4} distance={6} decay={2} color="#ffffff" />
          
          {/* 3D 매장 모델 */}
          <StoreModel {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
};
