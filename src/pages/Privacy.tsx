import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-8">
              <span className="gradient-text">개인정보처리방침</span>
            </h1>
            
            <Card className="glass p-8 space-y-6 text-muted-foreground">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. 수집하는 개인정보</h2>
                <p>NEURALTWIN은 서비스 제공을 위해 최소한의 개인정보를 수집합니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. 개인정보의 이용목적</h2>
                <p>수집된 개인정보는 서비스 제공, 고객 지원, 마케팅에 활용됩니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. 개인정보의 보유 및 이용기간</h2>
                <p>원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. 문의</h2>
                <p>개인정보 관련 문의: privacy@neuraltwin.ai</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm">최종 수정일: 2025년 1월 1일</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
