import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { amenityCategories } from "@/data/amenities";

export function CoworkingSection() {
  const data = amenityCategories.find((a) => a.id === "coworking");
  if (!data) return null;

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Presentation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden border border-subtle bg-surface shadow-xl group">
              <SiteImage
                slot={data.imageSlot}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="group-hover:scale-105 transition-transform duration-700 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base/60 via-transparent to-transparent pointer-events-none" />

              {/* Speed Gauge Callout Badge - Typographic Luxury Pill */}
              <div className="absolute bottom-6 left-6 right-6 bg-surface/95 border border-subtle backdrop-blur-md p-4 sm:p-5 rounded-sm flex items-center justify-between gap-4 shadow-xl font-mono">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-sm border border-accent/40 bg-base flex flex-col items-center justify-center text-accent">
                    <span className="text-[9px] uppercase tracking-wider">Wi-Fi</span>
                    <span className="text-xs font-bold">500</span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-2xl sm:text-3xl text-on-dark">
                        500
                      </span>
                      <span className="text-xs tracking-wider text-accent uppercase font-mono">
                        Mbps Wi-Fi
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-dark">
                      High-speed synchronous connection
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block text-right border-l border-subtle pl-4">
                  <span className="text-[11px] uppercase tracking-wider text-on-dark block">
                    High-Speed
                  </span>
                  <span className="text-[10px] text-muted-dark">Dedicated Coworking</span>
                </div>
              </div>
            </div>

            {/* Spec Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-subtle px-3.5 py-2.5 rounded-sm flex flex-col shadow-sm font-mono"
                >
                  <span className="text-[10px] uppercase tracking-wider text-muted-dark">
                    {spec.label}
                  </span>
                  <span className="text-xs text-on-dark mt-0.5">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent block">
                {data.eyebrow}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal leading-tight">
                {data.title}
              </h2>
              <p className="text-sm text-muted-dark font-light leading-relaxed">
                {data.description}
              </p>
            </div>

            {/* Bullets */}
            <ul className="space-y-3 pt-2 text-xs text-muted-dark font-mono">
              {data.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-accent">•</span>
                  <span className="text-on-dark/90 leading-normal font-sans font-light">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-accent hover:text-on-dark transition-colors"
              >
                <span>Reserve Coworking Stay</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
