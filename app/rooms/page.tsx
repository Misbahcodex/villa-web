import { Metadata } from "next";
import { RoomGrid } from "@/components/rooms/RoomGrid";
import { CompareStrip } from "@/components/rooms/CompareStrip";
import { siteConfig } from "@/data/site";
import { secondaryAmenities } from "@/data/amenities";

export const metadata: Metadata = {
  title: "Accommodations & Capsule Pods",
  description:
    "Explore our single capsules, deluxe double pods, and executive private suite in Dubai. Direct booking saves 15% with code RIZQDIRECT.",
};

export default function RoomsPage() {
  return (
    <div className="pt-28 sm:pt-36 bg-base text-on-dark min-h-screen">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 pt-4 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3 py-1 rounded-sm text-xs text-accent font-mono tracking-wider uppercase">
            <span>★</span>
            <span>DIRECT PRIVILEGE: 15% OFF (CODE: {siteConfig.promoCode})</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-surface border border-subtle px-3 py-1 rounded-sm text-xs text-muted-dark font-mono tracking-wider uppercase">
            <span>•</span>
            <span>ADULTS ONLY RESIDENCE</span>
          </div>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-on-dark leading-tight font-normal">
          Capsule Pods &amp; Private Suites
        </h1>

        <p className="text-sm sm:text-base text-muted-dark max-w-3xl leading-relaxed font-light">
          Designed for focus, privacy, and restful comfort. Every reservation includes full access to our
          500 Mbps Wi-Fi coworking space, outdoor swimming pool, and social resident lounge.
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-dark pt-2 font-mono">
          <span className="text-accent">•</span>
          <span>Book direct and save 15% with code RIZQDIRECT • WhatsApp reservation coordination • Adults only</span>
        </div>
      </section>

      {/* Grid of 3 Rooms */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-t border-subtle">
        <div className="max-w-7xl mx-auto">
          <RoomGrid />
        </div>
      </section>

      {/* Included Standards & Amenities */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-surface text-on-dark border-t border-subtle">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent block">
              Villa Inclusions
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl uppercase tracking-tight text-on-dark font-normal">
              Standard Across All Accommodations
            </h2>
            <p className="text-sm text-muted-dark leading-relaxed font-light">
              Whether staying in a single capsule pod or our master villa suite, you enjoy full access to the
              residence&apos;s core productive and wellness amenities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondaryAmenities.slice(0, 4).map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-base p-6 rounded-sm border border-subtle shadow-sm space-y-3 font-mono"
                >
                  <div className="w-8 h-8 rounded-sm border border-accent/40 bg-surface flex items-center justify-center text-accent text-xs">
                    0{idx + 1}
                  </div>
                  <h3 className="font-serif text-lg uppercase tracking-tight text-on-dark font-normal">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Strip */}
      <CompareStrip />
    </div>
  );
}
