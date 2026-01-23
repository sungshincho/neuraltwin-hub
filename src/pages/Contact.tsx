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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, CheckCircle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackContactForm, trackFunnelStep } from "@/lib/analytics";

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

  useEffect(() => {
    // Track page view with funnel step 3 (contact)
    trackPageView("Contact", 3);
    trackFunnelStep(3, "view_contact");
    trackContactForm("start");
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
              <p className="text-lg text-foreground">{t("contact.subtitle")}</p>

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
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("contact.consent.privacyTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.purpose")}</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("contact.consent.privacyDoc.purpose1")}</li>
                <li>{t("contact.consent.privacyDoc.purpose2")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.items")}</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("contact.consent.privacyDoc.items1")}</li>
                <li>{t("contact.consent.privacyDoc.items2")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.period")}</h4>
              <p>{t("contact.consent.privacyDoc.periodDesc")}</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.privacyDoc.rights")}</h4>
              <p>{t("contact.consent.privacyDoc.rightsDesc")}</p>
            </div>
          </div>
          <Button onClick={() => setPrivacyDialogOpen(false)} className="mt-4">
            {t("contact.consent.close")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Marketing Consent Dialog */}
      <Dialog open={marketingDialogOpen} onOpenChange={setMarketingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("contact.consent.marketingTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>{t("contact.consent.marketingDoc.intro")}</p>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.marketingDoc.info")}</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("contact.consent.marketingDoc.info1")}</li>
                <li>{t("contact.consent.marketingDoc.info2")}</li>
                <li>{t("contact.consent.marketingDoc.info3")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t("contact.consent.marketingDoc.withdraw")}</h4>
              <p>{t("contact.consent.marketingDoc.withdrawDesc")}</p>
            </div>
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
