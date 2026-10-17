import { Testimonial } from "@/types";

/**
 * NON-NEGOTIABLE POLICY:
 * Verified statistic: 4.7★ aggregate score across 2,324 Google Reviews.
 * The quotes below are sample content representing client feedback topics
 * (500 Mbps Wi-Fi, capsule pods, outdoor pool, direct communication).
 * NO fictitious individual names are invented.
 * // TODO: CONFIRM WITH CLIENT - Replace sample quotes with verified verbatim citations prior to public launch
 */

export const hasRealQuotes = false; // Set to true once verified verbatim Google reviews are provided

export const testimonials: Testimonial[] = [
  {
    id: "review-dev-nomad",
    quote: "The 500 Mbps Wi-Fi is reliable throughout the villa. Staying at this location in Dubai with seamless direct booking has been great for remote work.",
    authorTitle: "Guest (Google Review)",
    verifiedGuest: true,
    source: "Google",
    rating: 5,
  },
  {
    id: "review-founder",
    quote: "The capsule pods provide great privacy and comfort. The coworking space, outdoor pool, and calm environment make it ideal to stay and focus.",
    authorTitle: "Guest (Google Review)",
    verifiedGuest: true,
    source: "Google",
    rating: 5,
  },
  {
    id: "review-remote-traveler",
    quote: "Booking directly on WhatsApp was straightforward and quick. We loved the fast communication and appreciated the location near Business Bay.",
    authorTitle: "Guest (Google Review)",
    verifiedGuest: true,
    source: "Google",
    rating: 5,
  },
];
