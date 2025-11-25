import { Card } from "@/components/ui/card";
import { Store3DViewer } from "./Store3DViewer";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, TrendingUp } from "lucide-react";

const heatZones = [
  { name: "입구", heat: 95, color: "red" },
  { name: "신상품 코너", heat: 88, color: "orange" },
  { name: "계산대", heat: 92, color: "red" },
  { name: "피팅룸", heat: 72, color: "yellow" },
  { name: "할인 코너", heat: 45, color: "blue" },
];

export const TrafficHeatmap3D = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">3D 히트맵 분석</h4>
        <Badge variant="secondary">실시간 데이터</Badge>
      </div>

      <Store3DViewer mode="heatmap" showHeatmap={true} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6 space-y-4">
          <h5 className="text-sm font-semibold">구역별 트래픽</h5>
          <div className="space-y-3">
            {heatZones.map((zone) => (
              <div key={zone.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{zone.name}</span>
                  <div className="flex items-center gap-2">
                    {zone.heat > 80 ? (
                      <Flame className="w-4 h-4 text-red-500" />
                    ) : zone.heat < 50 ? (
                      <Snowflake className="w-4 h-4 text-blue-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-muted-foreground">{zone.heat}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${zone.heat}%`,
                      backgroundColor:
                        zone.heat > 80
                          ? "hsl(0, 84%, 60%)"
                          : zone.heat < 50
                          ? "hsl(217, 91%, 60%)"
                          : "hsl(38, 92%, 50%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6 space-y-4">
          <h5 className="text-sm font-semibold">주요 인사이트</h5>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5" />
              <span>입구와 계산대 구역이 가장 높은 트래픽을 보임</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
              <span>할인 코너의 낮은 트래픽 - 위치 재배치 권장</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5" />
              <span>피팅룸 활용률 중간 수준 - 안내 표지 강화 필요</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
