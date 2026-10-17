import { SiteConfig, DirectBenefit } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Rizq Luxurious Villa",
  whatsappNumber: "971554678589",
  promoCode: "RIZQDIRECT",
  discountPercent: 15,
  rating: {
    score: 4.7,
    reviews: 2324,
    source: "Google",
  },
  address: "Business Bay, Dubai, United Arab Emirates",
  locationNote: "In the heart of Business Bay, Dubai — minutes from Burj Khalifa & Dubai Mall.",
  geo: {
    lat: 25.1575396,
    lng: 55.2702367,
  },
  currency: "AED",
  checkInTime: "15:00",
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
