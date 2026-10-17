"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { trackEvent } from "@/lib/analytics";

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);

  if (pathname === "/book") {
    return null;
  }

  const handleClick = () => {
    trackEvent({
      name: "whatsapp_opened",
      params: {
        roomId: "general-floating",
        estimatedTotalAED: 0,
        directDiscount: 15,
      },
    });
  };

  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    "Hello Rizq Luxurious Villa Team, I would like to inquire about availability and direct 15% booking offer (RIZQDIRECT)."
  )}`;

  return (
    <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-30 flex items-end flex-col gap-2 pointer-events-none">
      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-auto bg-surface text-on-dark text-xs px-3.5 py-2 rounded-sm border border-subtle shadow-2xl flex items-center gap-2 max-w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex-1">
            <span className="text-accent font-mono uppercase text-[10px] tracking-wider block">
              Inquire Directly
            </span>
            <span className="text-muted-dark text-[11px]">Chat on WhatsApp • 15% Off</span>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-muted-dark hover:text-on-dark p-0.5 text-xs font-mono"
            aria-label="Dismiss tooltip"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Action Pill */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="pointer-events-auto group bg-accent hover:bg-accent-strong text-base px-3.5 py-2.5 rounded-sm border border-subtle shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-mono text-xs tracking-wider"
        aria-label="Open direct WhatsApp conversation with Rizq Villa"
      >
        <span className="font-bold">WA</span>
        <span className="hidden sm:inline font-medium uppercase text-[11px]">Direct</span>
      </a>
    </div>
  );
}
