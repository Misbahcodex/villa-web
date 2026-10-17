import { testimonials, hasRealQuotes } from "@/data/testimonials";
import { siteConfig } from "@/data/site";

export function TestimonialsSection() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Hide the whole section in production mode if real verbatim quotes do not exist yet
  if (!isDemo && !hasRealQuotes) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle font-mono">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3.5 py-1 rounded-sm text-xs text-on-dark mb-1">
            <span className="text-accent">★</span>
            <span className="text-on-dark">{siteConfig.rating.score}★ on Google</span>
            <span className="text-muted-dark">({siteConfig.rating.reviews.toLocaleString()} Reviews)</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-on-dark font-normal leading-tight">
            Guest Reviews
          </h2>
          <p className="text-sm text-muted-dark leading-relaxed font-sans font-light">
            What travelers highlight about our 500 Mbps Wi-Fi, capsule pods, outdoor pool, and direct booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-surface border border-subtle p-7 rounded-sm flex flex-col justify-between space-y-6 relative hover:border-accent/50 transition-all shadow-xl group"
            >
              <div className="space-y-4">
                <div className="flex items-center text-accent gap-1 text-xs">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-sm text-on-dark leading-relaxed italic font-serif">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-subtle flex items-center justify-between text-xs">
                <div>
                  <span className="text-on-dark block">{t.authorTitle}</span>
                  <span className="text-[10px] text-muted-dark font-sans font-light">
                    {isDemo
                      ? "Sample review, to be replaced with real Google reviews"
                      : "Google Review"}
                  </span>
                </div>
                <span className="text-accent text-xs">✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
