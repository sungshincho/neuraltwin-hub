import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, CheckCircle, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackContactForm, trackFunnelStep } from "@/lib/analytics";

// Animated Counter Component
interface AnimatedCounterProps {
  targetValue: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  isVisible: boolean;
  colorClass: string;
}

const AnimatedCounter = ({ targetValue, prefix = "", suffix = "", duration = 2000, isVisible, colorClass }: AnimatedCounterProps) => {
  const [currentValue, setCurrentValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;

    hasAnimated.current = true;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const value = Math.round(startValue + (targetValue - startValue) * easeOutCubic);
      setCurrentValue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, targetValue, duration]);

  return (
    <div className={`text-3xl md:text-4xl font-bold ${colorClass} mb-2`}>
      {prefix}{currentValue}{suffix}
    </div>
  );
};

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [marketingDialogOpen, setMarketingDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stores: "",
    features: [] as string[],
    timeline: "",
    message: "",
    privacyConsent: false,
    marketingConsent: false,
  });

  // Stats cards animation
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  // Statistics data with different colors
  const statsData = [
    { value: 12, prefix: "+", suffix: "%", labelKey: "contact.stats.salesIncrease", colorClass: "text-emerald-500" },
    { value: 85, prefix: "", suffix: "%+", labelKey: "contact.stats.aiAccuracy", colorClass: "text-blue-500" },
    { value: 80, prefix: "-", suffix: "%", labelKey: "contact.stats.decisionSpeed", colorClass: "text-violet-500" },
    { value: 20, prefix: "+", suffix: "%", labelKey: "contact.stats.dwellTime", colorClass: "text-amber-500" },
    { value: 15, prefix: "-", suffix: "%", labelKey: "contact.stats.resourceSaving", colorClass: "text-rose-500" },
  ];

  useEffect(() => {
    // Track page view with funnel step 3 (contact)
    trackPageView("Contact", 3);
    trackFunnelStep(3, "view_contact");
    trackContactForm("start");
  }, []);

  // Intersection Observer for stats cards animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsCardsRef.current) {
      observer.observe(statsCardsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate privacy consent
    if (!formData.privacyConsent) {
      toast({
        title: t("contact.consent.privacyRequired"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone || undefined,
          stores: formData.stores ? parseInt(formData.stores) : undefined,
          features: formData.features.length > 0 ? formData.features : undefined,
          timeline: formData.timeline || undefined,
          message: formData.message,
          privacyConsent: formData.privacyConsent,
          marketingConsent: formData.marketingConsent,
        },
      });

      if (error) throw error;

      // Track successful submission
      trackContactForm("submit");

      // Show success dialog
      setSuccessDialogOpen(true);

      // Reset form
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        stores: "",
        features: [],
        timeline: "",
        message: "",
        privacyConsent: false,
        marketingConsent: false,
      });
    } catch (error) {
      console.error("Form submission error:", error);

      // Track error
      trackContactForm("error", error instanceof Error ? error.message : "Unknown error");

      toast({
        title: t("contact.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="gradient-text">{t("contact.title")}</span>
              </h1>
              <p className="text-lg text-foreground">
                {t("contact.subtitleBefore")}
                <span className="text-2xl font-bold text-primary">{t("contact.subtitleHighlight")}</span>
                {t("contact.subtitleAfter")}
              </p>

              {/* Benefits List */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">{t("contact.benefit1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">{t("contact.benefit2")}</span>
                </div>
              </div>

              {/* Product Info Link */}
              <Link
                to="/product"
                className="inline-flex items-center gap-1 mt-6 text-primary hover:text-primary/80 transition-colors cursor-pointer group"
              >
                <span className="text-sm font-medium underline underline-offset-4 decoration-primary/50 group-hover:decoration-primary">
                  제품 정보 자세히 보기
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Statistics Cards */}
              <div ref={statsCardsRef} className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                {statsData.map((stat, index) => (
                  <div
                    key={index}
                    className={`relative bg-white rounded-lg p-6 text-center shadow-md border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300 ${
                      index === 4 ? "col-span-2 md:col-span-1" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }} />
                    <div className="relative z-10">
                      <AnimatedCounter
                        targetValue={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        isVisible={isStatsVisible}
                        colorClass={stat.colorClass}
                        duration={1800}
                      />
                      <div className="text-sm font-medium text-gray-900">{t(stat.labelKey)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact Form */}
              <Card className="glass p-8 md:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("contact.form.name")} *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder={t("contact.form.namePlaceholder")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">{t("contact.form.company")} *</Label>
                      <Input
                        id="company"
                        name="company"
                        required
                        placeholder={t("contact.form.companyPlaceholder")}
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("contact.form.email")} *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder={t("contact.form.emailPlaceholder")}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("contact.form.phone")}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={t("contact.form.phonePlaceholder")}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stores">{t("contact.form.stores")}</Label>
                    <Input
                      id="stores"
                      name="stores"
                      type="number"
                      placeholder={t("contact.form.storesPlaceholder")}
                      value={formData.stores}
                      onChange={(e) => setFormData({ ...formData, stores: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="features">{t("contact.form.features")}</Label>
                    <Select
                      value={formData.features[0] || ""}
                      onValueChange={(value) => setFormData({ ...formData, features: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("contact.form.featuresPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analyze">{t("contact.form.featureOptions.footfall")}</SelectItem>
                        <SelectItem value="forecast">{t("contact.form.featureOptions.forecast")}</SelectItem>
                        <SelectItem value="simulate">{t("contact.form.featureOptions.layout")}</SelectItem>
                        <SelectItem value="optimize">{t("contact.form.featureOptions.ai")}</SelectItem>
                        <SelectItem value="all">{t("contact.form.featureOptions.all")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">{t("contact.form.timeline")}</Label>
                    <Select
                      value={formData.timeline}
                      onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("contact.form.timelinePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">{t("contact.form.timelineOptions.immediate")}</SelectItem>
                        <SelectItem value="month1">{t("contact.form.timelineOptions.month1")}</SelectItem>
                        <SelectItem value="month3">{t("contact.form.timelineOptions.month3")}</SelectItem>
                        <SelectItem value="month6">{t("contact.form.timelineOptions.month6")}</SelectItem>
                        <SelectItem value="planning">{t("contact.form.timelineOptions.planning")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contact.form.message")} *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      placeholder={t("contact.form.messagePlaceholder")}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="privacyConsent"
                          checked={formData.privacyConsent}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, privacyConsent: checked as boolean })
                          }
                        />
                        <label
                          htmlFor="privacyConsent"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="text-primary font-medium">{t("contact.consent.required")}</span>{" "}
                          {t("contact.consent.privacy")}
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrivacyDialogOpen(true)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t("contact.consent.view")}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="marketingConsent"
                          checked={formData.marketingConsent}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, marketingConsent: checked as boolean })
                          }
                        />
                        <label
                          htmlFor="marketingConsent"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <span className="text-muted-foreground">{t("contact.consent.optional")}</span>{" "}
                          {t("contact.consent.marketing")}
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMarketingDialogOpen(true)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t("contact.consent.view")}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t("contact.form.submitting") : t("contact.form.submit")}
                  </Button>
                </form>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="glass p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{t("contact.info.email")}</div>
                      <a
                        href="mailto:neuraltwin.hq@neuraltwin.io"
                        className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                      >
                        neuraltwin.hq@neuraltwin.io
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{t("contact.info.address")}</div>
                      <p className="text-sm text-muted-foreground">Seoul, South Korea</p>
                    </div>
                  </div>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl">{t("contact.successTitle")}</DialogTitle>
            <DialogDescription className="text-base mt-2">
              {t("contact.successMessage")}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuccessDialogOpen(false)} className="mt-4">
            확인
          </Button>
        </DialogContent>
      </Dialog>

      {/* Privacy Consent Dialog */}
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

      {/* Marketing Consent Dialog */}
      <Dialog open={marketingDialogOpen} onOpenChange={setMarketingDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("contact.consent.marketingTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("contact.consent.marketingDoc.intro")}</p>
            <div className="space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">수집 항목</span>
                <span>{t("contact.consent.marketingDoc.items")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">이용 목적</span>
                <span>{t("contact.consent.marketingDoc.purpose")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">수신 방법</span>
                <span>{t("contact.consent.marketingDoc.method")}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-foreground">보유 및 이용 기간</span>
                <span>{t("contact.consent.marketingDoc.period")}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/80 pt-2">{t("contact.consent.marketingDoc.note")}</p>
          </div>
          <Button onClick={() => setMarketingDialogOpen(false)} className="mt-4">
            {t("contact.consent.close")}
          </Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Contact;
