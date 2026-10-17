"use client";

import { useState } from "react";
import Image from "next/image";
import { getImage } from "@/data/images";

export interface SiteImageProps {
  slot: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  quality?: number;
}

export function SiteImage({
  slot,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  fill = true,
  width,
  height,
  className = "",
  alt: customAlt,
  quality = 85,
}: SiteImageProps) {
  const config = getImage(slot);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(config.src);

  const effectiveAlt = customAlt || config.alt;
  const objectPosition = config.focalPoint || "50% 50%";

  const handleError = () => {
    if (currentSrc !== "/images/hero-villa.jpg") {
      setCurrentSrc("/images/hero-villa.jpg");
    } else {
      setHasError(true);
    }
  };

  const isPriority = slot === "hero-main" ? true : priority;
  const hasBlur = !!config.blurDataURL && !currentSrc.endsWith(".svg") && currentSrc === config.src;

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col justify-between p-6 bg-surface border border-subtle text-muted-dark overflow-hidden ${className}`}
      >
        <div className="text-[10px] tracking-widest uppercase text-accent font-sans">
          Rizq Luxurious Villa
        </div>
        <div className="my-auto text-center py-6">
          <p className="font-serif text-lg text-on-dark tracking-wide">{effectiveAlt}</p>
          <p className="text-[11px] uppercase tracking-widest text-accent-cool mt-1">
            Boutique Residence Dubai
          </p>
        </div>
        <div className="text-[9px] tracking-widest uppercase text-accent-cool flex justify-between border-t border-subtle/50 pt-3">
          <span>Al Quoz / Business Bay</span>
          <span>Dubai UAE</span>
        </div>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={currentSrc}
        alt={effectiveAlt}
        fill
        priority={isPriority}
        sizes={sizes}
        quality={quality}
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={hasBlur ? config.blurDataURL : undefined}
        onError={handleError}
        className={`object-cover ${className}`}
        style={{ objectPosition }}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={effectiveAlt}
      width={width || config.width || 1200}
      height={height || config.height || 800}
      priority={isPriority}
      sizes={sizes}
      quality={quality}
      placeholder={hasBlur ? "blur" : "empty"}
      blurDataURL={hasBlur ? config.blurDataURL : undefined}
      onError={handleError}
      className={`object-cover ${className}`}
      style={{ objectPosition }}
    />
  );
}
