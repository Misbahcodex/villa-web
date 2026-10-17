"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";

export function TrustStrip() {
  const [reviewCount, setReviewCount] = useState(2000);

  useEffect(() => {
    const target = siteConfig.rating.reviews;
    const duration = 1200;
    const steps = 30;
    const increment = (target - 2000) / steps;
    let current = 2000;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setReviewCount(target);
        clearInterval(timer);
      } else {
        setReviewCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      value: "4.7★",
      label: "Google Rating",
      subtext: "4.7★ on Google",
      badge: "★",
    },
    {
      value: reviewCount.toLocaleString(),
      label: "Reviews on Google",
      subtext: "2,324 Google Reviews",
      badge: "G",
    },
    {
      value: "500 Mbps",
      label: "High-Speed Wi-Fi",
      subtext: "500 Mbps Wi-Fi",
      badge: "W",
    },
    {
      value: "15% Direct",
      label: "Direct Booking Offer",
      subtext: "Code RIZQDIRECT",
      badge: "%",
    },
  ];

  return (
    <section className="bg-surface border-y border-subtle py-10 px-4 sm:px-6 lg:px-8 relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => {
            return (
              <div
                key={idx}
                className="flex flex-col items-center md:items-start text-center md:text-left space-y-1 group"
              >
                <div className="flex items-center gap-2 text-accent mb-1 font-mono">
                  <span className="w-5 h-5 rounded-sm border border-subtle flex items-center justify-center text-[10px] text-accent">
                    {stat.badge}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-on-dark tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <span className="text-xs font-mono tracking-wider uppercase text-on-dark">
                  {stat.label}
                </span>
                <span className="text-[11px] text-muted-dark">
                  {stat.subtext}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
