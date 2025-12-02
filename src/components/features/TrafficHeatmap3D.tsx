import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Flame, Clock, TrendingUp, Target } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

interface Hotspot {
  x: number;
  y: number;
  intensity: number;
  zone: string;
}

const allowedHeatmapPositions: [number, number][] = [
  // z = 5
  [-6, 5], [-5, 5], [-4, 5], [-3, 5], [-2, 5], [2, 5],

  // z = 4
  [-6, 4], [-5, 4], [-4, 4], [-3, 4], [-2, 4], [-1, 4],
  [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],

  // z = 3
  [-6, 3], [-5, 3], [-4, 3], [-3, 3], [-2, 3], [-1, 3],
  [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],

  // z = 2
  [-6, 2], [-5, 2], [-4, 2], [-3, 2], [-2, 2], [-1, 2],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],

  // z = 1
  [-6, 1], [-5, 1], [-4, 1], [-3, 1], [-2, 1], [-1, 1],
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],

  // z = 0
  [-6, 0], [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0],
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],

  // z = -1
  [-6, -1], [-5, -1], [-4, -1], [-3, -1], [-2, -1], [-1, -1],
  [0, -1], [1, -1], [2, -1], [3, -1], [4, -1], [5, -1], [6, -1],

  // z = -2
  [-6, -2], [-5, -2], [-4, -2], [-3, -2], [-2, -2], [-1, -2],
  [0, -2], [1, -2], [2, -2], [3, -2], [4, -2], [5, -2], [6, -2],

  // z = -3
  [-6, -3], [-5, -3], [-4, -3], [-3, -3], [-2, -3], [-1, -3],
  [0, -3], [1, -3], [2, -3], [3, -3], [4, -3], [5, -3], [6, -3],

  // z = -4
  [-6, -4], [-5, -4], [-4, -4], [-3, -4], [-2, -4], [-1, -4],
  [0, -4], [1, -4], [2, -4], [3, -4], [4, -4], [5, -4], [6, -4],

  // z = -5
  [-6, -5], [-5, -5], [-4, -5], [-3, -5], [-2, -5], [-1, -5],
  [0, -5], [1, -5], [2, -5], [3, -5], [4, -5], [5, -5], [6, -5],

  // z = -6
  [-6, -6], [-5, -6], [-4, -6], [-3, -6], [-2, -6], [-1, -6],
  [0, -6], [1, -6], [2, -6], [3, -6], [4, -6], [5, -6], [6, -6],

  // z = -7
  [-6, -7], [-5, -7], [-4, -7], [-3, -7], [-2, -7], [-1, -7],
  [0, -7], [1, -7], [2, -7], [3, -7], [4, -7], [5, -7], [6, -7],
];


const generateHeatmapData = (timeOfDay: number): HeatmapCell[] => {
  const data: HeatmapCell[] = [];

  // 시간대별 패턴
  const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;
  const isPeakHour = (timeOfDay >= 12 && timeOfDay <= 14) || (timeOfDay >= 18 && timeOfDay <= 20);
  const peakBonus = isPeakHour ? 0.25 : 0;

  // allowedHeatmapPositions에 정의된 좌표에만 히트맵 생성
  allowedHeatmapPositions.forEach(([x, z]) => {
    // 구역별 기본 강도
    let zoneIntensity = 0;
    
    // 입구 영역 (z = 5)
    if (z === 5) {
      zoneIntensity = 0.6;
    }
    // 계산대 영역 (z < -6, x 중앙)
    else if (z < -6 && x >= -2 && x <= 2) {
      zoneIntensity = 0.8;
    }
    // 좌측 진열대 (x < -4)
    else if (x < -4) {
      zoneIntensity = 0.5;
    }
    // 우측 진열대 (x > 4)
    else if (x > 4) {
      zoneIntensity = 0.45;
    }
    // 중앙 디스플레이 (중앙, z 1-4)
    else if (x >= -2 && x <= 2 && z >= 1 && z <= 4) {
      zoneIntensity = 0.7;
    }
    // 기타 통로
    else {
      zoneIntensity = 0.3;
    }

    const randomVariation = (Math.random() - 0.5) * 0.2;
    const intensity = Math.min(
      1,
      Math.max(0.15, (zoneIntensity + randomVariation + peakBonus) * timeMultiplier)
    );

    data.push({ x, y: z, intensity });
  });

  return data;
};

