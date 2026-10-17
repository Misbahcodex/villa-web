import { siteConfig } from "@/data/site";
import { rooms } from "@/data/rooms";

export function generateLodgingBusinessJsonLd() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (isDemo) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: siteConfig.name,
    description: "Luxury villa-hostel in Dubai featuring capsule pods, private suites, 500 Mbps Wi-Fi, coworking space, and an outdoor pool.",
    url: siteUrl,
    telephone: `+${siteConfig.whatsappNumber}`,
    priceRange: `AED ${rooms[0].startingRateAED} - AED ${rooms[rooms.length - 1].startingRateAED}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.lat,
      longitude: siteConfig.geo.lng,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: siteConfig.rating.score,
      reviewCount: siteConfig.rating.reviews,
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "500 Mbps Wi-Fi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Outdoor Pool", value: true },
      { "@type": "LocationFeatureSpecification", name: "Coworking Space", value: true },
      { "@type": "LocationFeatureSpecification", name: "Social Lounge", value: true },
    ],
    containsPlace: rooms.map((r) => ({
      "@type": "HotelRoom",
      name: r.name,
      description: r.description,
      occupancy: {
        "@type": "QuantitativeValue",
        maxValue: r.maxGuests,
      },
    })),
  };
}
