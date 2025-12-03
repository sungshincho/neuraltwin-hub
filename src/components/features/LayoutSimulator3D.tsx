import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, RotateCcw, TrendingUp, BarChart3, Users, DollarSign, Target, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { Store3DViewer, furnitureLayout } from "./Store3DViewer";
import { 
  convertFurnitureFor2D, 
  findNearestFurniture, 
  calculateProductSize,
  FURNITURE_COLORS,
  FurnitureItem,
  worldToPercent
} from "@/lib/layoutUtils";

interface Product {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  width?: number;
  height?: number;
  snappedTo?: string; // 스냅된 가구 파일명
  worldX?: number; // 스냅된 가구의 실제 3D X 좌표
  worldY?: number; // 스냅된 가구의 실제 3D Y 좌표 (Z축으로 사용됨)
}

interface KPIPreset {
  id: string;
  name: string;
  description: string;
  layout: Product[];
  metrics: {
    conversion: number;
    traffic: number;
    avgPurchase: number;
    dwellTime: number;
  };
}

const initialProducts: Product[] = [
  { id: "A", name: "신상품", x: 25, y: 25, color: "bg-primary" },
  { id: "B", name: "인기상품", x: 75, y: 25, color: "bg-blue-500" },
  { id: "C", name: "할인상품", x: 25, y: 75, color: "bg-purple-500" },
  { id: "D", name: "프리미엄", x: 75, y: 75, color: "bg-amber-500" },
];

const kpiPresets: KPIPreset[] = [
  {
    id: "conversion",
    name: "전환율 최적화",
    description: "구매 전환율을 최대화하는 레이아웃",
    layout: [
      { id: "A", name: "신상품", x: 50, y: 20, color: "bg-primary" },
      { id: "B", name: "인기상품", x: 25, y: 40, color: "bg-blue-500" },
      { id: "C", name: "할인상품", x: 75, y: 40, color: "bg-purple-500" },
      { id: "D", name: "프리미엄", x: 50, y: 70, color: "bg-amber-500" },
    ],
    metrics: { conversion: 23.5, traffic: 420, avgPurchase: 85000, dwellTime: 12.5 }
  },
  {
    id: "traffic",
    name: "동선 최적화",
    description: "고객 이동 경로를 최적화하는 레이아웃",
    layout: [
      { id: "A", name: "신상품", x: 20, y: 30, color: "bg-primary" },
      { id: "B", name: "인기상품", x: 80, y: 30, color: "bg-blue-500" },
      { id: "C", name: "할인상품", x: 20, y: 70, color: "bg-purple-500" },
      { id: "D", name: "프리미엄", x: 80, y: 70, color: "bg-amber-500" },
    ],
    metrics: { conversion: 18.2, traffic: 580, avgPurchase: 72000, dwellTime: 8.3 }
  },
  {
    id: "revenue",
    name: "매출 최적화",
    description: "객단가를 최대화하는 레이아웃",
    layout: [
      { id: "D", name: "프리미엄", x: 50, y: 25, color: "bg-amber-500" },
      { id: "A", name: "신상품", x: 30, y: 50, color: "bg-primary" },
      { id: "B", name: "인기상품", x: 70, y: 50, color: "bg-blue-500" },
      { id: "C", name: "할인상품", x: 50, y: 80, color: "bg-purple-500" },
    ],
    metrics: { conversion: 19.8, traffic: 390, avgPurchase: 125000, dwellTime: 15.2 }
  },
  {
    id: "dwell",
    name: "체류시간 최적화",
    description: "고객 체류시간을 늘리는 레이아웃",
    layout: [
      { id: "A", name: "신상품", x: 15, y: 30, color: "bg-primary" },
      { id: "B", name: "인기상품", x: 40, y: 50, color: "bg-blue-500" },
      { id: "C", name: "할인상품", x: 60, y: 50, color: "bg-purple-500" },
      { id: "D", name: "프리미엄", x: 85, y: 30, color: "bg-amber-500" },
    ],
    metrics: { conversion: 21.3, traffic: 350, avgPurchase: 95000, dwellTime: 18.7 }
  }
];

