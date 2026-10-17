import Link from "next/link";
import { siteConfig, directBenefits } from "@/data/site";

export function DirectBookingBanner() {
  return (
    <section id="direct-benefits" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-base border-b border-subtle font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-accent block">
              The Direct Advantage
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-on-dark tracking-tight">
              Why Reserve Directly with Rizq Villa
            </h2>
            <p className="text-sm sm:text-base text-muted-dark leading-relaxed font-sans font-light">
              By coordinating directly through our WhatsApp
              booking desk, we pass savings straight to you with premium privileges.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-surface hover:bg-surface-elevated text-on-dark px-5 py-3 rounded-sm text-xs tracking-wider uppercase border border-accent/40 transition-colors"
            >
              <span>Apply Code {siteConfig.promoCode}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {directBenefits.map((benefit, idx) => {
            return (
              <div
                key={idx}
                className="bg-surface border border-subtle p-6 rounded-sm hover:border-accent/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-8 h-8 rounded-sm bg-base border border-accent/40 flex items-center justify-center text-accent text-xs">
                    0{idx + 1}
                  </div>
                  <h3 className="font-serif text-lg text-on-dark font-normal">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
