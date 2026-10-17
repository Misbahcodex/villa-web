import { AmenityCategory } from "@/types";

export const amenityCategories: AmenityCategory[] = [
  {
    id: "coworking",
    title: "Coworking Space",
    eyebrow: "Work & Connectivity",
    description: "A comfortable coworking space inside the villa equipped with 500 Mbps Wi-Fi, designed for digital nomads, developers, and remote travelers who need a reliable work environment.",
    badge: "500 Mbps Wi-Fi",
    specs: [
      { label: "Wi-Fi Speed", value: "500 Mbps Wi-Fi" },
      { label: "Work Area", value: "Work Desks" },
      { label: "Power", value: "Power Outlets" },
      { label: "Calling Area", value: "Call Area" },
      { label: "Access", value: "Villa Residents" },
      { label: "Environment", value: "Coworking Space" },
    ],
    bullets: [
      "Reliable 500 Mbps Wi-Fi connection for remote work, video calls, and daily tasks.",
      "Indoor work tables and seating located inside the villa.",
      "Direct proximity to the outdoor pool and social lounge during work breaks.",
    ],
    imageSlot: "coworking-main",
  },
  {
    id: "pool",
    title: "Outdoor Swimming Pool",
    eyebrow: "Relaxation & Downtime",
    description: "An outdoor swimming pool located on the villa grounds, providing a refreshing setting to relax during your stay in Dubai.",
    badge: "Outdoor Pool",
    specs: [
      { label: "Facility", value: "Outdoor Swimming Pool" },
      { label: "Wi-Fi", value: "500 Mbps Wi-Fi" },
      { label: "Hours", value: "Daily Access" },
      { label: "Seating", value: "Poolside Seating" },
    ],
    bullets: [
      "Outdoor swimming pool located on the villa grounds.",
      "Poolside space for relaxing between work sessions.",
      "500 Mbps Wi-Fi accessible across the villa grounds.",
    ],
    imageSlot: "pool-main",
  },
  {
    id: "cafe",
    title: "Social Lounge & Café",
    eyebrow: "Community & Shared Spaces",
    description: "A shared social lounge and café area where guests can relax, enjoy coffee, prepare food in the shared kitchen, and meet fellow travelers.",
    badge: "Social Lounge & Café",
    specs: [
      { label: "Space", value: "Social Lounge & Café" },
      { label: "Kitchen Area", value: "Shared Kitchen" },
      { label: "Coffee", value: "Coffee Available" },
      { label: "Seating", value: "Lounge Seating" },
    ],
    bullets: [
      "Shared lounge space for informal conversation and relaxation.",
      "Communal kitchen facilities available for resident use.",
      "Indoor seating suited for both quiet downtime and casual meetups.",
    ],
    imageSlot: "cafe-main",
  },
];

export const secondaryAmenities = [
  {
    title: "Secure Access",
    description: "Secure entry to private capsules, suites, and villa grounds.",
    icon: "KeyRound",
  },
  {
    title: "Showers & Bathrooms",
    description: "Clean, modern shared washroom facilities.",
    icon: "ShowerHead",
  },
  {
    title: "Luggage Storage",
    description: "Luggage storage space available for early arrivals and late departures.",
    icon: "ShieldAlert",
  },
  {
    title: "Housekeeping",
    description: "Regular housekeeping service maintaining clean spaces.",
    icon: "Sparkles",
  },
  {
    title: "Central Dubai Location",
    description: "Situated on the Al Quoz / Business Bay border near Downtown Dubai and Burj Khalifa.",
    icon: "Navigation",
  },
];
