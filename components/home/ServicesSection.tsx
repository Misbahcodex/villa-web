"use client";

import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";

export function ServicesSection() {
  return (
    <section id="overview" className="bg-base text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Architectural Story & Facts */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                The Residence Concept
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal leading-tight">
              Space to Focus. Room to Unwind.
            </h2>

            <p className="text-muted-dark text-sm sm:text-base font-light leading-relaxed">
              Rizq Luxurious Villa is a distinctive boutique property situated on the border of Al Quoz and Business Bay, 
              moments from Downtown Dubai. Designed as an intentional residence for digital nomads, solo creators, and discerning travelers, 
              the villa bridges private capsule accommodation with communal luxury.
            </p>

            {/* Verified Facts Ticker */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-subtle/60 font-mono">
              <div className="space-y-1">
                <span className="text-accent text-xl sm:text-2xl font-serif">4.7★</span>
                <p className="text-[10px] uppercase tracking-wider text-muted-dark">2,324 Reviews</p>
              </div>
              <div className="space-y-1">
                <span className="text-accent text-xl sm:text-2xl font-serif">500</span>
                <p className="text-[10px] uppercase tracking-wider text-muted-dark">Mbps Wi-Fi</p>
              </div>
              <div className="space-y-1">
                <span className="text-accent text-xl sm:text-2xl font-serif">18+</span>
                <p className="text-[10px] uppercase tracking-wider text-muted-dark">Adults Only</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 border border-accent/40 hover:border-accent text-on-dark px-5 py-2.5 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors"
              >
                <span>EXPLORE ACCOMMODATIONS</span>
                <span className="text-accent" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Layered Architectural Photography */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-subtle bg-surface">
                  <SiteImage
                    slot="cafe-main"
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-base/80 px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase text-muted-dark border border-subtle">
                    SOCIAL LOUNGE
                  </div>
                </div>
                <div className="p-4 bg-surface border border-subtle rounded-sm space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-accent">Quiet Living</span>
                  <p className="text-xs text-muted-dark font-light">
                    Designed for rest and productive flow with dedicated silent workspaces.
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:pt-10">
                <div className="p-4 bg-surface border border-subtle rounded-sm space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-accent">Central Location</span>
                  <p className="text-xs text-muted-dark font-light">
                    Strategically placed between Dubai&apos;s cultural district and Business Bay commerce.
                  </p>
                </div>
                <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-subtle bg-surface">
                  <SiteImage
                    slot="coworking-main"
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-base/80 px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase text-muted-dark border border-subtle">
                    COWORKING STUDIO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
