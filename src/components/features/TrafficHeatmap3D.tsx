import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Store3DViewer } from "./Store3DViewer";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

const generateHeatmapData = (timeOfDay: number): HeatmapCell[] => {
  const data: HeatmapCell[] = [];
  const gridSize = 10;

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const entranceBoost = y < 2 ? 0.5 : 0;
      const aisleBoost = x > 3 && x < 6 ? 0.3 : 0;
      const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;
      
      const baseIntensity = Math.random() * 0.3;
      const intensity = Math.min(
        1,
        (baseIntensity + entranceBoost + aisleBoost) * timeMultiplier
      );

      data.push({ x, y, intensity });
    }
  }

  return data;
};

export const TrafficHeatmap3D = () => {
  const [timeOfDay, setTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [heatmapData, setHeatmapData] = useState(() => generateHeatmapData(14));

  const updateHeatmap = (newTime: number) => {
    setTimeOfDay(newTime);
    setHeatmapData(generateHeatmapData(newTime));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    updateHeatmap(14);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev >= 23 ? 9 : prev + 1;
        setHeatmapData(generateHeatmapData(next));
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const maxIntensity = Math.max(...heatmapData.map((d) => d.intensity));
  const avgIntensity = heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length;
  const hotspots = heatmapData.filter((d) => d.intensity > 0.7).length;

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="heatmap"
        timeOfDay={timeOfDay}
        heatmapData={heatmapData}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* 시간 컨트롤 */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">시간대 컨트롤</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {String(timeOfDay).padStart(2, "0")}:00
              </Badge>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handlePlay}>
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Card className="glass p-6">
            <Slider
              min={9}
              max={23}
              step={1}
              value={[timeOfDay]}
              onValueChange={(value) => updateHeatmap(value[0])}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>09:00</span>
              <span>오픈 시간</span>
              <span>23:00</span>
            </div>
          </Card>

          {/* 히트맵 범례 */}
          <Card className="glass p-4">
            <div className="text-sm font-medium mb-3">트래픽 강도</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500/20"></div>
              <span className="text-xs">낮음</span>
              <div className="flex-1 h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"></div>
              <span className="text-xs">높음</span>
              <div className="w-8 h-8 rounded bg-red-500/90"></div>
            </div>
          </Card>
        </div>

        {/* 통계 */}
        <div className="space-y-4">
          <h4 className="font-semibold">실시간 통계</h4>
          <Card className="glass p-6 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">최대 밀집도</div>
              <div className="text-3xl font-bold gradient-text">
                {(maxIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">평균 트래픽</div>
              <div className="text-3xl font-bold gradient-text">
                {(avgIntensity * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">핫스팟 구역</div>
              <div className="text-3xl font-bold gradient-text">{hotspots}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
