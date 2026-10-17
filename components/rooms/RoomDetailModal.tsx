"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { Room } from "@/types";
import { formatAED, calculateDiscount } from "@/lib/pricing";
import { siteConfig } from "@/data/site";

interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
}

export function RoomDetailModal({ room, onClose }: RoomDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (room) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [room, onClose]);

  if (!room) return null;

  const directDiscount = calculateDiscount(room.startingRateAED, siteConfig.discountPercent);
  const directRate = room.startingRateAED - directDiscount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-subtle rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-sm bg-base/80 hover:bg-base text-muted-dark hover:text-on-dark border border-subtle flex items-center justify-center font-mono text-xs transition-colors focus-visible:outline-none"
        >
          ✕
        </button>

        {/* Modal Hero Image */}
        <div className="relative aspect-[16/9] w-full bg-base overflow-hidden">
          <SiteImage
            slot={room.imageSlots?.[0] || room.images[0]?.slot || "hero-main"}
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent pointer-events-none" />
          {room.highlight && (
            <div className="absolute bottom-4 left-6 bg-base/90 border border-accent/40 text-accent text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-sm shadow-md">
              {room.highlight}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs font-mono text-muted-dark">
              <span>Max {room.maxGuests} {room.maxGuests === 1 ? "Guest" : "Guests"}</span>
              <span>•</span>
              <span>{room.bedConfig}</span>
            </div>

            <h2 id="modal-room-title" className="font-serif text-2xl sm:text-3xl uppercase tracking-tight text-on-dark font-normal">
              {room.name}
            </h2>
            <p className="text-sm text-muted-dark leading-relaxed font-light">
              {room.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="space-y-3 pt-2 border-t border-subtle">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent block">
              Space Inclusions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {room.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-base/70 border border-subtle p-3 rounded-sm flex items-center gap-2.5 text-xs text-on-dark font-mono"
                >
                  <span className="text-accent">✓</span>
                  <span>{feat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Offer Box */}
          <div className="bg-base border border-subtle p-4 sm:p-5 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center gap-2 text-xs text-accent uppercase tracking-wider">
                <span>★</span>
                <span>Direct Privilege (Code: {siteConfig.promoCode})</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono font-medium text-2xl text-on-dark">
                  {formatAED(directRate)}
                </span>
                <span className="text-xs text-muted-dark line-through font-light">
                  {formatAED(room.startingRateAED)}
                </span>
                <span className="text-xs text-muted-dark">/ night</span>
                <span className="text-[10px] text-muted-dark ml-2">Sample rate</span>
              </div>
            </div>

            <Link
              href={`/book?room=${room.id}`}
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors shadow-lg"
            >
              <span>Book Direct</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
