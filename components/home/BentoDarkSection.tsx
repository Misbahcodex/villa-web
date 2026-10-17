"use client";

import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { rooms } from "@/data/rooms";

export function BentoDarkSection() {
  return (
    <section className="bg-base text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-subtle pb-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                Accommodations
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal">
              Curated Private Spaces
            </h2>
            <p className="text-muted-dark text-xs sm:text-sm font-light">
              Each unit provides dedicated sleeping comfort, personal storage, and complete access to shared coworking, pool, and resident lounge.
            </p>
          </div>

          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 border border-accent/40 hover:border-accent text-on-dark px-5 py-2.5 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors shrink-0"
          >
            <span>VIEW ALL OPTIONS</span>
            <span className="text-accent" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room, index) => {
            const imageSlot = room.imageSlots[0] || "single-capsule-1";
            return (
              <div
                key={room.id}
                className="group bg-surface border border-subtle rounded-sm overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[16/11] w-full bg-base overflow-hidden">
                    <SiteImage
                      slot={imageSlot}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {room.highlight && (
                      <div className="absolute top-3 left-3 bg-base/90 border border-accent/40 text-accent text-[9px] font-mono uppercase tracking-widest px-2.5 py-1">
                        {room.highlight}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-base/80 border border-subtle px-2 py-0.5 text-[10px] font-mono text-muted-dark">
                      0{index + 1}
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-serif text-xl sm:text-2xl text-on-dark font-normal">
                        {room.name}
                      </h3>
                      <p className="text-xs text-muted-dark font-light line-clamp-2">
                        {room.description}
                      </p>
                    </div>

                    {/* Room Feature Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-subtle/50 text-[10px] font-mono text-muted-dark">
                      <span className="border border-subtle/80 px-2 py-0.5 rounded-sm">
                        Max {room.maxGuests} Guest{room.maxGuests > 1 ? "s" : ""}
                      </span>
                      <span className="border border-subtle/80 px-2 py-0.5 rounded-sm">
                        500 Mbps Wi-Fi
                      </span>
                      <span className="border border-subtle/80 px-2 py-0.5 rounded-sm">
                        Pool Access
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action & Rate */}
                <div className="p-6 pt-0 border-t border-subtle/40 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-dark block">
                      From
                    </span>
                    <span className="text-base sm:text-lg font-mono font-medium text-on-dark">
                      AED {room.startingRateAED}
                    </span>
                    <span className="text-[10px] font-mono text-muted-dark"> / night*</span>
                  </div>

                  <Link
                    href={`/book?room=${room.id}`}
                    className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-base px-4 py-2 rounded-sm text-xs font-mono font-medium tracking-wider uppercase transition-colors"
                  >
                    <span>RESERVE</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sample Rate Disclosure Note */}
        <div className="text-center pt-2">
          <p className="text-[11px] font-mono text-muted-dark">
            *Sample rates shown for demonstration; confirmed upon booking request with the residence.
          </p>
        </div>
      </div>
    </section>
  );
}
