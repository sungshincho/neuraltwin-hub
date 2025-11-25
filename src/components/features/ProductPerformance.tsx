import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
  stock: number;
}

const products: Product[] = [
  { id: "P1", name: "화이트 티셔츠", sales: 156, revenue: 4680000, trend: "up", trendValue: 12.5, stock: 85 },
  { id: "P2", name: "블랙 진", sales: 98, revenue: 7840000, trend: "up", trendValue: 8.2, stock: 42 },
  { id: "P3", name: "스니커즈", sales: 142, revenue: 17040000, trend: "up", trendValue: 15.3, stock: 8 },
  { id: "P4", name: "데님 자켓", sales: 67, revenue: 8710000, trend: "stable", trendValue: 0.5, stock: 23 },
  { id: "P5", name: "백팩", sales: 34, revenue: 2380000, trend: "down", trendValue: -5.8, stock: 156 },
];

const chartData = products.map((p) => ({
  name: p.name.split(" ")[0],
  판매량: p.sales,
  매출: Math.round(p.revenue / 10000),
}));

export const ProductPerformance = () => {
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const topProduct = products.reduce((max, p) => (p.revenue > max.revenue ? p : max));

  const getTrendIcon = (trend: Product["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "stable":
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: Product["trend"], value: number) => {
    if (trend === "up") {
      return (
        <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
          <TrendingUp className="w-3 h-3" />
          +{value}%
        </Badge>
      );
    } else if (trend === "down") {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="w-3 h-3" />
          {value}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="w-3 h-3" />
        {value}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">총 판매량</div>
          <div className="text-2xl font-bold">{totalSales.toLocaleString()}개</div>
        </Card>
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">총 매출</div>
          <div className="text-2xl font-bold">₩{(totalRevenue / 1000000).toFixed(0)}M</div>
        </Card>
        <Card className="glass p-4 space-y-2 border-primary/30">
          <div className="text-sm text-muted-foreground">베스트 상품</div>
          <div className="text-lg font-bold text-primary">{topProduct.name}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold">상품별 성과</h4>
          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="glass p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-muted-foreground">재고: {product.stock}개</div>
                  </div>
                  {getTrendBadge(product.trend, product.trendValue)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-xs">판매량</div>
                    <div className="font-bold">{product.sales}개</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">매출</div>
                    <div className="font-bold">₩{(product.revenue / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">매출 분석</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="매출" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">주요 인사이트</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>스니커즈 매출 급증 - 추가 재고 확보 필요</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>백팩 판매 부진 - 프로모션 전략 필요</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>티셔츠류 안정적 성장세 유지</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
