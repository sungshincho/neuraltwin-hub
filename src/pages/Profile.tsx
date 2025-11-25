import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";
import { User } from "@supabase/supabase-js";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    display_name: "",
    avatar_url: "",
  });
  const [organization, setOrganization] = useState<any>(null);
  const [userMetadata, setUserMetadata] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);
      setUserMetadata(user.user_metadata);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          display_name: profileData.display_name || user.user_metadata?.display_name || user.user_metadata?.name || "",
          avatar_url: profileData.avatar_url || "",
        });
      } else {
        // Use metadata if profile doesn't exist
        setProfile({
          display_name: user.user_metadata?.display_name || user.user_metadata?.name || "",
          avatar_url: "",
        });
      }

      // Get organization with subscription info
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select(`
          org_id, 
          role, 
          license_id,
          organizations(id, org_name, metadata),
          licenses(license_type, status, monthly_price)
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgMember && orgMember.organizations) {
        const orgData = typeof orgMember.organizations === 'object' ? orgMember.organizations : {};
        setOrganization({
          ...orgData,
          role: orgMember.role,
          license_id: orgMember.license_id,
          license: orgMember.licenses,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "업데이트 실패",
        description: error.message || "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "로그아웃 실패",
        description: error.message || "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">개인정보 관리</span>
            </h1>
            <p className="text-muted-foreground">
              계정 정보와 프로필을 관리하세요
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>계정 정보</CardTitle>
                <CardDescription>
                  회원가입 시 입력한 정보입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>이메일</Label>
                  <Input value={user?.email || ""} disabled className="mt-2" />
                </div>
                <div>
                  <Label>이름</Label>
                  <Input value={userMetadata?.name || userMetadata?.display_name || ""} disabled className="mt-2" />
                </div>
                {userMetadata?.company && (
                  <div>
                    <Label>회사명</Label>
                    <Input value={userMetadata.company} disabled className="mt-2" />
                  </div>
                )}
                {userMetadata?.phone && (
                  <div>
                    <Label>전화번호</Label>
                    <Input value={userMetadata.phone} disabled className="mt-2" />
                  </div>
                )}
                {userMetadata?.roleType && (
                  <div>
                    <Label>선택한 라이선스 타입</Label>
                    <Input value={userMetadata.roleType === 'HQ' ? 'HQ 라이선스' : 'Store 라이선스'} disabled className="mt-2" />
                  </div>
                )}
                <div>
                  <Label>가입일</Label>
                  <Input
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString("ko-KR") : ""}
                    disabled
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Info */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>프로필 정보</CardTitle>
                <CardDescription>
                  공개 프로필 정보를 수정할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="display_name">이름</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={(e) =>
                        setProfile({ ...profile, display_name: e.target.value })
                      }
                      className="mt-2"
                      placeholder="홍길동"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar_url">프로필 이미지 URL</Label>
                    <Input
                      id="avatar_url"
                      value={profile.avatar_url}
                      onChange={(e) =>
                        setProfile({ ...profile, avatar_url: e.target.value })
                      }
                      className="mt-2"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "저장 중..." : "프로필 저장"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Organization Info */}
            {organization && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>조직 정보</CardTitle>
                  <CardDescription>
                    소속된 조직의 정보입니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>조직명</Label>
                    <Input value={organization.org_name || ""} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label>역할</Label>
                    <Input 
                      value={
                        organization.role === 'ORG_HQ' ? 'HQ 관리자' :
                        organization.role === 'ORG_STORE' ? 'Store 관리자' :
                        organization.role === 'ORG_VIEWER' ? 'Viewer' :
                        organization.role === 'NEURALTWIN_MASTER' ? 'NEURALTWIN Master' :
                        organization.role
                      } 
                      disabled 
                      className="mt-2" 
                    />
                  </div>
                  {organization.license && (
                    <>
                      <div>
                        <Label>라이선스 타입</Label>
                        <Input 
                          value={organization.license.license_type === 'HQ_SEAT' ? 'HQ 라이선스' : 'Store 라이선스'} 
                          disabled 
                          className="mt-2" 
                        />
                      </div>
                      <div>
                        <Label>라이선스 상태</Label>
                        <Input 
                          value={
                            organization.license.status === 'active' ? '활성' :
                            organization.license.status === 'assigned' ? '할당됨' :
                            organization.license.status === 'suspended' ? '일시정지' :
                            organization.license.status === 'expired' ? '만료' :
                            organization.license.status
                          } 
                          disabled 
                          className="mt-2" 
                        />
                      </div>
                      {organization.license.monthly_price && (
                        <div>
                          <Label>월 요금</Label>
                          <Input 
                            value={`$${organization.license.monthly_price}`} 
                            disabled 
                            className="mt-2" 
                          />
                        </div>
                      )}
                    </>
                  )}
                  {organization.metadata?.country && (
                    <div>
                      <Label>국가</Label>
                      <Input value={organization.metadata.country} disabled className="mt-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                대시보드로 이동
              </Button>
              <Button variant="destructive" onClick={handleSignOut}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
