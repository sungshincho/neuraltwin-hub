import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, TrendingUp, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface StaffMember {
  id: string;
  name: string;
  sales: number;
  customers: number;
  avgTime: number;
  rating: number;
  status: "excellent" | "good" | "needs_improvement";
}

const staff: StaffMember[] = [
  { id: "S1", name: "김민준", sales: 12500000, customers: 45, avgTime: 8.5, rating: 4.8, status: "excellent" },
  { id: "S2", name: "이서윤", sales: 10800000, customers: 38, avgTime: 9.2, rating: 4.6, status: "good" },
  { id: "S3", name: "박지호", sales: 9200000, customers: 32, avgTime: 10.1, rating: 4.3, status: "good" },
  { id: "S4", name: "최유진", sales: 6500000, customers: 25, avgTime: 11.5, rating: 3.9, status: "needs_improvement" },
];

const chartData = staff.map((s) => ({
  name: s.name,
  매출: Math.round(s.sales / 10000),
  고객수: s.customers,
  평점: s.rating * 10,
}));

export const StaffEfficiency = () => {
  const totalSales = staff.reduce((sum, s) => sum + s.sales, 0);
  const avgRating = (staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(1);
  const topPerformer = staff.reduce((max, s) => (s.sales > max.sales ? s : max));

  const getStatusBadge = (status: StaffMember["status"]) => {
    switch (status) {
      case "excellent":
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
            <Award className="w-3 h-3" />
            우수
          </Badge>
        );
      case "good":
        return (
          <Badge variant="secondary" className="gap-1">
            양호
          </Badge>
        );
      case "needs_improvement":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
            개선 필요
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">팀 총 매출</div>
          <div className="text-2xl font-bold">₩{(totalSales / 1000000).toFixed(0)}M</div>
        </Card>
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">평균 평점</div>
          <div className="text-2xl font-bold">{avgRating} / 5.0</div>
        </Card>
        <Card className="glass p-4 space-y-2 border-primary/30">
          <div className="text-sm text-muted-foreground">이달의 우수 직원</div>
          <div className="text-lg font-bold text-primary">{topPerformer.name}</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold">직원별 성과</h4>
          <div className="space-y-3">
            {staff.map((member) => (
              <Card key={member.id} className="glass p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{member.name}</div>
                    <div className="text-xs text-muted-foreground">평점: {member.rating} / 5.0</div>
                  </div>
                  {getStatusBadge(member.status)}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      매출
                    </div>
                    <div className="font-bold">₩{(member.sales / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      고객
                    </div>
                    <div className="font-bold">{member.customers}명</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      평균
                    </div>
                    <div className="font-bold">{member.avgTime}분</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">팀 성과 비교</h5>
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
                <Legend />
                <Bar dataKey="매출" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="고객수" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">AI 코칭 제안</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">김민준:</span> 우수 사례 공유 - 팀 교육 진행
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">이서윤:</span> 고객 응대 역량 우수 - 멘토 역할 추천
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">최유진:</span> 상담 시간 단축 교육 필요
                </span>
              </li>
            </ul>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold mb-1">성과 개선 팁</div>
                <p className="text-muted-foreground">
                  평균 상담 시간 1분 단축 시 팀 전체 월 매출 약 8% 증가 예상
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
