import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-8">
              <span className="gradient-text">이용약관</span>
            </h1>
            
            <Card className="glass p-8 space-y-6 text-muted-foreground">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. 서비스 이용</h2>
                <p>NEURALTWIN 서비스 이용 시 본 약관에 동의한 것으로 간주됩니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. 이용자의 의무</h2>
                <p>이용자는 서비스를 올바르게 사용해야 하며, 불법적인 활동에 이용할 수 없습니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. 서비스 제공 및 변경</h2>
                <p>NEURALTWIN은 서비스 개선을 위해 내용을 변경할 수 있습니다.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. 면책조항</h2>
                <p>NEURALTWIN은 천재지변 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</p>
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

export default Terms;
