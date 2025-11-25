import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BarChart3, Store, Box } from "lucide-react";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);

      // Load organization info
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('org_id, role, organizations(id, org_name)')
        .eq('user_id', session.user.id)
        .single();

      if (orgMember && orgMember.organizations) {
        setOrganization({
          ...orgMember.organizations,
          role: orgMember.role
        });
      }

      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Mock project data - 실제 프로젝트에서는 데이터베이스에서 가져옴
  const projects = [
    {
      id: 1,
      name: "Dashboard_1",
      description: "실시간 매장 분석 및 고객 동선 추적",
      url: "https://neuraltwintest.app/",
      icon: BarChart3,
      status: "active"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {t("welcome")}, {user?.user_metadata?.name || user?.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {organization?.org_name} · {organization?.role === 'ORG_OWNER' ? '소유자' : organization?.role === 'ORG_ADMIN' ? '관리자' : '멤버'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const Icon = project.icon;
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {project.status === "active" ? "활성" : "비활성"}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => window.open(project.url, '_blank')}
                    >
                      대시보드 열기
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>구독 정보</CardTitle>
              <CardDescription>현재 Pro 플랜을 사용 중입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">다음 결제일</p>
                  <p className="font-medium">2025년 12월 17일</p>
                </div>
                <Button variant="outline">구독 관리</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;