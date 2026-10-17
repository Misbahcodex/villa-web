"use client";

import Link from "next/link";
import { siteConfig } from "@/data/site";

export function MonthlyStaySection() {
  const whatsappMonthlyUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hello Al Taj Al Raea / RizQ Villa team, I am inquiring about the AED 1,400/month rental in Business Bay."
  )}`;

  return (
    <section className="bg-surface text-on-dark py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-subtle relative font-mono">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-subtle pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="w-5 h-px bg-accent" />
              <span className="text-[10px] uppercase tracking-widest text-accent">
                Extended Residency // Luxury Within Reach
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-on-dark font-normal leading-tight font-sans">
              Monthly Stays in Business Bay
            </h2>
            <p className="text-muted-dark text-xs sm:text-sm font-sans font-light leading-relaxed">
              Why pay AED 8,000+ for a standard hotel room when you can live comfortably at RizQ Villa for only <span className="text-accent font-medium font-mono">AED 1,400 / month all-inclusive</span>? Designed for digital nomads, professionals, and students.
            </p>
          </div>

          <div className="bg-base border border-accent/40 p-5 rounded-sm shrink-0 flex flex-col justify-center space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-dark">All-Inclusive Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl text-on-dark font-medium font-serif">AED 1,400</span>
              <span className="text-xs text-muted-dark font-sans">/ month</span>
            </div>
            <span className="text-[10px] text-accent pt-1">No hidden maintenance fees</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-base border border-subtle p-6 rounded-sm space-y-3">
            <span className="text-accent text-xs">01</span>
            <h3 className="font-serif text-base text-on-dark font-medium font-sans">6-Bed Shared Rooms</h3>
            <p className="text-xs text-muted-dark font-sans font-light leading-relaxed">
              Designated Male, Female, and Private options with AC, personal lockers, and fresh bedding.
            </p>
          </div>

          <div className="bg-base border border-subtle p-6 rounded-sm space-y-3">
            <span className="text-accent text-xs">02</span>
            <h3 className="font-serif text-base text-on-dark font-medium font-sans">Resident Kitchen</h3>
            <p className="text-xs text-muted-dark font-sans font-light leading-relaxed">
              Fully equipped cooking kitchen with shared appliances, cookware, and resident dining area.
            </p>
          </div>

          <div className="bg-base border border-subtle p-6 rounded-sm space-y-3">
            <span className="text-accent text-xs">03</span>
            <h3 className="font-serif text-base text-on-dark font-medium font-sans">Free Metro Shuttle</h3>
            <p className="text-xs text-muted-dark font-sans font-light leading-relaxed">
              Complimentary morning and evening scheduled shuttle connecting residents to the Dubai Metro.
            </p>
          </div>

          <div className="bg-base border border-subtle p-6 rounded-sm space-y-3">
            <span className="text-accent text-xs">04</span>
            <h3 className="font-serif text-base text-on-dark font-medium font-sans">Pool, Gym &amp; Lounge</h3>
            <p className="text-xs text-muted-dark font-sans font-light leading-relaxed">
              Open-air swimming pool, gym training basics, study library, and resident PlayStation lounge.
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-subtle/60">
          <div className="text-xs text-muted-dark font-sans font-light flex items-center gap-2">
            <span className="text-accent">•</span>
            <span>Business Bay, Dubai — Minutes from Burj Khalifa &amp; Dubai Mall</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={whatsappMonthlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors"
            >
              <span>INQUIRE FOR MONTHLY STAY</span>
              <span aria-hidden="true">→</span>
            </a>

            <Link
              href="/book"
              className="inline-flex items-center gap-2 border border-subtle hover:border-accent text-on-dark px-5 py-3 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors"
            >
              <span>NIGHTLY BOOKING</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