const detectHotspots = (heatmapData: HeatmapCell[]): Hotspot[] => {
  const hotspots: Hotspot[] = [];
  const threshold = 0.65;
  
  const highIntensityCells = heatmapData.filter(cell => cell.intensity > threshold);
  
  // 그룹화된 핫스팟 찾기
  const visited = new Set<string>();
  
  highIntensityCells.forEach(cell => {
    const key = `${cell.x}-${cell.y}`;
    if (visited.has(key)) return;
    
    visited.add(key);
    
    // 구역 이름 결정
    let zone = "일반 통로";
    if (cell.y > 7) zone = "입구 영역";
    else if (cell.y < 2 && cell.x > 3 && cell.x < 7) zone = "계산대";
    else if (cell.x < 3) zone = "좌측 진열대";
    else if (cell.x > 6) zone = "우측 진열대";
    else if (cell.x >= 4 && cell.x <= 6 && cell.y >= 4 && cell.y <= 6) zone = "중앙 디스플레이";
    
    hotspots.push({
      x: cell.x,
      y: cell.y,
      intensity: cell.intensity,
      zone
    });
  });
  
  // 상위 5개만 반환
  return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5);
};

export const TrafficHeatmap3D = () => {
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showRealtime, setShowRealtime] = useState(true);
  
  const heatmapData = useMemo(() => generateHeatmapData(timeOfDay), [timeOfDay]);
  const hotspots = useMemo(() => detectHotspots(heatmapData), [heatmapData]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev >= 23 ? 9 : prev + 1;
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    setTimeOfDay(14);
  };

  // 통계 계산
  const maxIntensity = Math.max(...heatmapData.map((d) => d.intensity));
  const avgIntensity = heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length;
  const hotspotCount = heatmapData.filter((d) => d.intensity > 0.65).length;
  const totalTraffic = Math.floor(avgIntensity * 450);

  // 시간대 분류
  const getTimeCategory = (hour: number) => {
    if (hour >= 9 && hour < 12) return { label: "오전", status: "보통" };
    if (hour >= 12 && hour < 14) return { label: "점심", status: "피크" };
    if (hour >= 14 && hour < 18) return { label: "오후", status: "보통" };
    if (hour >= 18 && hour < 21) return { label: "저녁", status: "피크" };
    return { label: "야간", status: "한산" };
  };
  
  const timeCategory = getTimeCategory(timeOfDay);

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="heatmap"
        timeOfDay={timeOfDay}
        heatmapData={heatmapData}
        hotspots={showHotspots ? hotspots : []}
        allowedHeatmapPositions={allowedHeatmapPositions}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* 시간 컨트롤 */}
        <Card className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              시간대 분석
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant={timeCategory.status === "피크" ? "destructive" : "secondary"}>
                {timeCategory.label} - {timeCategory.status}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">현재 시간</span>
              <span className="text-lg font-bold">{String(timeOfDay).padStart(2, "0")}:00</span>
            </div>
            <Slider
              min={9}
              max={23}
              step={1}
              value={[timeOfDay]}
              onValueChange={(value) => setTimeOfDay(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>09:00 오픈</span>
              <span>23:00 마감</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button size="sm" onClick={() => setIsPlaying(!isPlaying)} className="flex-1">
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  시뮬레이션
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 옵션 & 범례 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            표시 옵션
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-hotspots" className="flex items-center gap-2">
                <Flame className="w-3 h-3 text-red-500" />
                핫스팟 표시
              </Label>
              <Switch 
                id="show-hotspots" 
                checked={showHotspots} 
                onCheckedChange={setShowHotspots} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-realtime" className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                실시간 업데이트
              </Label>
              <Switch 
                id="show-realtime" 
                checked={showRealtime} 
                onCheckedChange={setShowRealtime} 
              />
            </div>
          </div>
          
          {/* 히트맵 범례 */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="text-sm font-medium">트래픽 강도</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500/60" />
              <span className="text-xs flex-1">낮음</span>
              <div className="flex-[3] h-3 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full" />
              <span className="text-xs flex-1 text-right">높음</span>
              <div className="w-6 h-6 rounded bg-red-500/80" />
            </div>
          </div>
        </Card>

        {/* 실시간 통계 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            실시간 통계
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">최대 밀집도</div>
              <div className="text-2xl font-bold gradient-text">
                {(maxIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">평균 트래픽</div>
              <div className="text-2xl font-bold gradient-text">
                {(avgIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">핫스팟 구역</div>
              <div className="text-2xl font-bold gradient-text">{hotspotCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">예상 방문자</div>
              <div className="text-2xl font-bold gradient-text">{totalTraffic}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 핫스팟 상세 */}
      {showHotspots && hotspots.length > 0 && (
        <Card className="glass p-6">
          <h4 className="font-semibold flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-red-500" />
            감지된 핫스팟 ({hotspots.length}개)
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {hotspots.map((spot, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${(1 - spot.intensity) * 60}, 100%, 50%)` 
                    }}
                  />
                  <span className="text-xs font-medium">{spot.zone}</span>
                </div>
                <div className="text-lg font-bold">
                  {(spot.intensity * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  밀집도
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
