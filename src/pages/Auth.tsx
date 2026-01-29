import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { trackPageView, trackFunnelStep } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import neuraltwinLogo from "@/assets/neuraltwin-logo.png";
const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"login" | "signup">((location.state as any)?.tab === "signup" ? "signup" : "login");
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  // 혹시 /auth 페이지에 있는 상태에서 다시 회원가입 버튼을 눌렀을 때도 반응하도록
  useEffect(() => {
    const tabFromState = (location.state as any)?.tab;
    if (tabFromState === "login" || tabFromState === "signup") {
      setActiveTab(tabFromState);
    }
  }, [location]);
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [roleType, setRoleType] = useState<"HQ" | "STORE">("HQ");
  const ensureOrganizationAndNavigate = async (session: any) => {
    try {
      const {
        data: orgMember,
        error: orgMemberError
      } = await supabase.from('organization_members').select('org_id').eq('user_id', session.user.id).maybeSingle();
      if (orgMemberError) {
        console.error("Error fetching organization member:", orgMemberError);
      }
      let orgId = orgMember?.org_id;

      // If no organization exists, find or create organization
      if (!orgId) {
        const companyName = session.user.user_metadata?.company || session.user.user_metadata?.name || session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split("@")[0] : "내 조직");

        // Check if organization with this name already exists
        const {
          data: existingOrg,
          error: searchError
        } = await supabase.from('organizations').select('id').eq('org_name', companyName).maybeSingle();
        if (searchError && searchError.code !== 'PGRST116') {
          console.error("Error searching organization:", searchError);
        }
        if (existingOrg) {
          // Join existing organization
          orgId = existingOrg.id;
        } else {
          // Create new organization
          const {
            data: newOrg,
            error: orgError
          } = await supabase.from('organizations').insert({
            org_name: companyName,
            created_by: session.user.id,
            metadata: {
              country: 'KR'
            }
          }).select('id').maybeSingle();
          if (orgError || !newOrg) {
            console.error("Error creating organization:", orgError);
            throw orgError || new Error('조직 생성에 실패했습니다.');
          }
          orgId = newOrg.id;
        }

        // Determine role from user metadata
        const userRoleType = session.user.user_metadata?.roleType || 'HQ';
        const userRole = userRoleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

        // Add user to organization with selected role
        const {
          error: memberError
        } = await supabase.from('organization_members').insert({
          user_id: session.user.id,
          org_id: orgId,
          role: userRole
        });
        if (memberError) {
          console.error("Error creating organization member:", memberError);
          // 특정 권한 오류(예: permission denied for table users)는 치명적 오류로 보지 않고 계속 진행
          if (memberError.code !== '42501') {
            throw memberError;
          }
        }
      }

      // Check if user has an active subscription
      const {
        data: subscription,
        error: subError
      } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
      if (subError) {
        console.error("Error fetching subscription:", subError);
      }
      if (subscription) {
        navigate("/dashboard");
      } else {
        navigate("/subscribe");
      }
    } catch (error) {
      console.error("Error ensuring organization and subscription:", error);
      toast({
        title: "오류 발생",
        description: "조직 또는 구독 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    trackPageView('Auth');
    trackFunnelStep(2, 'view_auth');
    const ensureOrganizationAndNavigate = async (session: any) => {
      try {
        const {
          data: orgMember,
          error: orgMemberError
        } = await supabase.from('organization_members').select('org_id').eq('user_id', session.user.id).maybeSingle();
        if (orgMemberError) {
          console.error("Error fetching organization member:", orgMemberError);
        }
        let orgId = orgMember?.org_id;

        // If no organization exists, find or create organization
        if (!orgId) {
          const companyName = session.user.user_metadata?.company || session.user.user_metadata?.name || session.user.user_metadata?.full_name || (session.user.email ? session.user.email.split("@")[0] : "내 조직");

          // Check if organization with this name already exists
          const {
            data: existingOrg,
            error: searchError
          } = await supabase.from('organizations').select('id').eq('org_name', companyName).maybeSingle();
          if (searchError && searchError.code !== 'PGRST116') {
            console.error("Error searching organization:", searchError);
          }
          if (existingOrg) {
            // Join existing organization
            orgId = existingOrg.id;
          } else {
            // Create new organization
            const {
              data: newOrg,
              error: orgError
            } = await supabase.from('organizations').insert({
              org_name: companyName,
              created_by: session.user.id,
              metadata: {
                country: 'KR'
              }
            }).select('id').maybeSingle();
            if (orgError || !newOrg) {
              console.error("Error creating organization:", orgError);
              throw orgError || new Error('조직 생성에 실패했습니다.');
            }
            orgId = newOrg.id;
          }

          // Determine role from user metadata
          const userRoleType = session.user.user_metadata?.roleType || 'HQ';
          const userRole = userRoleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

          // Add user to organization with selected role
          const {
            error: memberError
          } = await supabase.from('organization_members').insert({
            user_id: session.user.id,
            org_id: orgId,
            role: userRole
          });
          if (memberError) {
            console.error("Error creating organization member:", memberError);
            // 특정 권한 오류(예: permission denied for table users)는 치명적 오류로 보지 않고 계속 진행
            if (memberError.code !== '42501') {
              throw memberError;
            }
          }
        }

        // Check if user has an active subscription
        const {
          data: subscription,
          error: subError
        } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
        if (subError) {
          console.error("Error fetching subscription:", subError);
        }
        if (subscription) {
          navigate("/dashboard");
        } else {
          navigate("/subscribe");
        }
      } catch (error) {
        console.error("Error ensuring organization and subscription:", error);
        toast({
          title: "오류 발생",
          description: "조직 또는 구독 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    };
    const ensureOrganizationAndNavigateWrapper = (session: any) => {
      ensureOrganizationAndNavigate(session);
    };

    // Check if user is already logged in on mount
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        // 로그인 성공 시 수동 로그아웃 플래그 제거
        localStorage.removeItem('neuraltwin_manual_logout');
        await ensureOrganizationAndNavigateWrapper(session);
      }
    };
    checkSession();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 로그인 성공 시 수동 로그아웃 플래그 제거
        localStorage.removeItem('neuraltwin_manual_logout');
        ensureOrganizationAndNavigateWrapper(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, toast]);
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !passwordConfirm || !name || !company || !phone || !roleType) {
      toast({
        title: "입력 오류",
        description: "모든 필수 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive"
      });
      return;
    }
    if (password !== passwordConfirm) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;

      // Step 1: Sign up the user
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: name,
            name: name,
            full_name: name,
            company: company,
            phone: phone,
            roleType: roleType
          }
        }
      });
      if (error) throw error;
      if (data.user && data.session) {
        console.log("User created, creating organization...");

        // Step 2: Check if organization with this name already exists
        const {
          data: existingOrg,
          error: searchError
        } = await supabase.from('organizations').select('id').eq('org_name', company).maybeSingle();
        if (searchError && searchError.code !== 'PGRST116') {
          console.error("Error searching organization:", searchError);
          throw searchError;
        }
        let orgId: string;
        if (existingOrg) {
          // Join existing organization
          orgId = existingOrg.id;
          console.log("Joining existing organization:", orgId);
        } else {
          // Step 3: Create new organization
          const {
            data: newOrg,
            error: orgError
          } = await supabase.from('organizations').insert({
            org_name: company,
            created_by: data.user.id,
            metadata: {
              country: 'KR'
            }
          }).select('id').single();
          if (orgError) {
            console.error("Error creating organization:", orgError);
            throw orgError;
          }
          if (!newOrg) {
            throw new Error('조직 생성에 실패했습니다.');
          }
          orgId = newOrg.id;
          console.log("Created new organization:", orgId);
        }

        // Step 4: Determine role based on license type selection
        const userRole = roleType === 'HQ' ? 'ORG_HQ' : 'ORG_STORE';

        // Step 5: Create organization member entry
        const {
          error: memberError
        } = await supabase.from('organization_members').insert({
          user_id: data.user.id,
          org_id: orgId,
          role: userRole
        });
        if (memberError) {
          console.error("Error creating organization member:", memberError);
          throw memberError;
        }
        console.log("Organization member created successfully");
        toast({
          title: "회원가입 완료!",
          description: "환영합니다!"
        });
        trackFunnelStep(2, 'signup_completed');

        // Step 6: Check for active subscription and navigate
        const {
          data: subscription
        } = await supabase.from('subscriptions').select('id').eq('org_id', orgId).eq('status', 'active').maybeSingle();
        if (subscription) {
          navigate("/dashboard");
        } else {
          navigate("/subscribe");
        }
      } else if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "회원가입 완료!",
          description: "이메일로 전송된 확인 링크를 클릭해주세요."
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message || "회원가입 중 오류가 발생했습니다.";

      // Handle specific error cases
      if (error.code === 'user_already_exists' || error.message === 'User already registered') {
        errorMessage = "이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.";
      } else if (error.message?.includes('organization')) {
        errorMessage = "조직 생성 중 오류가 발생했습니다. 다시 시도해주세요.";
      } else if (error.message?.includes('member')) {
        errorMessage = "조직 멤버 등록 중 오류가 발생했습니다. 다시 시도해주세요.";
      }
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: "로그인 성공!",
        description: "환영합니다!"
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "Google 로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24">
        <Card className="w-full max-w-md glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex justify-center">
              <img src={neuraltwinLogo} alt="NEURALTWIN" className="h-6 w-auto" />
            </CardTitle>
            <CardDescription className="text-center">
              리테일 디지털 트윈 플랫폼
            </CardDescription>
          </CardHeader>
          <CardContent><Tabs value={activeTab} onValueChange={value => setActiveTab(value as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <Input id="login-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "로그인 중..." : "로그인"}
                  </Button>
                </form>

              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일 (ID) *</Label>
                    <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호 *</Label>
                    <Input id="signup-password" type="password" placeholder="최소 6자 이상" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password-confirm">비밀번호 확인 *</Label>
                    <Input id="signup-password-confirm" type="password" placeholder="비밀번호를 다시 입력하세요" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} disabled={loading} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름 *</Label>
                    <Input id="signup-name" type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">회사명 (조직명) *</Label>
                    <Input id="signup-company" type="text" placeholder="주식회사 NEURALTWIN" value={company} onChange={e => setCompany(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">전화번호 *</Label>
                    <Input id="signup-phone" type="tel" placeholder="010-1234-5678" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <Label>역할 선택 *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="roleType" value="HQ" checked={roleType === "HQ"} onChange={e => setRoleType(e.target.value as "HQ" | "STORE")} disabled={loading} className="w-4 h-4" />
                        <span className="text-sm">본사 (HQ)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="roleType" value="STORE" checked={roleType === "STORE"} onChange={e => setRoleType(e.target.value as "HQ" | "STORE")} disabled={loading} className="w-4 h-4" />
                        <span className="text-sm">매장 (Store)</span>
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full glow" disabled={loading}>
                    {loading ? "가입 중..." : "회원가입"}
                  </Button>
                </form>

              </TabsContent>
            </Tabs>

            <div className="text-center text-xs text-muted-foreground mt-6">
              가입하면{" "}
              <a href="/terms" className="underline hover:text-foreground">
                이용약관
              </a>{" "}
              및{" "}
              <button
                type="button"
                onClick={() => setPrivacyDialogOpen(true)}
                className="underline hover:text-foreground"
              >
                개인정보처리방침
              </button>
              에 동의하는 것으로 간주됩니다.
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("contact.consent.privacyTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm text-muted-foreground">
            <p>{t("contact.consent.privacyDoc.intro")}</p>

            {/* 개인정보의 처리 목적 및 수집 항목 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section1Title")}</h4>
              <p className="mb-3">{t("contact.consent.privacyDoc.section1Desc")}</p>
              <div className="space-y-3 pl-2">
                <div>
                  <p className="font-medium text-foreground">{t("contact.consent.privacyDoc.service")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.serviceItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.servicePurpose")}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("contact.consent.privacyDoc.marketing")}</p>
                  <p>• 수집 항목: {t("contact.consent.privacyDoc.marketingItems")}</p>
                  <p>• 처리 목적: {t("contact.consent.privacyDoc.marketingPurpose")}</p>
                </div>
              </div>
            </div>

            {/* 개인정보의 처리 및 보유 기간 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section2Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section2Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.retention1")}</li>
                <li>{t("contact.consent.privacyDoc.retention2")}</li>
                <li>{t("contact.consent.privacyDoc.retention3")}</li>
                <li>{t("contact.consent.privacyDoc.retention4")}</li>
              </ul>
            </div>

            {/* 개인정보의 제3자 제공 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section3Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section3Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.thirdParty1")}</li>
                <li>{t("contact.consent.privacyDoc.thirdParty2")}</li>
              </ul>
            </div>

            {/* 개인정보처리의 위탁 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section4Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section4Desc")}</p>
            </div>

            {/* 정보주체의 권리·의무 및 행사방법 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section5Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section5Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.rights1")}</li>
                <li>{t("contact.consent.privacyDoc.rights2")}</li>
                <li>{t("contact.consent.privacyDoc.rights3")}</li>
                <li>{t("contact.consent.privacyDoc.rights4")}</li>
              </ul>
              <p className="mt-2">{t("contact.consent.privacyDoc.rightsNote")}</p>
            </div>

            {/* 개인정보의 파기 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section6Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section6Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.destroy1")}</li>
                <li>{t("contact.consent.privacyDoc.destroy2")}</li>
              </ul>
            </div>

            {/* 개인정보의 안전성 확보조치 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section7Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section7Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.safety1")}</li>
                <li>{t("contact.consent.privacyDoc.safety2")}</li>
                <li>{t("contact.consent.privacyDoc.safety3")}</li>
              </ul>
            </div>

            {/* 개인정보 보호책임자 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section8Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section8Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.officer")}</li>
                <li>{t("contact.consent.privacyDoc.contact")}</li>
              </ul>
            </div>

            {/* 권익침해 구제방법 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section9Title")}</h4>
              <p className="mb-2">{t("contact.consent.privacyDoc.section9Desc")}</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>{t("contact.consent.privacyDoc.remedy1")}</li>
                <li>{t("contact.consent.privacyDoc.remedy2")}</li>
                <li>{t("contact.consent.privacyDoc.remedy3")}</li>
                <li>{t("contact.consent.privacyDoc.remedy4")}</li>
              </ul>
            </div>

            {/* 개인정보처리방침의 변경 */}
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.section10Title")}</h4>
              <p>{t("contact.consent.privacyDoc.section10Desc")}</p>
            </div>

            {/* 시행일 */}
            <div className="pt-2 border-t">
              <p>{t("contact.consent.privacyDoc.effectiveDate")}</p>
              <p>{t("contact.consent.privacyDoc.implementDate")}</p>
            </div>
          </div>
          <Button onClick={() => setPrivacyDialogOpen(false)} className="mt-4">
            {t("contact.consent.close")}
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default Auth;