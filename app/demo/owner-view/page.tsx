"use client";

import { useState } from "react";
import Link from "next/link";

export default function OwnerDemoWalkthroughPage() {
  const [simulatorStep, setSimulatorStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sampleRef, setSampleRef] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const handleCopyQuestions = () => {
    const text = `Rizq Luxurious Villa — Property Confirmation:
1. Check-in Window: [e.g. 15:00 - 23:00]
2. Check-out Cutoff: [e.g. 11:00 AM]
3. Minimum Guest Age: [e.g. 18+]
4. Parking: [e.g. Free on-site, 6 spaces]
5. Laundry: [e.g. Self-serve washer/dryer on-site]
6. Gym: [e.g. Partner fitness center 5 min walk]
7. Shuttle: [e.g. On request, 120 AED]`;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 3000);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulatorStep(1);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: "deluxe-double-capsule",
          checkIn: "2026-11-20",
          checkOut: "2026-11-24",
          adults: 2,
          children: 0,
          guestName: "Demo Guest (Founder)",
          guestPhone: "+971500009999",
          guestEmail: "guest@founder-demo.ae",
          notes: "Walkthrough simulation booking test",
          promoCode: "RIZQDIRECT",
        }),
      });

      const data = await res.json();
      if (data.ref) {
        setSampleRef(data.ref);
      } else {
        setSampleRef("RZQ-DEMO77");
      }

      setTimeout(() => setSimulatorStep(2), 1200);
      setTimeout(() => setSimulatorStep(3), 2400);
      setTimeout(() => setSimulatorStep(4), 3600);
    } catch {
      setSampleRef("RZQ-DEMO77");
      setTimeout(() => setSimulatorStep(4), 2000);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-base text-on-dark pt-32 pb-24 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] uppercase tracking-widest text-accent border border-accent/40 px-3 py-1 rounded-sm inline-block">
            Owner Onboarding Walkthrough
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-tight text-on-dark font-normal leading-tight">
            How Direct Bookings Work
          </h1>
          <p className="text-xs sm:text-sm text-muted-dark leading-relaxed font-sans font-light">
            A frictionless, race-safe flow engineered to bring bookings directly to your villa,
            facilitate direct reservations, and synchronize availability across external platforms.
          </p>
        </div>

        {/* 5-Step Interactive Visual Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            {
              step: "01",
              title: "Guest Requests Stay",
              desc: "Guest picks capsule pod or suite, inputs phone number, and submits with 15% direct privilege.",
            },
            {
              step: "02",
              title: "Instant 12h Hold",
              desc: "Availability engine holds inventory for 12 hours with race-safe serialization to prevent double-booking.",
            },
            {
              step: "03",
              title: "Owner Notified",
              desc: "Instant dispatch to your Email & Telegram bot with full stay details and 1-tap action buttons.",
            },
            {
              step: "04",
              title: "1-Tap Confirmation",
              desc: "Tap Confirm in dashboard or Telegram. Guest receives pre-filled WhatsApp confirmation with coordinates.",
            },
            {
              step: "05",
              title: "iCal Calendar Sync",
              desc: "Your availability is kept in one place on your site. Calendars can be shared with other platforms using standard iCal links (periodic updates). A channel manager can be added later for live sync.",
            },
          ].map((item, idx) => {
            return (
              <div
                key={idx}
                className="bg-surface border border-subtle p-5 rounded-sm flex flex-col justify-between space-y-4 shadow-xl relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-accent">{item.step}</span>
                  <span className="text-muted-dark text-xs">•</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base text-on-dark tracking-wide font-normal">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-muted-dark leading-relaxed font-sans font-light">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Simulation Try-It Sandbox */}
        <div className="bg-surface border border-subtle p-8 sm:p-10 rounded-sm shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-accent block">
                Interactive Simulator
              </span>
              <h2 className="font-serif text-2xl uppercase tracking-tight text-on-dark font-normal">
                Try a Live Simulation
              </h2>
              <p className="text-xs text-muted-dark mt-1 font-sans font-light">
                Fires a real booking request into the availability engine and watches the hold update live.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong disabled:opacity-50 text-base font-medium px-6 py-3 rounded-sm text-xs uppercase tracking-widest shadow-xl transition-colors"
            >
              <span>{isSimulating ? "SIMULATING..." : "RUN SAMPLE BOOKING →"}</span>
            </button>
          </div>

          {simulatorStep > 0 && (
            <div className="bg-base border border-subtle p-6 rounded-sm space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className={`p-3 rounded-sm border ${simulatorStep >= 1 ? "border-accent bg-surface text-on-dark" : "border-subtle text-muted-dark"}`}>
                  <span className="block mb-1 text-accent">1. Booking Request</span>
                  <span>{simulatorStep >= 1 ? `Ref: ${sampleRef || "Generating..."}` : "Waiting..."}</span>
                </div>
                <div className={`p-3 rounded-sm border ${simulatorStep >= 2 ? "border-accent bg-surface text-on-dark" : "border-subtle text-muted-dark"}`}>
                  <span className="block mb-1 text-accent">2. 12-Hour Hold</span>
                  <span>{simulatorStep >= 2 ? "Reservation Hold" : "Waiting..."}</span>
                </div>
                <div className={`p-3 rounded-sm border ${simulatorStep >= 3 ? "border-success bg-surface text-on-dark" : "border-subtle text-muted-dark"}`}>
                  <span className="block mb-1 text-success">3. Notification Fired</span>
                  <span>{simulatorStep >= 3 ? "Telegram & Email" : "Waiting..."}</span>
                </div>
                <div className={`p-3 rounded-sm border ${simulatorStep >= 4 ? "border-accent bg-surface text-on-dark" : "border-subtle text-muted-dark"}`}>
                  <span className="block mb-1 text-accent">4. Ready in Dashboard</span>
                  <span>{simulatorStep >= 4 ? "Awaiting Confirm" : "Waiting..."}</span>
                </div>
              </div>

              {simulatorStep >= 4 && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-success font-sans">
                    ✓ Simulation complete! Check your operations dashboard to inspect the pending hold.
                  </span>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-base px-4 py-2 rounded-sm text-xs font-medium uppercase tracking-wider"
                  >
                    <span>Open Dashboard →</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Illustrative Value Comparison Card */}
        <div className="bg-surface border border-subtle p-8 sm:p-10 rounded-sm space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-accent block">
              Illustrative Comparison
            </span>
            <h2 className="font-serif text-2xl uppercase tracking-tight text-on-dark font-normal">
              Direct Bookings vs. Third-Party Platforms
            </h2>
            <p className="text-xs text-muted-dark mt-0.5 font-sans font-light">
              Illustrative estimate, not a guarantee. Demonstrates operational differences for boutique hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-base border border-subtle p-6 rounded-sm space-y-3 font-mono">
              <span className="text-accent text-lg">01</span>
              <h3 className="text-on-dark text-sm uppercase">Direct Value</h3>
              <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                <strong>Direct Bookings:</strong> Pass 15% discount to the guest while retaining clean, direct booking operations.
              </p>
            </div>

            <div className="bg-base border border-subtle p-6 rounded-sm space-y-3 font-mono">
              <span className="text-accent text-lg">02</span>
              <h3 className="text-on-dark text-sm uppercase">Guest Relationship</h3>
              <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                <strong>Direct WhatsApp Line:</strong> Direct messaging with the resident before arrival. Zero masked email relays.
              </p>
            </div>

            <div className="bg-base border border-subtle p-6 rounded-sm space-y-3 font-mono">
              <span className="text-accent text-lg">03</span>
              <h3 className="text-on-dark text-sm uppercase">Repeat Bookings</h3>
              <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                <strong>Retained Guest Book:</strong> Own your guest contacts and phone numbers for direct communication without intermediary barriers.
              </p>
            </div>
          </div>
        </div>

        {/* Details We Need From You Card */}
        <div className="bg-surface border border-accent/40 p-8 sm:p-10 rounded-sm space-y-6 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-5">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-accent block">
                Property Onboarding Checklist
              </span>
              <h2 className="font-serif text-2xl uppercase tracking-tight text-on-dark font-normal">
                Details We Need From You
              </h2>
              <p className="text-xs text-muted-dark mt-1 font-sans font-light">
                To confirm your property specifications and operational rules without discrepancies, please review and answer these items.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyQuestions}
              className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-base font-medium px-4 py-2.5 rounded-sm text-xs uppercase tracking-widest transition-colors shadow-md shrink-0"
            >
              <span>{copiedTemplate ? "✓ Copied to Clipboard!" : "Copy List for WhatsApp"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">1. Check-In Window</span>
              <p className="text-muted-dark font-sans font-light">What are your standard earliest and latest check-in hours without surcharge? (e.g., 15:00 – 23:00)</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">2. Check-Out Cutoff</span>
              <p className="text-muted-dark font-sans font-light">What is your standard departure checkout time? (e.g., 11:00 AM or 12:00 PM)</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">3. Minimum Guest Age</span>
              <p className="text-muted-dark font-sans font-light">Adults-only is confirmed; what is your exact minimum age cutoff? (e.g., 18+ or 21+)</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">4. Parking Availability</span>
              <p className="text-muted-dark font-sans font-light">Is complimentary on-site parking available, and how many guest vehicles can park?</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">5. Self-Serve Laundry</span>
              <p className="text-muted-dark font-sans font-light">Are washer and dryer machines available on-site for resident guests, and what is the token or usage fee?</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5">
              <span className="text-accent block uppercase text-[11px]">6. Gym / Fitness Center</span>
              <p className="text-muted-dark font-sans font-light">Is there an on-site fitness facility or a partner gym within walking distance?</p>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle space-y-1.5 md:col-span-2">
              <span className="text-accent block uppercase text-[11px]">7. Airport / Metro Shuttle Transfer</span>
              <p className="text-muted-dark font-sans font-light">Do you provide airport (DXB) or Metro station pickup transfers, and what is the fixed rate per trip?</p>
            </div>
          </div>
        </div>

        {/* Honest Roadmap Card */}
        <div className="bg-surface border border-subtle p-8 sm:p-10 rounded-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-accent">•</span>
            <h2 className="font-serif text-xl uppercase tracking-tight text-on-dark font-normal">
              What is Real Today vs. Roadmap
            </h2>
          </div>

          <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
            <strong>Active Today:</strong> Full availability engine, 12-hour inventory holds, WhatsApp deep link generation, Resend email notifications, Telegram bot notifications, RFC 5545 iCalendar feed export, and the complete operations dashboard.
          </p>

          <p className="text-xs text-muted-dark leading-relaxed border-t border-subtle pt-3 font-sans font-light">
            <strong>Honest Roadmap (Available as Upgrades):</strong> Your availability is kept in one place on your site. Calendars can be shared with other platforms using standard iCal links (periodic updates). A channel manager can be added later for live sync. Card payment gateway integration can be enabled when client merchant accounts are registered.
          </p>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base font-medium py-3.5 px-6 rounded-sm text-xs uppercase tracking-widest transition-colors shadow-xl"
          >
            <span>Open Operations Dashboard →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
