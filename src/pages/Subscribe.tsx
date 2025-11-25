import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Store, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackPageView, trackFunnelStep } from "@/lib/analytics";

type PlanType = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

const Subscribe = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("BASIC");
  const [storeQuota, setStoreQuota] = useState(1);
  const [hqSeatQuota, setHqSeatQuota] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    trackPageView('Subscribe');
    trackFunnelStep(3, 'view_subscribe');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      setUserOrgId(membership.org_id);
    }
  };

  const plans = [
    {
      type: "FREE" as PlanType,
      name: "Free",
      price: 0,
      features: ["1개 매장", "1개 HQ 시트", "기본 분석", "커뮤니티 지원"],
      maxStores: 1,
      maxSeats: 1,
    },
    {
      type: "BASIC" as PlanType,
      name: "Basic",
      price: 300,
      features: ["최대 5개 매장", "최대 3개 HQ 시트", "고급 분석", "이메일 지원"],
      maxStores: 5,
      maxSeats: 3,
    },
    {
      type: "PRO" as PlanType,
      name: "Pro",
      price: 600,
      features: ["최대 20개 매장", "최대 10개 HQ 시트", "실시간 분석", "우선 지원", "AI 시뮬레이션"],
      maxStores: 20,
      maxSeats: 10,
      recommended: true,
    },
    {
      type: "ENTERPRISE" as PlanType,
      name: "Enterprise",
      price: null,
      features: ["무제한 매장", "무제한 HQ 시트", "맞춤형 솔루션", "전담 지원", "온프레미스 옵션"],
      maxStores: 999,
      maxSeats: 999,
    },
  ];

  const selectedPlanData = plans.find((p) => p.type === selectedPlan);

  const calculateTotal = () => {
    if (!selectedPlanData?.price) return null;
    const basePrice = selectedPlanData.price;
    const storePrice = storeQuota > 1 ? (storeQuota - 1) * 100 : 0;
    const seatPrice = hqSeatQuota > 1 ? (hqSeatQuota - 1) * 50 : 0;
    return basePrice + storePrice + seatPrice;
  };

  const handleSubscribe = async () => {
    if (!userOrgId) {
      toast({
        title: "오류",
        description: "조직 정보를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if subscription already exists
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("org_id", userOrgId)
        .eq("status", "active")
        .single();

      if (existingSub) {
        toast({
          title: "이미 구독 중",
          description: "이미 활성 구독이 있습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          org_id: userOrgId,
          plan_type: selectedPlan,
          store_quota: storeQuota,
          hq_seat_quota: hqSeatQuota,
          status: "active",
        })
        .select()
        .single();

      if (subError) throw subError;

      toast({
        title: "구독 완료!",
        description: "구독이 성공적으로 생성되었습니다.",
      });

      trackFunnelStep(4, 'subscription_completed');
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "오류",
        description: error.message || "구독 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">플랜 선택</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              비즈니스에 맞는 플랜을 선택하고 구독하세요
            </p>
          </div>

          {/* Plan Selection */}
          <div className="mb-12">
            <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.type}
                    className={`glass p-6 cursor-pointer transition-all relative ${
                      selectedPlan === plan.type ? "border-2 border-primary glow" : ""
                    }`}
                    onClick={() => setSelectedPlan(plan.type)}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                        추천
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <div className="text-2xl font-bold gradient-text">
                          {plan.price !== null ? `$${plan.price}` : "문의"}
                        </div>
                        {plan.price !== null && (
                          <span className="text-sm text-muted-foreground">/ 월</span>
                        )}
                      </div>
                      <RadioGroupItem value={plan.type} />
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Quota Configuration */}
          {selectedPlan !== "ENTERPRISE" && (
            <Card className="glass p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">리소스 구성</h2>

              <div className="space-y-8">
                {/* Store Quota */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-primary" />
                      <Label className="text-lg font-semibold">매장 수</Label>
                    </div>
                    <span className="text-2xl font-bold gradient-text">{storeQuota}</span>
                  </div>
                  <Slider
                    value={[storeQuota]}
                    onValueChange={(v) => setStoreQuota(v[0])}
                    min={1}
                    max={selectedPlanData?.maxStores || 1}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    최대 {selectedPlanData?.maxStores}개 매장
                    {storeQuota > 1 && ` (추가 매장: +$${(storeQuota - 1) * 100}/월)`}
                  </p>
                </div>

                {/* HQ Seat Quota */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <Label className="text-lg font-semibold">HQ 시트 수</Label>
                    </div>
                    <span className="text-2xl font-bold gradient-text">{hqSeatQuota}</span>
                  </div>
                  <Slider
                    value={[hqSeatQuota]}
                    onValueChange={(v) => setHqSeatQuota(v[0])}
                    min={1}
                    max={selectedPlanData?.maxSeats || 1}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    최대 {selectedPlanData?.maxSeats}개 시트
                    {hqSeatQuota > 1 && ` (추가 시트: +$${(hqSeatQuota - 1) * 50}/월)`}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Summary & Checkout */}
          <Card className="glass p-8">
            <h2 className="text-2xl font-bold mb-6">주문 요약</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">플랜</span>
                <span className="font-semibold">{selectedPlanData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">매장 수</span>
                <span className="font-semibold">{storeQuota}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HQ 시트</span>
                <span className="font-semibold">{hqSeatQuota}개</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">총 금액</span>
                  <span className="text-3xl font-bold gradient-text">
                    {calculateTotal() !== null ? `$${calculateTotal()}` : "문의"}
                    {calculateTotal() !== null && (
                      <span className="text-base text-muted-foreground ml-2">/ 월</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isLoading || selectedPlan === "ENTERPRISE"}
              className="w-full glow"
              size="lg"
            >
              {isLoading ? "처리 중..." : selectedPlan === "ENTERPRISE" ? "영업팀 문의" : "구독하기"}
            </Button>

            {selectedPlan === "ENTERPRISE" && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Enterprise 플랜은 영업팀과 상담이 필요합니다.
              </p>
            )}
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Subscribe;
