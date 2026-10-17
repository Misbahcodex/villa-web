import generatedData from "./images.generated.json";

export interface SiteImage {
  slot: string;                 // unique id, e.g. "hero-main"
  src: string;                  // raster path (.jpg, .png, .webp)
  fallbackSrc: string;          // fallback raster
  alt: string;                  // descriptive, accessibility-grade, factual
  width: number;
  height: number;
  focalPoint?: string;          // CSS object-position, e.g. "50% 40%"
  status: "provided" | "missing";
  blurDataURL?: string;
}

export const images: Record<string, SiteImage> = generatedData as Record<string, SiteImage>;

/**
 * High-resolution raster photography overrides mapped from /public/images/
 */
export const imageOverrides: Record<string, string> = {
  "hero-main": "/images/hero-villa.jpg",
  "exterior-front": "/images/hero-villa.jpg",
  "pool-main": "/images/hero-villa.jpg",
  "pool-detail": "/images/hero-villa.jpg",
  "coworking-main": "/images/meetting-room.jpg",
  "coworking-detail": "/images/meetting-room.jpg",
  "cafe-main": "/images/living-and-dining-space.jpg",
  "cafe-detail": "/images/modern-kitchen.jpg",
  "lounge-community": "/images/living-and-dining-space.jpg",
  "single-capsule-1": "/images/rizq-villa-luxury-dorm.jpg",
  "single-capsule-2": "/images/rizq-villa-luxury-dorm.jpg",
  "double-capsule-1": "/images/rizq-villa-luxury-dorm.jpg",
  "double-capsule-2": "/images/rizq-villa-luxury-dorm.jpg",
  "executive-suite-1": "/images/living-and-dining-space.jpg",
  "executive-suite-2": "/images/bathroom.jpg",
};

export function getImage(slot: string): SiteImage {
  const base = images[slot] || {
    slot,
    src: "/images/hero-villa.jpg",
    fallbackSrc: "/images/hero-villa.jpg",
    alt: "Rizq Luxurious Villa Dubai",
    width: 1200,
    height: 800,
    focalPoint: "50% 50%",
    status: "missing" as const,
  };

  const override = imageOverrides[slot];
  if (override) {
    return {
      ...base,
      src: override,
      status: "provided",
    };
  }

  // If the base src points to an svg, replace it with hero-villa.jpg
  if (base.src.endsWith(".svg")) {
    return {
      ...base,
      src: "/images/hero-villa.jpg",
    };
  }

  return base;
}
