import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Users, Clock, TrendingUp, MapPin } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";
import { 
  buildObstacles, 
  generateRandomPath, 
  generateBrowseOnlyPath,
  type FurnitureItem,
  type Obstacle
} from "@/lib/pathfinding";

interface CustomerPath {
  id: string;
  points: [number, number, number][];
  isReturning: boolean;
  dwellTime: number;
}

// Furniture layout data (same as Store3DViewer)
const furnitureLayout: FurnitureItem[] = [
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
  { file: 'Shelf_측면진열대1_1.2x0.4x0.4.glb', x: -0.8, y: 1.2, z: 0.1, rotationY: 90 },
  { file: 'Shelf_측면진열대2_1.9x0.4x0.4.glb', x: 3.6, y: -1.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_전신마네킹1_0.7x1.8x0.7.glb', x: -2.4, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_전신마네킹2_0.6x1.8x0.6.glb', x: -1.2, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_상반신마네킹_0.4x1.6x0.4.glb', x: -3.5, y: 5.0, z: 0.0, rotationY: 0 },
  { file: 'DisplayTable_중앙테이블_3.6x1.0x1.3.glb', x: -3.0, y: 1.2, z: 0.0, rotationY: 0 },
  { file: 'DisplayTable_원형테이블_0.3x0.8x0.3.glb', x: -4.2, y: -4.5, z: 0.0, rotationY: 0 },
  { file: 'CheckoutCounter_계산대_2.9x1.2x0.7.glb', x: 2.8, y: -4.2, z: 0.0, rotationY: 0 },
  { file: 'Rack_의류행거1_1.7x1.5x0.5.glb', x: -1.0, y: -2.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거2_1.7x1.5x0.5.glb', x: -1.0, y: -4.8, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거3_1.7x1.5x0.5.glb', x: -0.2, y: -2.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거4_1.7x1.5x0.5.glb', x: -0.2, y: -4.8, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거5_1.7x1.5x0.5.glb', x: 2.0, y: 1.9, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거6_1.7x1.5x0.5.glb', x: 2.0, y: 0.0, z: 0.0, rotationY: -90 },
  { file: 'Rack_의류행거7_1.7x1.5x0.5.glb', x: 5.0, y: 1.9, z: 0.0, rotationY: -90 },
];

// Build obstacles once
const obstacles: Obstacle[] = buildObstacles(furnitureLayout);

const generateDemoData = (timeRange: [number, number]): CustomerPath[] => {
  const pathCount = Math.max(1, Math.floor((timeRange[1] - timeRange[0]) / 2));
  const paths: CustomerPath[] = [];
  
  for (let i = 0; i < pathCount; i++) {
    const isReturning = Math.random() > 0.6;
    const isBrowseOnly = Math.random() > 0.7; // 30% just browse and leave
    
    // Generate furniture-aware path
    const points = isBrowseOnly 
      ? generateBrowseOnlyPath(obstacles)
      : generateRandomPath(obstacles);
    
    const dwellTime = isBrowseOnly 
      ? Math.random() * 2 + 0.5  // Quick visit: 0.5-2.5 min
      : Math.random() * 12 + 3;  // Normal visit: 3-15 min
    
    paths.push({
      id: `customer-${i}`,
      points,
      isReturning,
      dwellTime,
    });
  }
  
  return paths;
};

export const FootfallVisualizer3D = () => {
  const [timeRange, setTimeRange] = useState<[number, number]>([9, 21]);
  const [showReturning, setShowReturning] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentHour, setCurrentHour] = useState(9);
  
  const customerPaths = useMemo(() => generateDemoData(timeRange), [timeRange]);
  
  // 시간 재생 효과
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentHour((prev) => {
        if (prev >= timeRange[1]) {
          setIsPlaying(false);
          return timeRange[0];
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, timeRange]);

  // 통계 계산
  const filteredPaths = customerPaths.filter(
    (path) =>
      ((path.isReturning && showReturning) || (!path.isReturning && showNew))
  );
  
  const totalVisitors = filteredPaths.length;
  const newVisitors = filteredPaths.filter(p => !p.isReturning).length;
  const returningVisitors = filteredPaths.filter(p => p.isReturning).length;
  const avgDwellTime = filteredPaths.length > 0 
    ? (filteredPaths.reduce((sum, p) => sum + p.dwellTime, 0) / filteredPaths.length).toFixed(1)
    : '0';
  const conversionRate = ((filteredPaths.filter(p => p.dwellTime > 5).length / Math.max(filteredPaths.length, 1)) * 100).toFixed(1);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentHour(timeRange[0]);
  };

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="footfall"
        timeRange={[timeRange[0], currentHour]}
        showReturning={showReturning}
        showNew={showNew}
        showHeatmap={showHeatmap}
        customerPaths={filteredPaths}
      />

      {/* 컨트롤 패널 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 시간 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              시간 범위
            </h4>
            <Badge variant="secondary">
              {String(currentHour).padStart(2, "0")}:00
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              영업 시간: {timeRange[0]}시 - {timeRange[1]}시
            </Label>
            <Slider
              min={6}
              max={24}
              step={1}
              value={timeRange}
              onValueChange={(value) => {
                setTimeRange(value as [number, number]);
                setCurrentHour(value[0]);
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 필터 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            방문자 필터
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <Label htmlFor="new-visitors">신규 방문자</Label>
              </div>
              <Switch 
                id="new-visitors" 
                checked={showNew} 
                onCheckedChange={setShowNew} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <Label htmlFor="returning-visitors">재방문자</Label>
              </div>
              <Switch 
                id="returning-visitors" 
                checked={showReturning} 
                onCheckedChange={setShowReturning} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-red-500" />
                <Label htmlFor="heatmap-overlay">히트맵 오버레이</Label>
              </div>
              <Switch 
                id="heatmap-overlay" 
                checked={showHeatmap} 
                onCheckedChange={setShowHeatmap} 
              />
            </div>
          </div>
        </Card>

        {/* 통계 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            실시간 통계
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">총 방문자</div>
              <div className="text-2xl font-bold gradient-text">{totalVisitors}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">전환율</div>
              <div className="text-2xl font-bold gradient-text">{conversionRate}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">평균 체류</div>
              <div className="text-2xl font-bold gradient-text">{avgDwellTime}분</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">재방문율</div>
              <div className="text-2xl font-bold gradient-text">
                {totalVisitors > 0 ? ((returningVisitors / totalVisitors) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="flex-1 justify-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
              신규 {newVisitors}
            </Badge>
            <Badge variant="outline" className="flex-1 justify-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-1" />
              재방문 {returningVisitors}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
