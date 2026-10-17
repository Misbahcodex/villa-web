import { Room } from "@/types";
import { getImage } from "@/data/images";

export const rooms: Room[] = [
  {
    id: "premium-single-capsule",
    name: "Premium Single Capsule Pod",
    tagline: "Private capsule pod designed for solo travelers and focused work",
    description: "A private capsule pod within the villa, with access to the coworking space, outdoor pool, and 500 Mbps Wi-Fi.",
    maxGuests: 1,
    // TODO: CONFIRM WITH CLIENT - Exact bed configuration
    bedConfig: "Single capsule mattress",
    // TODO: CONFIRM WITH CLIENT - Exact base nightly rate in AED (Sample rate for demo)
    startingRateAED: 180,
    features: [
      { label: "Private capsule pod", icon: "Box" },
      { label: "500 Mbps Wi-Fi", icon: "Wifi" },
      { label: "Power outlet", icon: "Zap" },
      { label: "Air conditioning", icon: "Wind" },
      { label: "Outdoor pool access", icon: "Waves" },
      { label: "Coworking space access", icon: "Laptop" },
      { label: "Storage locker", icon: "Lock" },
      { label: "Shared washroom access", icon: "Droplets" },
    ],
    imageSlots: ["single-capsule-1", "single-capsule-2", "single-capsule-3"],
    images: ["single-capsule-1", "single-capsule-2", "single-capsule-3"].map((slot) => {
      const img = getImage(slot);
      return { slot, src: img.src, alt: img.alt };
    }),
  },
  {
    id: "deluxe-double-capsule",
    name: "Deluxe Double Capsule Pod",
    tagline: "Double capsule pod with added space for pairs or spacious solo stays",
    description: "A private capsule pod within the villa, with access to the coworking space, outdoor pool, and 500 Mbps Wi-Fi.",
    maxGuests: 2,
    // TODO: CONFIRM WITH CLIENT - Exact bed configuration
    bedConfig: "Double capsule mattress",
    // TODO: CONFIRM WITH CLIENT - Exact base nightly rate in AED (Sample rate for demo)
    startingRateAED: 260,
    highlight: "Most Popular",
    features: [
      { label: "Double capsule pod", icon: "Box" },
      { label: "500 Mbps Wi-Fi", icon: "Wifi" },
      { label: "Power outlet", icon: "Zap" },
      { label: "Air conditioning", icon: "Wind" },
      { label: "Outdoor pool access", icon: "Waves" },
      { label: "Coworking space access", icon: "Laptop" },
      { label: "Personal storage", icon: "Lock" },
      { label: "Social lounge / café access", icon: "Coffee" },
    ],
    imageSlots: ["double-capsule-1", "double-capsule-2", "double-capsule-3"],
    images: ["double-capsule-1", "double-capsule-2", "double-capsule-3"].map((slot) => {
      const img = getImage(slot);
      return { slot, src: img.src, alt: img.alt };
    }),
  },
  {
    id: "executive-private-suite",
    name: "Executive Private Suite",
    tagline: "Private suite with work desk and comfortable stay setup",
    description: "A spacious private suite within the villa, with access to the coworking space, outdoor pool, and 500 Mbps Wi-Fi.",
    maxGuests: 2,
    // TODO: CONFIRM WITH CLIENT - Exact bed configuration
    bedConfig: "Private suite bed",
    // TODO: CONFIRM WITH CLIENT - Exact base nightly rate in AED (Sample rate for demo)
    startingRateAED: 540,
    highlight: "Private",
    features: [
      { label: "Private villa suite", icon: "Home" },
      { label: "Work desk setup", icon: "Laptop" },
      { label: "500 Mbps Wi-Fi", icon: "Wifi" },
      { label: "Outdoor pool access", icon: "Waves" },
      { label: "Social lounge / café access", icon: "Coffee" },
      { label: "Air conditioning", icon: "Wind" },
      { label: "Terrace access", icon: "Sun" },
    ],
    imageSlots: ["executive-suite-1", "executive-suite-2", "executive-suite-3"],
    images: ["executive-suite-1", "executive-suite-2", "executive-suite-3"].map((slot) => {
      const img = getImage(slot);
      return { slot, src: img.src, alt: img.alt };
    }),
  },
];
