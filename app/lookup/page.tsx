"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/data/site";

interface BookingStatusInfo {
  ref: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  status: "pending" | "confirmed" | "declined" | "expired" | "cancelled";
  holdExpiresAt: string | null;
  createdAt: string;
  estimatedTotalAED: number;
}

function LookupContent() {
  const searchParams = useSearchParams();
  const [ref, setRef] = useState(searchParams.get("ref") || "");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingStatusInfo | null>(null);

  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      setRef(urlRef.toUpperCase());
    }
  }, [searchParams]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBooking(null);

    const cleanRef = ref.trim().toUpperCase();
    const cleanPhoneLast4 = phoneLast4.trim();

    if (!cleanRef.startsWith("RZQ-")) {
      setError("Please enter a valid reference starting with RZQ- (e.g. RZQ-ABC123)");
      return;
    }

    if (cleanPhoneLast4.length !== 4 || !/^\d{4}$/.test(cleanPhoneLast4)) {
      setError("Please enter the last 4 digits of the phone number used when requesting the stay.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${cleanRef}?phoneLast4=${cleanPhoneLast4}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lookup failed. Please check your reference and phone digits.");
      } else {
        setBooking(data);
      }
    } catch {
      setError("Network error. Please try again or contact us directly on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base text-on-dark pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8 font-mono">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-accent block">
            Reservation Status Lookup
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-tight text-on-dark font-normal">
            Check Your Stay
          </h1>
          <p className="text-xs text-muted-dark max-w-md mx-auto font-sans font-light">
            Verify the status of your reservation request or confirmed direct booking at Rizq Luxurious Villa Dubai.
          </p>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={handleLookup}
          className="bg-surface border border-subtle p-6 sm:p-8 rounded-sm shadow-2xl space-y-5"
        >
          <div className="space-y-1.5">
            <label htmlFor="ref" className="text-[11px] uppercase tracking-wider text-muted-dark block">
              Booking Reference Code
            </label>
            <input
              id="ref"
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase())}
              placeholder="e.g. RZQ-X7K92M"
              className="w-full bg-base border border-subtle rounded-sm px-4 py-3 text-on-dark font-mono uppercase tracking-wider text-sm focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phoneLast4" className="text-[11px] uppercase tracking-wider text-muted-dark block">
              Last 4 Digits of Phone Number
            </label>
            <input
              id="phoneLast4"
              type="text"
              maxLength={4}
              value={phoneLast4}
              onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 4567"
              className="w-full bg-base border border-subtle rounded-sm px-4 py-3 text-on-dark font-mono tracking-wider text-sm focus:outline-none focus:border-accent"
              required
            />
            <span className="text-[10px] text-muted-dark block font-sans font-light">
              Used solely to verify ownership without exposing personal information.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-base border border-rose-800/80 text-rose-300 text-xs rounded-sm flex items-center gap-2">
              <span>✕</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-strong text-base font-medium py-3 rounded-sm text-xs uppercase tracking-widest transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>LOOKING UP RESERVATION...</span>
            ) : (
              <span>VERIFY RESERVATION STATUS →</span>
            )}
          </button>
        </form>

        {/* Results Card */}
        {booking && (
          <div className="bg-surface border border-subtle rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-subtle pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-muted-dark block">
                  REFERENCE
                </span>
                <span className="font-mono font-medium text-xl text-accent">
                  {booking.ref}
                </span>
              </div>

              {/* Status Pill */}
              <div>
                {booking.status === "confirmed" && (
                  <span className="inline-flex items-center gap-1.5 bg-success/15 border border-success/40 text-success px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider">
                    <span>✓</span>
                    <span>Confirmed</span>
                  </span>
                )}
                {booking.status === "pending" && (
                  <span className="inline-flex items-center gap-1.5 bg-accent/15 border border-accent/40 text-accent px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider">
                    <span>•</span>
                    <span>Awaiting confirmation</span>
                  </span>
                )}
                {(booking.status === "declined" || booking.status === "cancelled") && (
                  <span className="inline-flex items-center gap-1.5 bg-base border border-subtle text-muted-dark px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider">
                    <span>✕</span>
                    <span>Not available</span>
                  </span>
                )}
                {booking.status === "expired" && (
                  <span className="inline-flex items-center gap-1.5 bg-base border border-subtle text-muted-dark px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider">
                    <span>Expired</span>
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-dark uppercase tracking-wider text-[10px] block">SPACE</span>
                <span className="text-on-dark block">{booking.roomTypeName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-dark uppercase tracking-wider text-[10px] block">TOTAL (AED)</span>
                <span className="text-accent text-sm block">{booking.estimatedTotalAED} AED</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-dark uppercase tracking-wider text-[10px] block">CHECK-IN</span>
                <span className="text-on-dark block">{booking.checkIn}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-dark uppercase tracking-wider text-[10px] block">CHECK-OUT</span>
                <span className="text-on-dark block">{booking.checkOut}</span>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-muted-dark uppercase tracking-wider text-[10px] block">GUESTS</span>
                <span className="text-on-dark/90 block">
                  {booking.adults} Adults ({booking.nights} Nights)
                </span>
              </div>
            </div>

            {/* Conditional Status Messages */}
            {booking.status === "pending" && booking.holdExpiresAt && (
              <div className="p-4 bg-base border border-subtle rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-accent text-xs">
                  <span>•</span>
                  <span>Courtesy Hold Active</span>
                </div>
                <p className="text-[11px] text-muted-dark leading-relaxed font-sans font-light">
                  Your reservation hold is active until{" "}
                  <strong>{new Date(booking.holdExpiresAt).toLocaleTimeString("en-AE", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })} GST</strong>.
                  Our team reviews each request directly.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                      `Hello Rizq Villa team, I am checking on my booking hold Ref: ${booking.ref}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base text-xs font-mono font-medium px-4 py-2 rounded-sm transition-colors"
                  >
                    <span>Chat on WhatsApp regarding Ref: {booking.ref} →</span>
                  </a>
                </div>
              </div>
            )}

            {booking.status === "confirmed" && (
              <div className="p-4 bg-base border border-success/40 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-success text-xs">
                  <span>✓</span>
                  <span>Direct Booking Confirmed</span>
                </div>
                <p className="text-[11px] text-muted-dark leading-relaxed font-sans font-light">
                  We look forward to welcoming you to Rizq Luxurious Villa in Dubai.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                      `Hello Rizq Villa team, I have confirmed booking Ref: ${booking.ref} and wanted to inquire about arrival.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base text-xs font-mono font-medium px-4 py-2 rounded-sm transition-colors"
                  >
                    <span>Message WhatsApp Concierge →</span>
                  </a>
                </div>
              </div>
            )}

            {booking.status === "expired" && (
              <div className="p-4 bg-base border border-subtle rounded-sm space-y-2">
                <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                  We couldn&apos;t confirm in time. Message us on WhatsApp to try again.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                      `Hello Rizq Villa team, my reservation hold ${booking.ref} expired and I would like to check availability to try again.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base text-xs font-mono font-medium px-4 py-2 rounded-sm transition-colors"
                  >
                    <span>Message on WhatsApp to Try Again →</span>
                  </a>
                </div>
              </div>
            )}

            {(booking.status === "declined" || booking.status === "cancelled") && (
              <div className="p-4 bg-base border border-subtle rounded-sm space-y-2">
                <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                  This space is currently not available for the requested dates. Please contact us on WhatsApp to explore alternative dates or spaces.
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                      `Hello Rizq Villa team, regarding Ref: ${booking.ref}, are there alternative dates available?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-strong text-base text-xs font-mono font-medium px-4 py-2 rounded-sm transition-colors"
                  >
                    <span>Explore Alternative Dates on WhatsApp →</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            href="/book"
            className="text-xs tracking-wider text-muted-dark hover:text-on-dark transition-colors"
          >
            ← Return to Direct Booking
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base text-on-dark p-20 text-center font-mono text-xs">Loading...</div>}>
      <LookupContent />
    </Suspense>
  );
}
