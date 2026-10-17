"use client";

import Link from "next/link";
import { siteConfig } from "@/data/site";

export function Footer() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#10100F] text-on-dark pt-16 pb-24 sm:pb-16 border-t border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Architectural Invitation Banner */}
        <div className="bg-surface border border-subtle p-6 sm:p-10 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
              Direct Reservation Inquiries
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-on-dark font-normal tracking-wide">
              Secure Your Stay Direct with the Residence
            </h3>
            <p className="text-muted-dark text-xs sm:text-sm font-light">
              Save 15% with code <span className="text-accent font-mono">RIZQDIRECT</span>. Inquiries and reservations confirmed directly with our hospitality team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                "Hello Rizq Villa team, I would like to inquire about booking a stay."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-subtle hover:border-accent text-on-dark px-5 py-3 rounded-sm text-xs font-mono tracking-widest uppercase transition-colors"
            >
              <span>WHATSAPP</span>
              <span className="text-accent font-mono">+{siteConfig.whatsappNumber}</span>
            </a>

            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-colors shadow-sm"
            >
              <span>BOOK DIRECT</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t border-subtle/40">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-sm border border-accent/40 bg-surface text-accent flex items-center justify-center font-serif text-sm">
                R
              </div>
              <span className="font-serif text-lg tracking-wider text-on-dark uppercase">
                RIZQ VILLA
              </span>
            </div>
            <p className="text-muted-dark text-xs leading-relaxed font-light">
              Boutique villa residence and coworking coliving in Business Bay, Dubai. Operated by Al Taj Al Raea — Luxury Within Reach.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono tracking-widest uppercase text-accent">Navigation</p>
            <ul className="space-y-2 text-xs font-mono text-muted-dark">
              <li>
                <Link href="/#overview" className="hover:text-on-dark transition-colors">
                  OVERVIEW
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="hover:text-on-dark transition-colors">
                  ACCOMMODATIONS
                </Link>
              </li>
              <li>
                <Link href="/amenities" className="hover:text-on-dark transition-colors">
                  AMENITIES
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-on-dark transition-colors">
                  FIND RESERVATION
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono tracking-widest uppercase text-accent">Residence Policies</p>
            <ul className="space-y-2 text-xs font-mono text-muted-dark">
              <li className="flex items-center gap-2">
                <span className="text-accent">•</span> Adults only residence
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">•</span> Free Metro shuttle service
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">•</span> 500 Mbps high-speed Wi-Fi
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">•</span> Outdoor pool, gym &amp; kitchen
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono tracking-widest uppercase text-accent">Location & Contact</p>
            <p className="text-muted-dark text-xs leading-relaxed font-light">
              Dubai, United Arab Emirates<br />
              Al Quoz / Business Bay border<br />
              WhatsApp: +{siteConfig.whatsappNumber}
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 border-t border-subtle/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-dark font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {currentYear} {siteConfig.name}. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5 border border-subtle px-2 py-0.5 rounded-sm text-[10px] text-accent">
              <span>ADULTS ONLY</span>
            </span>
          </div>
          <p className="text-[11px] text-muted-dark">
            Direct booking portal • Dubai, UAE
          </p>
        </div>

        {isDemo && (
          <div className="text-center text-[11px] text-muted-dark font-light">
            Rates shown are illustrative until confirmed by the property.
          </div>
        )}
      </div>
    </footer>
  );
}
