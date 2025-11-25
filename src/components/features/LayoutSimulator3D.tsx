import { Card } from "@/components/ui/card";
import { Store3DViewer } from "./Store3DViewer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";

export const LayoutSimulator3D = () => {
  const [layout, setLayout] = useState("current");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">3D 레이아웃 시뮬레이터</h4>
        <div className="flex gap-2">
          <Select value={layout} onValueChange={setLayout}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">현재 레이아웃</SelectItem>
              <SelectItem value="optimized">최적화 레이아웃</SelectItem>
              <SelectItem value="seasonal">시즌 레이아웃</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </div>

      <Store3DViewer mode="layout" />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass p-4">
          <div className="text-sm text-muted-foreground mb-1">예상 매출 증가</div>
          <div className="text-2xl font-bold text-green-500">+15.3%</div>
        </Card>
        <Card className="glass p-4">
          <div className="text-sm text-muted-foreground mb-1">동선 효율</div>
          <div className="text-2xl font-bold text-primary">+22.1%</div>
        </Card>
        <Card className="glass p-4">
          <div className="text-sm text-muted-foreground mb-1">체류 시간</div>
          <div className="text-2xl font-bold">+8.5분</div>
        </Card>
      </div>
    </div>
  );
};