const generateMetrics = (products: Product[]) => {
  const layoutScore = products.reduce((sum, p) => {
    const centerDistance = Math.sqrt(Math.pow(p.x - 50, 2) + Math.pow(p.y - 50, 2));
    return sum + (100 - centerDistance);
  }, 0);
  
  const variance = (layoutScore % 100) / 100;
  
  return {
    conversion: 15 + variance * 8,
    traffic: 400 + Math.floor(variance * 150),
    avgPurchase: 70000 + Math.floor(variance * 50000),
    dwellTime: 8 + variance * 10,
  };
};

export const LayoutSimulator3D = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeKPI, setActiveKPI] = useState("conversion");
  const [hoveredFurniture, setHoveredFurniture] = useState<string | null>(null);

  // 가구 데이터를 2D용으로 변환 (Product 제외)
  const furniture2D = useMemo(() => {
    const nonProductFurniture = furnitureLayout.filter(
      item => !item.file.startsWith('Product_')
    );
    return convertFurnitureFor2D(nonProductFurniture);
  }, []);

  const metrics = useMemo(() => generateMetrics(products), [products]);
  const currentPreset = kpiPresets.find(p => p.id === selectedPreset);
  const targetMetrics = currentPreset?.metrics || metrics;

  const weeklyData = useMemo(() => {
    const base = metrics;
    const target = targetMetrics;
    return [
      { day: "월", current: base.conversion, optimized: target.conversion },
      { day: "화", current: base.conversion + 0.5, optimized: target.conversion + 0.8 },
      { day: "수", current: base.conversion - 0.3, optimized: target.conversion + 1.2 },
      { day: "목", current: base.conversion + 0.8, optimized: target.conversion + 1.5 },
      { day: "금", current: base.conversion + 1.5, optimized: target.conversion + 2.5 },
      { day: "토", current: base.conversion + 3, optimized: target.conversion + 4.5 },
      { day: "일", current: base.conversion + 2.5, optimized: target.conversion + 3.8 },
    ];
  }, [metrics, targetMetrics]);

  const comparisonData = useMemo(() => [
    { name: "전환율", current: metrics.conversion, optimized: targetMetrics.conversion, unit: "%" },
    { name: "일 방문자", current: metrics.traffic, optimized: targetMetrics.traffic, unit: "명" },
    { name: "객단가", current: metrics.avgPurchase / 1000, optimized: targetMetrics.avgPurchase / 1000, unit: "천원" },
    { name: "체류시간", current: metrics.dwellTime, optimized: targetMetrics.dwellTime, unit: "분" },
  ], [metrics, targetMetrics]);

  const handleDragStart = (productId: string) => {
    setDraggedProduct(productId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedProduct) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 가장 가까운 가구 찾기 (스냅)
    const nearestFurniture = findNearestFurniture(x, y, furniture2D, 12);
    
    // 스냅된 가구가 있으면 해당 위치와 크기로 조정
    let finalX = Math.max(10, Math.min(90, x));
    let finalY = Math.max(10, Math.min(90, y));
    let newWidth: number | undefined;
    let newHeight: number | undefined;
    let snappedTo: string | undefined;
    let worldX: number | undefined;
    let worldY: number | undefined;

    if (nearestFurniture) {
      finalX = nearestFurniture.percentX;
      finalY = nearestFurniture.percentY;
      const size = calculateProductSize(nearestFurniture);
      newWidth = size.width;
      newHeight = size.height;
      snappedTo = nearestFurniture.file;
      // 가구의 실제 3D 좌표 저장 (furnitureLayout에서 x, y는 3D 좌표)
      worldX = nearestFurniture.x;
      worldY = nearestFurniture.y;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === draggedProduct
          ? { 
              ...p, 
              x: finalX, 
              y: finalY, 
              width: newWidth, 
              height: newHeight,
              snappedTo,
              worldX,
              worldY
            }
          : p
      )
    );
    setDraggedProduct(null);
    setSelectedPreset(null);
    setHoveredFurniture(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedProduct) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const nearestFurniture = findNearestFurniture(x, y, furniture2D, 12);
    setHoveredFurniture(nearestFurniture?.file || null);
  };

  const applyPreset = (presetId: string) => {
    const preset = kpiPresets.find(p => p.id === presetId);
    if (preset) {
      setProducts(preset.layout);
      setSelectedPreset(presetId);
    }
  };

  const resetLayout = () => {
    setProducts(initialProducts);
    setSelectedPreset(null);
  };

  const improvement = selectedPreset 
    ? ((targetMetrics.conversion - metrics.conversion) / metrics.conversion * 100).toFixed(1)
    : "0";

  // 가구 카테고리별 그룹핑 (범례용)
  const furnitureCategories = useMemo(() => {
    const categories = new Map<string, number>();
    furniture2D.forEach(f => {
      categories.set(f.category, (categories.get(f.category) || 0) + 1);
    });
    return Array.from(categories.entries());
  }, [furniture2D]);

  return (
    <div className="space-y-6">
      {/* 3D 뷰어 */}
      <Store3DViewer 
        mode="layout"
        layoutProducts={products}
      />

      {/* KPI 프리셋 선택 */}
      <Card className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI 기반 레이아웃 최적화
          </h4>
          <Button size="sm" variant="outline" onClick={resetLayout}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedPreset === preset.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {preset.id === "conversion" && <TrendingUp className="w-4 h-4 text-green-500" />}
                {preset.id === "traffic" && <Users className="w-4 h-4 text-blue-500" />}
                {preset.id === "revenue" && <DollarSign className="w-4 h-4 text-amber-500" />}
                {preset.id === "dwell" && <BarChart3 className="w-4 h-4 text-purple-500" />}
                <span className="font-medium text-sm">{preset.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
        
        {selectedPreset && (
          <Badge className="mt-4 w-full justify-center py-2">
            <Zap className="w-4 h-4 mr-2" />
            AI 최적화 적용됨 - 예상 개선: +{improvement}%
          </Badge>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 2D 레이아웃 캔버스 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">매장 레이아웃 (드래그로 조정)</h4>
            <Button size="sm" onClick={() => applyPreset(activeKPI)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 최적화
            </Button>
          </div>

          <Card
            className="glass relative h-[400px] overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setHoveredFurniture(null)}
          >
            {/* 그리드 가이드 */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-dashed border-border/10" />
              ))}
            </div>
            
            {/* 입구/출구 표시 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-t z-20">
              입구
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/20 text-red-500 text-xs rounded-b z-20">
              계산대
            </div>

            {/* 가구 표시 */}
            {furniture2D.map((furniture, index) => {
              const colorClass = FURNITURE_COLORS[furniture.category] || 'bg-gray-500/30 border-gray-400';
              const isHovered = hoveredFurniture === furniture.file;
              
              // 가구 크기 계산 (% 단위)
              let widthPercent = 8;
              let heightPercent = 8;
              if (furniture.dimensions) {
                const isRotated = Math.abs(furniture.rotationY) === 90 || Math.abs(furniture.rotationY) === 270;
                const w = isRotated ? furniture.dimensions.depth : furniture.dimensions.width;
                const d = isRotated ? furniture.dimensions.width : furniture.dimensions.depth;
                widthPercent = Math.max(4, Math.min(15, (w / 15) * 100));
                heightPercent = Math.max(4, Math.min(15, (d / 14) * 100));
              }

              return (
                <div
                  key={`furniture-${index}`}
                  className={`absolute border rounded transition-all pointer-events-none ${colorClass} ${
                    isHovered ? 'ring-2 ring-primary scale-110 z-10' : ''
                  }`}
                  style={{
                    left: `${furniture.percentX}%`,
                    top: `${furniture.percentY}%`,
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-foreground/70 font-medium truncate px-0.5">
                    {furniture.label}
                  </span>
                </div>
              );
            })}
            
            {/* 상품 박스 */}
            {products.map((product) => {
              const boxWidth = product.width || 14;
              const boxHeight = product.height || 14;
              
              return (
                <div
                  key={product.id}
                  draggable
                  onDragStart={() => handleDragStart(product.id)}
                  className={`absolute rounded-lg ${product.color} cursor-move flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-110 hover:shadow-xl z-10`}
                  style={{ 
                    left: `${product.x}%`, 
                    top: `${product.y}%`, 
                    transform: "translate(-50%, -50%)",
                    width: `${boxWidth}%`,
                    height: `${boxHeight}%`,
                    minWidth: '40px',
                    minHeight: '40px',
                  }}
                >
                  <span className="text-lg">{product.id}</span>
                  <span className="text-[9px] opacity-80">{product.name}</span>
                  {product.snappedTo && (
                    <span className="absolute -bottom-4 text-[7px] text-muted-foreground whitespace-nowrap">
                      📍 스냅됨
                    </span>
                  )}
                </div>
              );
            })}
          </Card>
          
          {/* 범례 */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">상품</div>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <Badge key={p.id} variant="outline" className="text-xs">
                  <span className={`w-2 h-2 rounded-full ${p.color} mr-1`} />
                  {p.id}: {p.name}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-2">가구</div>
            <div className="flex flex-wrap gap-2">
              {furnitureCategories.map(([category, count]) => {
                const colorClass = FURNITURE_COLORS[category] || 'bg-gray-500/30';
                return (
                  <Badge key={category} variant="outline" className="text-xs">
                    <span className={`w-2 h-2 rounded ${colorClass.split(' ')[0]} mr-1`} />
                    {category} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* 성과 분석 */}
        <div className="space-y-4">
          <Tabs value={activeKPI} onValueChange={setActiveKPI}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="conversion">전환율</TabsTrigger>
              <TabsTrigger value="traffic">트래픽</TabsTrigger>
              <TabsTrigger value="revenue">매출</TabsTrigger>
              <TabsTrigger value="dwell">체류</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeKPI} className="mt-4">
              <Card className="glass p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      name="현재"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="optimized"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="최적화"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
          </Tabs>

          {/* KPI 비교 */}
          <Card className="glass p-4">
            <h5 className="text-sm font-medium mb-3">현재 vs 최적화 비교</h5>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}`,
                    name === "current" ? "현재" : "최적화"
                  ]}
                />
                <Bar dataKey="current" fill="hsl(var(--muted-foreground))" name="current" />
                <Bar dataKey="optimized" fill="hsl(var(--primary))" name="optimized" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 핵심 메트릭 */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass p-3">
              <div className="text-xs text-muted-foreground">전환율</div>
              <div className="text-xl font-bold gradient-text">{metrics.conversion.toFixed(1)}%</div>
            </Card>
            <Card className="glass p-3">
              <div className="text-xs text-muted-foreground">일 방문자</div>
              <div className="text-xl font-bold gradient-text">{metrics.traffic}명</div>
            </Card>
            <Card className="glass p-3">
              <div className="text-xs text-muted-foreground">객단가</div>
              <div className="text-xl font-bold gradient-text">{(metrics.avgPurchase / 1000).toFixed(0)}천원</div>
            </Card>
            <Card className="glass p-3">
              <div className="text-xs text-muted-foreground">평균 체류</div>
              <div className="text-xl font-bold gradient-text">{metrics.dwellTime.toFixed(1)}분</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
