import { SiteConfig, DirectBenefit } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Rizq Luxurious Villa",
  // TODO: CONFIRM WITH CLIENT - WhatsApp contact number (digits only with country code, e.g. 971XXXXXXXXX)
  whatsappNumber: "971500000000",
  promoCode: "RIZQDIRECT",
  discountPercent: 15,
  rating: {
    score: 4.7,
    reviews: 2324,
    source: "Google",
  },
  // TODO: CONFIRM WITH CLIENT - Exact street address and villa number
  address: "Al Quoz / Business Bay Border, Dubai, United Arab Emirates",
  locationNote: "Strategic position on the Al Quoz / Business Bay border, minutes from Downtown Dubai and Burj Khalifa.",
  geo: {
    lat: 25.1575396,
    lng: 55.2702367,
  },
  currency: "AED",
  // TODO: CONFIRM WITH CLIENT - Standard check-in and check-out times
  checkInTime: "15:00",
  // TODO: CONFIRM WITH CLIENT - Standard check-out time
  checkOutTime: "11:00",
  // TODO: CONFIRM WITH CLIENT - Official contact and reservations email
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "reservations@example.com",
  demoNotice: "Design concept, not the official website",
  proposedDirectOfferNotice: "Proposed direct offer: 15% off, code RIZQDIRECT",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  retentionPeriodDays: 90,
};

export const directBenefits: DirectBenefit[] = [
  {
    title: "15% Direct Booking Privilege",
    description: "Save 15% immediately on all stays using code RIZQDIRECT when reserving directly with our team.",
    icon: "BadgePercent",
  },
  {
    title: "Direct Host Guarantee",
    description: "Your reservation request is handled directly by our on-site team with personalized assistance and fast confirmation.",
    icon: "ShieldCheck",
  },
  {
    title: "Direct WhatsApp Concierge",
    description: "Priority WhatsApp communication with our on-site team for fast check-in coordination and room requests.",
    icon: "MessageSquare",
  },
  {
    title: "Flexible Priority Allocation",
    description: "Direct guests receive top priority for pod and suite locations, early check-in or late checkout upon availability.",
    icon: "Clock",
  },
];
