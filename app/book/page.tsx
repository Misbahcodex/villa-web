import { Suspense } from "react";
import { Metadata } from "next";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { siteConfig } from "@/data/site";
import { RoomId } from "@/types";
import { validRoomIds } from "@/lib/validation";
import { propertyPolicies, showPolicy } from "@/data/policies";
import { getPropertyFacts } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Direct Reservation & Booking",
  description:
    "Reserve your stay directly with Rizq Luxurious Villa Dubai. Save 15% with promo code RIZQDIRECT. Direct WhatsApp reservation with zero third-party fees.",
};

interface BookingPageProps {
  searchParams: {
    room?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
}

export default async function BookPage({ searchParams }: BookingPageProps) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const liveFacts = await getPropertyFacts();
  const requestedRoom = searchParams.room;
  const initialRoomId: RoomId =
    typeof requestedRoom === "string" && (validRoomIds as readonly string[]).includes(requestedRoom)
      ? (requestedRoom as RoomId)
      : "deluxe-double-capsule";
  const initialCheckIn = searchParams.checkIn;
  const initialCheckOut = searchParams.checkOut;
  const parsedGuests = searchParams.guests ? parseInt(searchParams.guests, 10) : 1;
  const initialGuests = isNaN(parsedGuests) || parsedGuests < 1 ? 1 : parsedGuests;

  return (
    <div className="pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 bg-base min-h-screen text-on-dark">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* Header Section */}
        <div className="max-w-3xl space-y-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap items-center gap-2 bg-surface border border-accent/40 px-3.5 py-1 rounded-sm text-[11px] sm:text-xs text-accent font-mono tracking-wider uppercase max-w-full">
              <span>★</span>
              <span>DIRECT RESERVATION DESK • CODE: {siteConfig.promoCode} (15% OFF)</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-surface border border-subtle px-3 py-1 rounded-sm text-[11px] sm:text-xs text-muted-dark font-mono tracking-wider uppercase">
              <span>•</span>
              <span>ADULTS ONLY RESIDENCE</span>
            </div>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl uppercase tracking-tight text-on-dark leading-tight font-normal">
            Direct Villa Reservation
          </h1>

          <p className="text-sm sm:text-base text-muted-dark leading-relaxed font-light">
            Select your dates and preferred space below to view your direct booking rate and connect with our WhatsApp team.
          </p>

          {isDemo && (
            <p className="text-xs text-muted-dark font-mono">
              Rates shown are illustrative until confirmed by the property.
            </p>
          )}
        </div>

        {/* Main Grid: Form on Left, Direct Benefits & Policy on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Booking Widget (Col 8) */}
          <div className="lg:col-span-8">
            <Suspense
              fallback={
                <div className="bg-surface border border-subtle p-12 rounded-sm text-center text-muted-dark font-mono text-xs">
                  Loading reservation engine...
                </div>
              }
            >
              <BookingWidget
                initialRoomId={initialRoomId}
                initialCheckIn={initialCheckIn}
                initialCheckOut={initialCheckOut}
                initialGuests={initialGuests}
                initialPolicies={liveFacts}
              />
            </Suspense>
          </div>

          {/* Sticky Sidebar: Direct Advantages & Trust Signals (Col 4) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            {/* Direct Privilege Summary Card */}
            <div className="bg-surface border border-subtle p-6 rounded-sm space-y-4 shadow-xl font-mono">
              <span className="text-[10px] uppercase tracking-widest text-accent block">
                Direct Booking Guarantee
              </span>

              <div className="space-y-4 text-xs text-muted-dark">
                <div className="flex items-start gap-3">
                  <span className="text-accent">01</span>
                  <div>
                    <span className="text-on-dark block font-sans font-medium text-xs">Guaranteed 15% Savings</span>
                    <span className="text-muted-dark text-[11px] font-sans font-light">Applied automatically with promo code RIZQDIRECT.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-subtle/50 pt-3">
                  <span className="text-accent">02</span>
                  <div>
                    <span className="text-on-dark block font-sans font-medium text-xs">Direct WhatsApp Line</span>
                    <span className="text-muted-dark text-[11px] font-sans font-light">Communicate directly with on-site staff for arrival coordination.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-subtle/50 pt-3">
                  <span className="text-accent">03</span>
                  <div>
                    <span className="text-on-dark block font-sans font-medium text-xs">12-Hour Courtesy Hold</span>
                    <span className="text-muted-dark text-[11px] font-sans font-light">Our team confirms your request by WhatsApp before finalizing.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Rating Card */}
            <div className="bg-surface border border-subtle p-5 rounded-sm flex items-center justify-between shadow-lg font-mono">
              <div>
                <div className="flex items-center text-accent gap-1.5">
                  <span>★</span>
                  <span className="text-on-dark text-sm">{siteConfig.rating.score}★ Google Rating</span>
                </div>
                <span className="text-[11px] text-muted-dark block mt-1">
                  Based on {siteConfig.rating.reviews.toLocaleString()} traveler reviews
                </span>
              </div>
            </div>

            {/* Check-In Times & Location */}
            <div className="bg-surface border border-subtle p-5 rounded-sm text-xs text-muted-dark space-y-2 shadow-lg font-mono">
              <div className="flex items-center gap-2 text-on-dark">
                <span className="text-accent">•</span>
                <span className="font-sans font-medium">{siteConfig.locationNote}</span>
              </div>
              <div className="pt-2 border-t border-subtle text-[11px] text-muted-dark">
                {((liveFacts.checkInWindow?.status || propertyPolicies.checkInWindow.status) === "confirmed" &&
                  (liveFacts.checkOutTime?.status || propertyPolicies.checkOutTime.status) === "confirmed") ? (
                  <div className="flex justify-between">
                    <span>Check-In: {showPolicy(liveFacts.checkInWindow || propertyPolicies.checkInWindow)}</span>
                    <span>Check-Out: {showPolicy(liveFacts.checkOutTime || propertyPolicies.checkOutTime)}</span>
                  </div>
                ) : (
                  <span>{showPolicy(liveFacts.checkInWindow || propertyPolicies.checkInWindow, "Times confirmed when your booking is accepted")}</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
