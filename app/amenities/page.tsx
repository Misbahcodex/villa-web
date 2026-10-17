import { Metadata } from "next";
import { CoworkingSection } from "@/components/home/CoworkingSection";
import { PoolSection } from "@/components/home/PoolSection";
import { SocialCafeSection } from "@/components/home/SocialCafeSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { secondaryAmenities } from "@/data/amenities";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Amenities & 500 Mbps Coworking",
  description:
    "Villa amenities in Dubai: 500 Mbps Wi-Fi coworking space, outdoor pool, social lounge/café, and comfortable spaces for digital nomads.",
};

export default function AmenitiesPage() {
  return (
    <div className="pt-28 sm:pt-36 bg-base text-on-dark min-h-screen">
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 pt-4 max-w-7xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3.5 py-1 rounded-sm text-xs text-accent font-mono tracking-wider uppercase">
          <span>★</span>
          <span>COWORKING SPACE &amp; VILLA AMENITIES</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-on-dark leading-tight font-normal">
          Coworking &amp; Outdoor Pool Amenities
        </h1>

        <p className="text-sm sm:text-base text-muted-dark max-w-3xl leading-relaxed font-light">
          Rizq Villa provides 500 Mbps Wi-Fi throughout the property, dedicated coworking rooms,
          an open-air swimming pool, and a social resident kitchen for remote creators and digital nomads.
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-dark pt-2 font-mono">
          <span className="text-accent">•</span>
          <span>All amenities fully included for direct guests • Code: {siteConfig.promoCode}</span>
        </div>
      </section>

      {/* Dominant Feature Sections */}
      <CoworkingSection />
      <PoolSection />
      <SocialCafeSection />

      {/* Full Grid of Comprehensive Villa Amenities */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-surface text-on-dark border-y border-subtle">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent block">
              Villa Inclusions
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-on-dark font-normal">
              Comforts &amp; Facilities
            </h2>
            <p className="text-sm text-muted-dark leading-relaxed font-light">
              Designed to support deep focus, remote work, and serene living in central Dubai.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryAmenities.map((amenity, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-base border border-subtle p-6 rounded-sm space-y-3 shadow-md hover:border-accent/40 transition-all font-mono"
                >
                  <div className="w-8 h-8 rounded-sm border border-accent/40 bg-surface flex items-center justify-center text-accent text-xs">
                    0{idx + 1}
                  </div>
                  <h3 className="font-serif text-lg text-on-dark uppercase tracking-tight font-normal">
                    {amenity.title}
                  </h3>
                  <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                    {amenity.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <FinalCTA />
    </div>
  );
}
