import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackContactForm, trackFunnelStep } from "@/lib/analytics";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    stores: "",
    features: [] as string[],
    timeline: "",
    message: "",
  });

  useEffect(() => {
    // Track page view with funnel step 3 (contact)
    trackPageView("Contact", 3);
    trackFunnelStep(3, "view_contact");
    trackContactForm("start");
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
              <p className="text-xl text-muted-foreground">{t("contact.subtitle")}</p>

              {/* Lead Magnet with Pulse Animation */}
              <div className="inline-flex items-center justify-center px-6 py-3 mt-4 rounded-full bg-primary/10 border border-primary/30 animate-pulse">
                <span className="text-primary font-semibold">{t("contact.leadMagnet")}</span>
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

                <Card className="glass p-6 border-primary/30 bg-primary/5">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">{t("contact.noticeLine1")}</p>
                    <p className="text-sm font-medium">{t("contact.noticeLine2")}</p>
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

      <Footer />
    </div>
  );
};

export default Contact;
