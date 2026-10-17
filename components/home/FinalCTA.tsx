import Link from "next/link";
import { siteConfig } from "@/data/site";

export function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-base text-on-dark relative overflow-hidden border-t border-subtle">
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 font-mono">
        <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3.5 py-1 rounded-sm text-xs text-accent uppercase tracking-widest">
          <span>★</span>
          <span>PROMO CODE: {siteConfig.promoCode} (15% OFF)</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-on-dark font-normal leading-tight">
          Reserve Your Sanctuary in Dubai.
          <span className="text-accent block mt-2 font-light">
            Direct 15% Privilege Included.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-muted-dark max-w-2xl mx-auto leading-relaxed font-sans font-light">
          Book direct and save 15% with code RIZQDIRECT. Enjoy direct WhatsApp concierge support,
          flexible check-in requests, and priority allocation.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono">
          <Link
            href="/book"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base font-medium px-8 py-4 rounded-sm text-xs uppercase tracking-widest transition-all shadow-xl"
          >
            <span>BOOK DIRECT (15% OFF)</span>
            <span aria-hidden="true">→</span>
          </Link>

          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
              "Hello Rizq Villa team, I would like to inquire about direct reservations with promo code RIZQDIRECT."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-on-dark px-6 py-4 rounded-sm text-xs uppercase tracking-widest border border-subtle transition-colors"
          >
            <span>CHAT CONCIERGE</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-dark">
          <span>• 12-Hour Courtesy Hold</span>
          <span>•</span>
          <span>Fast confirmation via WhatsApp</span>
          <span>•</span>
          <span>500 Mbps Wi-Fi &amp; Pool Included</span>
        </div>
      </div>
    </section>
  );
}
