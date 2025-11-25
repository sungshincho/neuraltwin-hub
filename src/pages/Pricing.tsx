import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trackPageView, trackFunnelStep, trackCTAClick } from "@/lib/analytics";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const [annual, setAnnual] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Track page view
    trackPageView('Pricing');
    trackFunnelStep(1, 'view_pricing');
  }, []);

  const plans = [
    {
      nameKey: "store.name",
      price: annual ? 3000 : 300,
      period: annual ? t("pricing.annually") : t("pricing.monthly"),
      descriptionKey: "store.description",
      featuresKeys: ["store.feature1", "store.feature2", "store.feature3", "store.feature4", "store.feature5", "store.feature6"],
    },
    {
      nameKey: "hq.name",
      price: annual ? 6000 : 600,
      period: annual ? t("pricing.annually") : t("pricing.monthly"),
      descriptionKey: "hq.description",
      featuresKeys: ["hq.feature1", "hq.feature2", "hq.feature3", "hq.feature4", "hq.feature5", "hq.feature6", "hq.feature7"],
      recommended: true,
    },
  ];

  const addons = [
    { nameKey: "addons.consulting", priceKey: "addons.consultingPrice", descriptionKey: "addons.consultingDesc" },
    { nameKey: "addons.aiSimulation", priceKey: "addons.aiSimulationPrice", descriptionKey: "addons.aiSimulationDesc" },
    { nameKey: "addons.decisionAssist", priceKey: "addons.decisionAssistPrice", descriptionKey: "addons.decisionAssistDesc" },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="gradient-text">{t("pricing.title")}</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("pricing.subtitle")}
            </p>

            {/* Annual Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Label htmlFor="annual-toggle" className={!annual ? "text-foreground" : "text-muted-foreground"}>
                {t("pricing.monthly")}
              </Label>
              <Switch id="annual-toggle" checked={annual} onCheckedChange={setAnnual} />
              <Label htmlFor="annual-toggle" className={annual ? "text-foreground" : "text-muted-foreground"}>
                {t("pricing.annually")} <span className="text-primary">({t("pricing.annualSave")})</span>
              </Label>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`glass p-8 relative flex flex-col ${
                  plan.recommended ? "border-2 border-primary glow" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                    {t("pricing.recommended") || "Recommended"}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{t(`pricing.${plan.nameKey}`)}</h3>
                  <p className="text-muted-foreground text-sm">{t(`pricing.${plan.descriptionKey}`)}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold gradient-text">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.featuresKeys.map((featureKey, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{t(`pricing.${featureKey}`)}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  asChild 
                  className="w-full" 
                  onClick={() => trackCTAClick('get_started_pricing', '/subscribe', 3)}
                >
                  <Link to="/subscribe">{t("pricing.cta")}</Link>
                </Button>
              </Card>
            ))}
          </div>

          {/* Enterprise Contact Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <Card className="glass p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">{t("pricing.enterprise.name")}</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {t("pricing.enterprise.description")}
              </p>
              <Button 
                asChild 
                size="lg"
                className="glow"
                onClick={() => trackCTAClick('enterprise_contact', '/contact', 3)}
              >
                <Link to="/contact">문의하기</Link>
              </Button>
            </Card>
          </div>

          {/* Add-ons */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">{t("pricing.addons.title")}</h2>
            <p className="text-center text-muted-foreground mb-8">{t("pricing.addons.subtitle")}</p>
            <div className="grid md:grid-cols-3 gap-6">
              {addons.map((addon, index) => (
                <Card key={index} className="glass p-6">
                  <h3 className="font-semibold text-lg mb-2">{t(`pricing.${addon.nameKey}`)}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t(`pricing.${addon.descriptionKey}`)}</p>
                  <p className="text-primary font-semibold">{t(`pricing.${addon.priceKey}`)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;