"use client";

import Link from "next/link";
import { siteConfig } from "@/data/site";

export function JournalSection() {
  return (
    <section className="bg-base text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-subtle pb-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
                Direct Booking Privilege
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-on-dark font-normal">
              Direct Reservation Advantage
            </h2>
            <p className="text-muted-dark text-xs sm:text-sm font-light">
              Experience transparent booking directly with our Dubai management team. Save 15% on every stay with verified direct privilege.
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors shrink-0"
          >
            <span>RESERVE WITH 15% OFF</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* 3 Editorial Privilege Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-subtle p-8 rounded-sm space-y-4">
            <span className="text-accent font-serif text-2xl">01</span>
            <h3 className="font-serif text-xl text-on-dark font-normal">
              Direct Rate Advantage
            </h3>
            <p className="text-muted-dark text-xs sm:text-sm font-light leading-relaxed">
              Use promo code <span className="text-accent font-mono">{siteConfig.promoCode}</span> at checkout to automatically receive 15% savings on all pod and suite categories.
            </p>
          </div>

          <div className="bg-surface border border-subtle p-8 rounded-sm space-y-4">
            <span className="text-accent font-serif text-2xl">02</span>
            <h3 className="font-serif text-xl text-on-dark font-normal">
              WhatsApp Concierge
            </h3>
            <p className="text-muted-dark text-xs sm:text-sm font-light leading-relaxed">
              Your reservation is reviewed and confirmed directly via WhatsApp. Speak directly with on-site staff for arrival coordination and special requests.
            </p>
          </div>

          <div className="bg-surface border border-subtle p-8 rounded-sm space-y-4">
            <span className="text-accent font-serif text-2xl">03</span>
            <h3 className="font-serif text-xl text-on-dark font-normal">
              4.7★ Guest Reputation
            </h3>
            <p className="text-muted-dark text-xs sm:text-sm font-light leading-relaxed">
              Backed by 2,324 Google guest reviews. Consistent ratings for clean facilities, fast 500 Mbps internet, and quiet working atmosphere in central Dubai.
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="p-8 bg-surface/50 border border-subtle rounded-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="font-serif text-xl text-on-dark font-medium">Ready to Plan Your Stay?</h4>
            <p className="text-muted-dark text-xs font-light">
              Check room availability or message our concierge directly.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                "Hello Rizq Villa team, I would like to inquire about booking a stay."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-subtle hover:border-accent text-on-dark px-4 py-2 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors"
            >
              CHAT CONCIERGE
            </a>
            <Link
              href="/book"
              className="bg-accent hover:bg-accent-strong text-base px-5 py-2 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors"
            >
              BOOK DIRECT →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
