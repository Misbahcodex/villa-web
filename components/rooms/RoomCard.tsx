"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { Room } from "@/types";
import { formatAED, calculateDiscount } from "@/lib/pricing";
import { siteConfig } from "@/data/site";
import { trackEvent } from "@/lib/analytics";

interface RoomCardProps {
  room: Room;
  onOpenDetails?: (room: Room) => void;
}

export function RoomCard({ room, onOpenDetails }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFeatures, setExpandedFeatures] = useState(false);

  const directDiscount = calculateDiscount(room.startingRateAED, siteConfig.discountPercent);
  const directRate = room.startingRateAED - directDiscount;

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  const handleBookClick = () => {
    trackEvent({
      name: "room_viewed",
      params: {
        roomId: room.id,
        roomName: room.name,
        startingRateAED: directRate,
      },
    });
  };

  const visibleFeatures = expandedFeatures ? room.features : room.features.slice(0, 4);
  const remainingCount = room.features.length - 4;

  return (
    <article
      className="bg-surface border border-subtle rounded-sm overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300 group shadow-xl"
      aria-label={room.name}
    >
      <div>
        {/* Image Carousel */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={`Image gallery for ${room.name}`}
          className="relative aspect-[4/3] w-full bg-base overflow-hidden"
        >
          <SiteImage
            slot={room.imageSlots?.[currentImageIndex] || room.images[currentImageIndex]?.slot || "hero-main"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-700 group-hover:scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base/70 via-transparent to-transparent pointer-events-none" />

          {/* Highlight Badge */}
          {room.highlight && (
            <div className="absolute top-3 left-3 bg-base/90 border border-accent/40 text-accent text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-sm shadow-md">
              {room.highlight}
            </div>
          )}

          {/* Direct Offer Badge */}
          <div className="absolute top-3 right-3 bg-base/90 border border-subtle text-accent text-[9px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-sm backdrop-blur-sm">
            ★ SAVE 15% DIRECT
          </div>

          {/* Carousel Arrows */}
          {room.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label={`Previous image for ${room.name}`}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-sm bg-base/80 hover:bg-base text-on-dark border border-subtle flex items-center justify-center font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label={`Next image for ${room.name}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-sm bg-base/80 hover:bg-base text-on-dark border border-subtle flex items-center justify-center font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
              >
                →
              </button>

              {/* Indicator dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {room.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-0.5 rounded-full transition-all ${
                      idx === currentImageIndex ? "w-4 bg-accent" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Metadata chips */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-dark">
            <span>Max {room.maxGuests} {room.maxGuests === 1 ? "Guest" : "Guests"}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">{room.bedConfig}</span>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-on-dark group-hover:text-accent transition-colors font-normal">
              {room.name}
            </h3>
            <p className="text-xs text-muted-dark line-clamp-2 mt-1.5 leading-relaxed font-light">
              {room.tagline}
            </p>
          </div>

          {/* Feature Tags */}
          <div className="pt-2 border-t border-subtle/50">
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 bg-base text-accent border border-subtle px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase">
                <span>•</span> Adults only
              </span>
              {visibleFeatures.map((feat, idx) => {
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-base text-muted-dark border border-subtle px-2 py-0.5 rounded-sm text-[10px] font-mono"
                  >
                    <span>•</span>
                    <span>{feat.label}</span>
                  </span>
                );
              })}

              {!expandedFeatures && remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedFeatures(true)}
                  className="text-[10px] text-accent hover:text-accent-strong font-mono px-1 py-0.5"
                >
                  +{remainingCount} more
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Pricing Block */}
      <div className="p-6 pt-0 space-y-4">
        {/* Computed Pricing Block */}
        <div className="bg-base/70 p-3.5 rounded-sm border border-subtle flex items-baseline justify-between font-mono">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-medium text-xl text-on-dark">
                {formatAED(directRate)}
              </span>
              <span className="text-xs text-muted-dark line-through font-light">
                {formatAED(room.startingRateAED)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-accent uppercase tracking-wider">
                Direct Privilege
              </span>
              <span className="text-[10px] text-muted-dark">
                • Sample rate
              </span>
            </div>
          </div>

          <span className="text-xs text-muted-dark">/ night</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {onOpenDetails && (
            <button
              type="button"
              onClick={() => onOpenDetails(room)}
              className="w-full text-center py-2.5 px-3 rounded-sm text-xs font-mono uppercase tracking-widest text-on-dark hover:border-accent border border-subtle transition-colors"
            >
              Details
            </button>
          )}

          <Link
            href={`/book?room=${room.id}`}
            onClick={handleBookClick}
            className={`w-full text-center py-2.5 px-3 rounded-sm text-xs font-mono uppercase tracking-widest bg-accent hover:bg-accent-strong text-base transition-colors flex items-center justify-center gap-1.5 shadow-md ${
              !onOpenDetails ? "col-span-2" : ""
            }`}
          >
            <span>Book Direct</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
