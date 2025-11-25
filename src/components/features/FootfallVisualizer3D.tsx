import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Store3DViewer } from "./Store3DViewer";

const generateDemoData = () => {
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push({
      x: Math.random() * 400,
      y: Math.random() * 300,
      time: Math.random() * 24,
      isReturning: Math.random() > 0.6,
      dwell: Math.random() * 10 + 1,
    });
  }
  return points;
};

export const FootfallVisualizer3D = () => {
  const [data] = useState(generateDemoData());
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 24]);
  const [showReturning, setShowReturning] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const filteredData = data.filter(
    (point) =>
      point.time >= timeRange[0] &&
      point.time <= timeRange[1] &&
      ((point.isReturning && showReturning) || (!point.isReturning && showNew))
  );

  const inboundRate = ((filteredData.length / data.length) * 100).toFixed(1);
  const avgDwell = (filteredData.reduce((sum, p) => sum + p.dwell, 0) / filteredData.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="footfall"
        timeRange={timeRange}
        showReturning={showReturning}
        showNew={showNew}
        showHeatmap={showHeatmap}
      />

      {/* 컨트롤 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <Label className="text-sm font-medium mb-4 block">시간 범위: {timeRange[0]}시 - {timeRange[1]}시</Label>
          <Slider
            min={0}
            max={24}
            step={1}
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as [number, number])}
            className="mb-6"
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-visitors-3d">신규 방문자</Label>
              <Switch id="new-visitors-3d" checked={showNew} onCheckedChange={setShowNew} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="returning-visitors-3d">재방문자</Label>
              <Switch id="returning-visitors-3d" checked={showReturning} onCheckedChange={setShowReturning} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-3d">Heatmap 오버레이</Label>
              <Switch id="heatmap-3d" checked={showHeatmap} onCheckedChange={setShowHeatmap} />
            </div>
          </div>
        </Card>

        <Card className="glass p-6 space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Inbound Rate</div>
            <div className="text-3xl font-bold gradient-text">{inboundRate}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Avg Dwell Time</div>
            <div className="text-3xl font-bold gradient-text">{avgDwell} min</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Visitors in Range</div>
            <div className="text-3xl font-bold gradient-text">{filteredData.length}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
