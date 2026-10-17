"use client";

import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";

export function ExperiencesDarkSection() {
  return (
    <section className="bg-base text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-subtle pb-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                Villa Living
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal">
              Poolside Calm &amp; Social Spaces
            </h2>
            <p className="text-muted-dark text-xs sm:text-sm font-light">
              Balance focused deep work with open-air relaxation. Enjoy our outdoor swimming pool, sun loungers, and communal resident kitchen.
            </p>
          </div>

          <Link
            href="/amenities"
            className="inline-flex items-center gap-2 border border-accent/40 hover:border-accent text-on-dark px-5 py-2.5 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors shrink-0"
          >
            <span>ALL AMENITIES</span>
            <span className="text-accent" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 2-Column Split Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 1: Outdoor Pool */}
          <div className="space-y-4 group">
            <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden border border-subtle bg-surface">
              <SiteImage
                slot="pool-main"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-base/80 px-3 py-1 text-[10px] font-mono tracking-widest uppercase text-accent border border-subtle">
                OUTDOOR SWIMMING POOL
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-on-dark font-normal">
                Open-Air Poolside Sanctuary
              </h3>
              <p className="text-muted-dark text-xs sm:text-sm font-light leading-relaxed">
                Take a swim or relax under the Dubai sun on shaded loungers. A serene oasis nestled in the villa grounds, away from city traffic.
              </p>
            </div>
          </div>

          {/* Feature 2: Resident Kitchen & Lounge */}
          <div className="space-y-4 group">
            <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden border border-subtle bg-surface">
              <SiteImage
                slot="cafe-detail"
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-base/80 px-3 py-1 text-[10px] font-mono tracking-widest uppercase text-accent border border-subtle">
                RESIDENT KITCHEN &amp; DINING
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-on-dark font-normal">
                Communal Kitchen &amp; Café Space
              </h3>
              <p className="text-muted-dark text-xs sm:text-sm font-light leading-relaxed">
                Modern resident kitchen with coffee prep area, communal dining tables, and comfortable seating to connect with fellow digital nomads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
