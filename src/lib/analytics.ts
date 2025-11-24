// Analytics tracking utilities for NEURALTWIN

export const trackPageView = (pageName: string, funnelStep?: number) => {
  if (typeof window !== 'undefined') {
    console.log(`[Analytics] Page View: ${pageName}`, funnelStep ? `Step ${funnelStep}` : '');
    // Future: Add Google Analytics, Mixpanel, or other tracking
  }
};

export const trackFunnelStep = (step: number | string, action?: string) => {
  if (typeof window !== 'undefined') {
    console.log(`[Analytics] Funnel Step ${step}:`, action);
    // Future: Add conversion funnel tracking
  }
};

export const trackCTAClick = (ctaName: string, destination: string, funnelStep?: number) => {
  if (typeof window !== 'undefined') {
    console.log(`[Analytics] CTA Click: ${ctaName} -> ${destination}`, funnelStep ? `Step ${funnelStep}` : '');
    // Future: Add CTA tracking
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    console.log(`[Analytics] Event: ${eventName}`, properties);
    // Future: Add event tracking
  }
};

export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', { buttonName, location });
};
