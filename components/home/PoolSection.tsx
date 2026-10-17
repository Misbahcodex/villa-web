import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { amenityCategories } from "@/data/amenities";

export function PoolSection() {
  const data = amenityCategories.find((a) => a.id === "pool");
  if (!data) return null;

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent block">
                {data.eyebrow}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl uppercase tracking-tight text-on-dark font-normal leading-tight">
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
                href="/book?room=deluxe-double-capsule"
                className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-accent hover:text-on-dark transition-colors"
              >
                <span>Reserve with Outdoor Pool Access</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Presentation with Outdoor Pool Badge */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden border border-subtle bg-surface shadow-xl group">
              <SiteImage
                slot={data.imageSlot}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="group-hover:scale-105 transition-transform duration-700 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-base/50 via-transparent to-transparent pointer-events-none" />

              <div className="absolute top-4 right-4 bg-surface/90 border border-subtle text-accent text-xs px-3 py-1 rounded-sm font-mono tracking-wider uppercase backdrop-blur-sm">
                {data.badge}
              </div>
            </div>

            {/* Spec Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        </div>
      </div>
    </section>
  );
}
