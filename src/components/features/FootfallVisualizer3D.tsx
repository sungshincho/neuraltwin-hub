import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Users, Clock, TrendingUp, MapPin } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";

interface CustomerPath {
  id: string;
  points: [number, number, number][];
  isReturning: boolean;
  dwellTime: number;
}

const generateDemoData = (timeRange: [number, number]) => {
  const pathCount = Math.floor((timeRange[1] - timeRange[0]) / 2);
  const paths: CustomerPath[] = [];
  
  for (let i = 0; i < pathCount; i++) {
    const isReturning = Math.random() > 0.6;
    const pathType = Math.floor(Math.random() * 5);
    
    let points: [number, number, number][] = [];
    
    switch (pathType) {
      case 0: // 입구 → 좌측 진열대 → 계산대
        points = [
          [-13, 0, -6],
          [-15, 0.5, -8],
          [-18, 0.5, -10],
          [-18, 0.5, -13],
          [-18, 0.5, -15],
          [-16, 0.5, -17],
          [-13, 0.5, -18.5],
        ];
        break;
      case 1: // 입구 → 우측 진열대 → 계산대
        points = [
          [-13, 0.5, -6],
          [-11, 0.5, -8],
          [-8, 0.5, -10],
          [-8, 0.5, -13],
          [-8, 0.5, -15],
          [-10, 0.5, -17],
          [-13, 0.5, -18.5],
        ];
        break;
      case 2: // 전체 순회
        points = [
          [-13, 0.5, -14],
          [-17, 0.5, -12],
          [-18, 0.5, -11],
          [-18, 0.5, -14],
          [-16, 0.5, -16],
          [-13, 0.5, -15],
          [-10, 0.5, -16],
          [-12, 0.5, -14],
          [-12, 0.5, -11],
          [-9, 0.5, -8],
          [-13, 0.5, -18.5],
        ];
        break;
      case 3: // 중앙 디스플레이 방문
        points = [
          [-13, 0.5, -14],
          [-13, 0.5, -9],
          [-14, 0.5, -12],
          [-12, 0.5, -12],
          [-13, 0.5, -15],
          [-13, 0.5, -18.5],
        ];
        break;
      case 4: // 빠른 통과 (구매 안함)
        points = [
          [-13, 0.5, -14],
          [-15, 0.5, -10],
          [-16, 0.5, -13],
          [-15, 0.5, -16],
          [-13, 0.5, -14],
        ];
        break;
    }
    
    // 약간의 랜덤 변화
    points = points.map(([x, y, z]) => [
      x + (Math.random() - 0.5) * 1.5,
      y,
      z + (Math.random() - 0.5) * 0.8
    ] as [number, number, number]);
    
    paths.push({
      id: `customer-${i}`,
      points,
      isReturning,
      dwellTime: pathType === 4 ? Math.random() * 2 + 0.5 : Math.random() * 12 + 3
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
