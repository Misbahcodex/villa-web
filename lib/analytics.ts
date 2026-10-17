/**
 * Stubs for Google Analytics 4 (GA4) / Meta Pixel events.
 * Safe to call on client-side and server-side.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | { name: "direct_booking_click"; params: { ref?: string; roomId: string; roomName: string; nights: number; estimatedTotalAED: number } }
  | { name: "promo_copied"; params: { promoCode: string; discountPercent: number; location: string } }
  | { name: "room_viewed"; params: { roomId: string; roomName: string; startingRateAED: number } }
  | { name: "whatsapp_opened"; params: { roomId: string; estimatedTotalAED: number; directDiscount: number } }
  | { name: "inquiry_submitted"; params: { ref?: string; roomId: string; nights: number; estimatedTotalAED: number } };

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  // GA4 gtag dispatch
  if (typeof window.gtag === "function") {
    window.gtag("event", event.name, event.params);
  }

  // Developer feedback in non-production or demo mode
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    // eslint-disable-next-line no-console
    console.debug(`[Analytics Event: ${event.name}]`, event.params);
  }
}
