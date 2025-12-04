import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "notifications" | "security">(
  (() => {
    const tabFromState = (location.state as any)?.tab;
    if (
      tabFromState === "subscription" ||
      tabFromState === "notifications" ||
      tabFromState === "security" ||
      tabFromState === "profile"
    ) {
      return tabFromState;
    }
    return "profile";
  })()
);
  
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      setEmail(session.user.email || "");
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || session.user.user_metadata?.display_name || "");
      } else {
        setDisplayName(session.user.user_metadata?.display_name || session.user.user_metadata?.name || "");
      }

      // Fetch organization and subscription info
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select(`
          org_id, 
          role, 
          license_id,
          organizations(id, org_name, metadata),
          licenses(license_type, status, monthly_price)
        `)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (orgMember && orgMember.organizations) {
        const orgData: any = typeof orgMember.organizations === 'object' ? orgMember.organizations : {};
        setOrganization({
          ...orgData,
          role: orgMember.role,
          license: orgMember.licenses,
        });

        // Fetch subscription for organization
        if (orgData.id) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('org_id', orgData.id)
            .maybeSingle();

          if (subData) {
            setSubscription(subData);

            // Fetch all licenses for this subscription
            const { data: licenseData } = await supabase
              .from('licenses')
              .select('*')
              .eq('subscription_id', subData.id)
              .order('created_at', { ascending: false });

            if (licenseData) {
              setLicenses(licenseData);
            }
          }
        }
      }
      
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;

      toast({
        title: "비밀번호 변경 이메일 전송",
        description: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "전송 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
      <main className="flex-1 container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">설정</h1>
            <p className="text-muted-foreground text-lg">
              계정 정보 및 환경설정을 관리하세요
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "profile" | "subscription" | "notifications" | "security")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                프로필
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                구독
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                알림
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                보안
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 정보</CardTitle>
                  <CardDescription>
                    공개 프로필 정보를 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {displayName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline">사진 변경</Button>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG 또는 GIF (최대 2MB)
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">표시 이름</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        이메일은 변경할 수 없습니다
                      </p>
                    </div>

                    <Button onClick={handleProfileUpdate}>
                      변경사항 저장
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>언어 설정</CardTitle>
                  <CardDescription>
                    사용할 언어를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">현재 언어</p>
                      <p className="text-sm text-muted-foreground">
                        {i18n.language === 'ko' ? '한국어' : 'English'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')}
                    >
                      {i18n.language === 'ko' ? 'Switch to English' : '한국어로 변경'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              {subscription ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>구독 정보</CardTitle>
                      <CardDescription>
                        현재 구독 플랜 및 결제 정보
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {subscription.subscription_type === 'LICENSE_BASED' ? '라이선스 기반 플랜' : '엔터프라이즈 계약'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            월 ${subscription.monthly_cost || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            subscription.status === 'active' ? 'text-green-600' :
                            subscription.status === 'suspended' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {subscription.status === 'active' ? '활성' :
                             subscription.status === 'suspended' ? '일시정지' :
                             subscription.status === 'cancelled' ? '취소됨' :
                             subscription.status === 'expired' ? '만료' :
                             subscription.status}
                          </p>
                          {subscription.current_period_end && (
                            <p className="text-sm text-muted-foreground">
                              다음 결제: {new Date(subscription.current_period_end).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">라이선스 현황</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">HQ 라이선스</p>
                            <p className="text-2xl font-bold">{subscription.hq_license_count || 0}</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Store 라이선스</p>
                            <p className="text-2xl font-bold">{subscription.store_license_count || 0}</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Viewer</p>
                            <p className="text-2xl font-bold">{subscription.viewer_count || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate("/pricing")}>
                          라이선스 추가 구매
                        </Button>
                        {subscription.status === 'active' && (
                          <Button variant="outline" className="text-destructive">
                            구독 취소
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {licenses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>라이선스 목록</CardTitle>
                        <CardDescription>
                          보유한 라이선스 정보입니다
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {licenses.map((license, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {license.license_type === 'HQ_SEAT' ? 'HQ 라이선스' : 'Store 라이선스'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  월 ${license.monthly_price || 0}
                                </p>
                              </div>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                license.status === 'active' || license.status === 'assigned' ? 'bg-green-100 text-green-700' :
                                license.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {license.status === 'active' ? '활성' :
                                 license.status === 'assigned' ? '할당됨' :
                                 license.status === 'suspended' ? '일시정지' :
                                 license.status === 'expired' ? '만료' :
                                 license.status === 'revoked' ? '취소됨' :
                                 license.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>구독 정보 없음</CardTitle>
                    <CardDescription>
                      아직 구독하지 않으셨습니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => navigate("/subscribe")}>
                      구독 시작하기
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>
                    받을 알림의 종류를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>이메일 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        중요한 업데이트를 이메일로 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>푸시 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        브라우저 푸시 알림을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>마케팅 정보</Label>
                      <p className="text-sm text-muted-foreground">
                        새로운 기능 및 프로모션 소식을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, marketing: checked })
                      }
                    />
                  </div>

                  <Button>알림 설정 저장</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 변경</CardTitle>
                  <CardDescription>
                    계정 보안을 위해 주기적으로 비밀번호를 변경하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handlePasswordChange}>
                    비밀번호 재설정 이메일 전송
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>세션 관리</CardTitle>
                  <CardDescription>
                    활성화된 로그인 세션을 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">현재 세션</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • 서울, 대한민국
                        </p>
                      </div>
                      <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        활성
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">계정 삭제</CardTitle>
                  <CardDescription>
                    계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">계정 삭제</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
