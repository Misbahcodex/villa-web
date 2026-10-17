"use client";

import { siteConfig } from "@/data/site";

export function DemoRibbon() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!isDemo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-surface/95 border-b border-subtle text-muted-dark py-1.5 px-4 text-center text-xs tracking-wider flex items-center justify-center gap-2 select-none relative z-50 font-mono"
    >
      <span className="text-[10px] uppercase tracking-widest text-accent border border-accent/40 px-1.5 py-0.2 rounded-sm">
        DEMO
      </span>
      <span className="text-on-dark text-xs">{siteConfig.demoNotice}</span>
      <span className="text-accent hidden sm:inline text-xs">
        • {siteConfig.proposedDirectOfferNotice}
      </span>
    </div>
  );
}
