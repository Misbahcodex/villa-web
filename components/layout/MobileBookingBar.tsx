"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";

export function MobileBookingBar() {
  const pathname = usePathname();

  // Never show sticky bar on /book or /admin to avoid covering form fields or controls
  if (pathname === "/book" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <aside
      aria-label="Direct booking mobile bar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#10100F]/95 backdrop-blur-md border-t border-subtle px-4 py-3 flex items-center justify-between shadow-2xl transition-all"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-accent text-xs font-mono uppercase tracking-wider">
          <span>★</span>
          <span>Save 15% Direct</span>
        </div>
        <span className="text-[10px] text-muted-dark font-mono">
          Code {siteConfig.promoCode} • WhatsApp
        </span>
      </div>

      <Link
        href="/book"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base font-mono font-medium px-4 py-2 rounded-sm text-xs tracking-wider uppercase transition-colors shadow-md"
      >
        <span>Book Direct</span>
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
