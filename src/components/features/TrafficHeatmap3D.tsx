import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Flame, Clock, TrendingUp, Target } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";

// ========================================
// 수동 히트맵 좌표 입력 (이곳에 좌표를 추가하세요)
// ========================================
// 형식: [x, z] - 반경 0.5, 높이 0.5인 plane이 생성됩니다
const MANUAL_HEATMAP_POSITIONS: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [-1, 0],
  [-2, 0],
  [0, 1],
  [0, 2],
  [0, -1],
  [0, -2],
];

export const TrafficHeatmap3D = () => {
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);

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
  const totalPositions = MANUAL_HEATMAP_POSITIONS.length;
  const totalTraffic = Math.floor(totalPositions * 50);

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
        manualHeatmapPositions={MANUAL_HEATMAP_POSITIONS}
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

        {/* 히트맵 정보 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            히트맵 정보
          </h4>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              표시된 위치 수
            </div>
            <div className="text-3xl font-bold gradient-text">
              {totalPositions}개
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              좌표 추가는 TrafficHeatmap3D.tsx 파일의 <br/>
              MANUAL_HEATMAP_POSITIONS 배열에서 수정하세요
            </div>
          </div>
        </Card>

        {/* 통계 */}
        <Card className="glass p-6 space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            통계
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">예상 방문자</div>
              <div className="text-2xl font-bold gradient-text">{totalTraffic}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
