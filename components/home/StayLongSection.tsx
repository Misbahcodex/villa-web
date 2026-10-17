"use client";

import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";

export function StayLongSection() {
  return (
    <section className="bg-[#10100F] text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Coworking Specifications */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                Coworking &amp; Productivity
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal leading-tight">
              Engineered for Focus. Refined for Living.
            </h2>

            <p className="text-muted-dark text-sm sm:text-base font-light leading-relaxed">
              Designed specifically for tech professionals, creators, and remote teams.
              Step out of your pod into high-speed meeting facilities, ergonomic desks, and uninterrupted connectivity.
            </p>

            <div className="space-y-4 pt-2 font-mono text-xs">
              <div className="flex items-start gap-3 border-t border-subtle/60 pt-3">
                <span className="text-accent">01</span>
                <div>
                  <h3 className="text-on-dark uppercase text-[11px] tracking-wider font-medium">500 Mbps High-Speed Wi-Fi</h3>
                  <p className="text-muted-dark font-sans text-xs font-light mt-0.5">
                    Fast, low-latency connectivity suited for video calls, builds, and remote deployments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-subtle/60 pt-3">
                <span className="text-accent">02</span>
                <div>
                  <h3 className="text-on-dark uppercase text-[11px] tracking-wider font-medium">Ergonomic Work Desks</h3>
                  <p className="text-muted-dark font-sans text-xs font-light mt-0.5">
                    Dedicated power outlets, USB ports, and comfortable seating in natural daylight.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-subtle/60 pt-3">
                <span className="text-accent">03</span>
                <div>
                  <h3 className="text-on-dark uppercase text-[11px] tracking-wider font-medium">Quiet Hours &amp; Meeting Space</h3>
                  <p className="text-muted-dark font-sans text-xs font-light mt-0.5">
                    Enforced quiet zones in residential wings and private meeting room access.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors"
              >
                <span>BOOK YOUR COWORKING STAY</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Coworking Photography */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/11] w-full rounded-sm overflow-hidden border border-subtle bg-surface shadow-2xl">
              <SiteImage
                slot="coworking-main"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base/60 via-transparent to-transparent pointer-events-none" />

              {/* Specification Overlay Badge */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-base/90 border border-subtle px-4 py-2.5 rounded-sm flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-accent block uppercase tracking-wider">Speed Rating</span>
                  <span className="text-on-dark font-medium">500 Mbps Ultra-Fast</span>
                </div>
                <div className="w-px h-8 bg-subtle" />
                <div>
                  <span className="text-[10px] text-accent block uppercase tracking-wider">Access</span>
                  <span className="text-on-dark font-medium">Included for all guests</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
