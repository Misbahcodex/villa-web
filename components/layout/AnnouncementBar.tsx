"use client";

import { useState } from "react";
import { siteConfig } from "@/data/site";
import { trackEvent } from "@/lib/analytics";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.promoCode);
      setCopied(true);
      trackEvent({
        name: "promo_copied",
        params: {
          promoCode: siteConfig.promoCode,
          discountPercent: siteConfig.discountPercent,
          location: "announcement_bar",
        },
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <aside
      aria-label="Direct booking discount offer"
      className="bg-surface border-b border-subtle text-on-dark text-xs py-2 px-4 relative z-50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2.5 text-center flex-wrap">
          <span className="text-accent text-[11px] font-mono tracking-widest uppercase">
            Direct Privilege
          </span>
          <span className="text-muted-dark text-[10px] hidden sm:inline">•</span>
          <span className="text-on-dark text-xs font-light tracking-wide">
            Book direct and save 15% with code
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1.5 bg-base hover:bg-accent hover:text-base text-accent px-2.5 py-0.5 rounded-sm border border-subtle transition-colors text-xs font-mono font-medium tracking-wider"
            title="Click to copy promo code"
            aria-label={`Copy promo code ${siteConfig.promoCode}`}
          >
            <span>{siteConfig.promoCode}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-dark font-sans">
              {copied ? "✓ Copied" : "Copy"}
            </span>
          </button>
        </div>

        <button
          onClick={() => setDismissed(true)}
          type="button"
          aria-label="Dismiss announcement"
          className="text-muted-dark hover:text-on-dark px-1.5 py-0.5 text-xs transition-colors shrink-0 font-mono"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
