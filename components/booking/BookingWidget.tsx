"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { SiteImage } from "@/components/ui/SiteImage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { rooms } from "@/data/rooms";
import { siteConfig } from "@/data/site";
import { propertyPolicies, showPolicy } from "@/data/policies";
import { propertyAddons } from "@/data/addons";
import { RoomId, AvailabilityResult, CalendarMonthResult } from "@/types";
import { bookingCreationSchema, BookingCreationInput } from "@/lib/validation";
import { calculateBookingPrice, formatAED } from "@/lib/pricing";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

interface BookingWidgetProps {
  initialRoomId?: RoomId;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export function BookingWidget({
  initialRoomId = "deluxe-double-capsule",
  initialCheckIn,
  initialCheckOut,
  initialGuests = 1,
}: BookingWidgetProps) {
  const errorAlertId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Booking confirmed state
  const [bookingSuccess, setBookingSuccess] = useState<{
    ref: string;
    holdExpiresAt: string | null;
    whatsappUrl: string;
  } | null>(null);

  // Fallback state if offline / direct WhatsApp
  const [submittedWhatsAppUrl, setSubmittedWhatsAppUrl] = useState<string | null>(null);

  // Live Availability & Calendar state
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonthResult | null>(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [soldOutAlternatives, setSoldOutAlternatives] = useState<{
    alternativeDates: { checkIn: string; checkOut: string; minUnitsLeft: number }[];
    alternativeRooms: { roomTypeId: string; roomName: string; minUnitsLeft: number }[];
  } | null>(null);

  // Selected add-ons
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Initialize dates
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const defaultDeparture = addDays(tomorrow, 3);

  const initialRange: DateRange = {
    from: initialCheckIn ? new Date(initialCheckIn) : tomorrow,
    to: initialCheckOut ? new Date(initialCheckOut) : defaultDeparture,
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);
  const [isAdultsConfirmed, setIsAdultsConfirmed] = useState(false);

  const initialRoom = rooms.find((r) => r.id === initialRoomId) || rooms[0];
  const safeInitialGuests = Math.min(Math.max(1, initialGuests), initialRoom.maxGuests);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingCreationInput>({
    resolver: zodResolver(bookingCreationSchema),
    mode: "onChange",
    defaultValues: {
      roomId: initialRoomId,
      checkIn: initialRange.from ? format(initialRange.from, "yyyy-MM-dd") : "",
      checkOut: initialRange.to ? format(initialRange.to, "yyyy-MM-dd") : "",
      adults: safeInitialGuests,
      promoCode: siteConfig.promoCode,
      guestName: "",
      guestEmail: "",
      guestPhone: "+971 ",
      notes: "",
      addons: [],
      honeypot: "",
    },
  });

  const selectedRoomId = watch("roomId");
  const adultsCount = watch("adults");
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Fetch live availability whenever dates or room change
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;
    const checkInStr = format(dateRange.from, "yyyy-MM-dd");
    const checkOutStr = format(dateRange.to, "yyyy-MM-dd");

    if (checkOutStr <= checkInStr) return;

    setIsCheckingAvail(true);
    setSoldOutAlternatives(null);

    const controller = new AbortController();

    fetch(`/api/availability?room=${selectedRoomId}&checkIn=${checkInStr}&checkOut=${checkOutStr}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.isAvailable !== undefined) {
          setAvailability(data);
          if (!data.isAvailable) {
            setSoldOutAlternatives({
              alternativeDates: data.alternativeDates || [],
              alternativeRooms: data.alternativeRooms || [],
            });
          }
        }
      })
      .catch(() => {
        // Fallback to local permissive check if offline
      })
      .finally(() => {
        setIsCheckingAvail(false);
      });

    // Also fetch calendar for the check-in month
    const monthStr = format(dateRange.from, "yyyy-MM");
    fetch(`/api/calendar?room=${selectedRoomId}&month=${monthStr}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.days) setCalendarMonth(data);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [selectedRoomId, dateRange?.from, dateRange?.to]);

  // Keep date fields synchronized with date picker range
  const handleSelectDateRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setValue("checkIn", format(range.from, "yyyy-MM-dd"), { shouldValidate: true });
    } else {
      setValue("checkIn", "", { shouldValidate: true });
    }
    if (range?.to) {
      setValue("checkOut", format(range.to, "yyyy-MM-dd"), { shouldValidate: true });
    } else {
      setValue("checkOut", "", { shouldValidate: true });
    }
  };

  // Adjust guest count if room changed and exceeds maxGuests
  const handleRoomSelect = (roomId: RoomId) => {
    const room = rooms.find((r) => r.id === roomId);
    setValue("roomId", roomId, { shouldValidate: true });
    if (room && adultsCount > room.maxGuests) {
      setValue("adults", room.maxGuests, { shouldValidate: true });
    }
  };

  // Toggle add-on checkbox
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const next = prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId];
      setValue("addons", next, { shouldValidate: true });
      return next;
    });
  };

  // Live Pricing Calculation
  const pricing = calculateBookingPrice({
    startingRateAED: currentRoom.startingRateAED,
    checkIn: dateRange?.from,
    checkOut: dateRange?.to,
    discountPercent: siteConfig.discountPercent,
  });

  const onSubmit = async (data: BookingCreationInput) => {
    setIsSubmitting(true);

    const fallbackWhatsAppUrl = buildWhatsAppLink({
      whatsappNumber: siteConfig.whatsappNumber,
      guestName: data.guestName,
      roomName: currentRoom.name,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: pricing.nights,
      adults: data.adults,
      minGuestAge: propertyPolicies.minGuestAge.value || 18,
      promoCode: data.promoCode,
      discountPercent: siteConfig.discountPercent,
      estimatedTotalAED: pricing.totalAED,
      notes: data.notes,
    });

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          addons: selectedAddons,
          honeypot: data.honeypot || "",
        }),
      });

      const responseData = await res.json();

      if (res.status === 409) {
        // Sold out: display alternatives
        setSoldOutAlternatives({
          alternativeDates: responseData.alternativeDates || [],
          alternativeRooms: responseData.alternativeRooms || [],
        });
        setIsSubmitting(false);
        return;
      }

      if (res.ok && responseData.ref) {
        // Booking hold successfully created
        setBookingSuccess({
          ref: responseData.ref,
          holdExpiresAt: responseData.holdExpiresAt,
          whatsappUrl: responseData.whatsappUrl || fallbackWhatsAppUrl,
        });

        trackEvent({
          name: "direct_booking_click",
          params: {
            ref: responseData.ref,
            roomId: currentRoom.id,
            roomName: currentRoom.name,
            nights: pricing.nights,
            estimatedTotalAED: pricing.totalAED,
          },
        });

        // Open WhatsApp in new tab automatically
        if (typeof window !== "undefined") {
          window.open(responseData.whatsappUrl || fallbackWhatsAppUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        // Fallback to WhatsApp direct flow
        setSubmittedWhatsAppUrl(fallbackWhatsAppUrl);
        if (typeof window !== "undefined") {
          window.open(fallbackWhatsAppUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      // Graceful offline fallback: Open WhatsApp directly without data loss
      setSubmittedWhatsAppUrl(fallbackWhatsAppUrl);
      if (typeof window !== "undefined") {
        window.open(fallbackWhatsAppUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // SUCCESS CONFIRMATION VIEW WITH REFERENCE & HOLD EXPIRY
  // ----------------------------------------------------
  if (bookingSuccess) {
    const holdTimeText = bookingSuccess.holdExpiresAt
      ? new Date(bookingSuccess.holdExpiresAt).toLocaleTimeString("en-AE", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "12 Hours";

    return (
      <div className="bg-surface border border-accent/50 p-6 sm:p-12 rounded-sm shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-sm border border-accent/60 bg-base flex items-center justify-center text-accent mx-auto font-serif text-2xl">
          ✓
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent block">
            Courtesy Hold Active
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-on-dark font-normal">
            Request Received
          </h3>
          <p className="text-xs sm:text-sm text-muted-dark font-light">
            We&apos;re holding these dates for 12 hours while the team confirms.
          </p>
          <div className="inline-block bg-base border border-accent/60 px-4 py-2 rounded-sm font-mono font-medium text-lg text-accent mt-2">
            {bookingSuccess.ref}
          </div>
        </div>

        {/* 12-Hour Hold Banner */}
        <div className="bg-base border border-subtle p-4 rounded-sm max-w-md mx-auto text-xs text-muted-dark space-y-1 font-mono">
          <div className="text-accent uppercase text-[11px] tracking-wider">
            12-Hour Hold Window
          </div>
          <p className="text-muted-dark text-[11px]">
            Your dates are held until <strong>{holdTimeText} GST</strong>. Our villa team will confirm on WhatsApp.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 max-w-md mx-auto space-y-3 font-mono">
          <a
            href={bookingSuccess.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base font-medium py-3 px-6 rounded-sm text-xs uppercase tracking-widest transition-colors shadow-lg"
          >
            <span>CONTINUE ON WHATSAPP</span>
            <span aria-hidden="true">→</span>
          </a>

          <Link
            href={`/lookup?ref=${bookingSuccess.ref}`}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-on-dark transition-colors"
          >
            <span>Track your booking status online →</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-subtle max-w-md mx-auto font-mono">
          <button
            type="button"
            onClick={() => {
              setBookingSuccess(null);
              setSubmittedWhatsAppUrl(null);
            }}
            className="text-xs text-muted-dark hover:text-on-dark transition-colors"
          >
            ← Make Another Reservation
          </button>
        </div>
      </div>
    );
  }

  // Fallback View if offline
  if (submittedWhatsAppUrl) {
    return (
      <div className="bg-surface border border-accent/40 p-8 sm:p-12 rounded-sm shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 rounded-sm border border-accent/60 bg-base flex items-center justify-center text-accent mx-auto font-mono text-sm">
          WA
        </div>
        <h3 className="font-serif text-2xl uppercase text-on-dark font-normal">
          WhatsApp Connected
        </h3>
        <p className="text-xs text-muted-dark max-w-md mx-auto font-light">
          Your booking inquiry has been prepared for our WhatsApp reservations desk.
        </p>
        <div className="pt-2 max-w-md mx-auto">
          <a
            href={submittedWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base font-mono font-medium py-3 px-6 rounded-sm text-xs uppercase tracking-widest transition-colors"
          >
            <span>OPEN WHATSAPP CHAT DIRECTLY →</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface border border-subtle p-6 sm:p-10 rounded-sm shadow-2xl space-y-8"
      aria-label="Direct Villa Booking Form"
    >
      {/* Honeypot field (hidden from genuine users, traps spam bots) */}
      <input
        type="text"
        {...register("honeypot")}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Property Check-in / Check-out Window Banner (from policies.ts) */}
      <div className="bg-base border border-subtle p-3.5 rounded-sm flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted-dark">
        <div className="flex items-center gap-2">
          <span>•</span>
          <span>
            Check-in: <strong>{showPolicy(propertyPolicies.checkInWindow)}</strong>
          </span>
        </div>
        <div>
          Check-out: <strong>{showPolicy(propertyPolicies.checkOutTime)}</strong>
        </div>
        <div className="text-accent flex items-center gap-1.5">
          <span>•</span>
          <span>
            Adults Only
            {propertyPolicies.minGuestAge.status === "confirmed" && propertyPolicies.minGuestAge.value
              ? ` (${propertyPolicies.minGuestAge.value}+)`
              : ""}
          </span>
        </div>
      </div>

      {/* Step 1: Date Range Picker */}
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase tracking-widest text-accent flex items-center gap-2">
            <span>01 // SELECT DATES ({pricing.nights} {pricing.nights === 1 ? "NIGHT" : "NIGHTS"})</span>
          </label>
          <span className="text-[11px] text-muted-dark">Min. 1 night</span>
        </div>

        {/* Date Selector Trigger Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            aria-expanded={showDatePicker}
            aria-label="Select check-in date"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-base border border-subtle hover:border-accent/50 px-4 py-3 rounded-sm text-left flex items-center justify-between transition-colors"
          >
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-dark block">
                CHECK-IN DATE
              </span>
              <span className="text-xs text-on-dark font-medium mt-0.5 block">
                {dateRange?.from ? format(dateRange.from, "EEE, MMM d, yyyy") : "Select date"}
              </span>
            </div>
            <span className="text-accent text-xs">▼</span>
          </button>

          <button
            type="button"
            aria-expanded={showDatePicker}
            aria-label="Select check-out date"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-base border border-subtle hover:border-accent/50 px-4 py-3 rounded-sm text-left flex items-center justify-between transition-colors"
          >
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-dark block">
                CHECK-OUT DATE
              </span>
              <span className="text-xs text-on-dark font-medium mt-0.5 block">
                {dateRange?.to ? format(dateRange.to, "EEE, MMM d, yyyy") : "Select date"}
              </span>
            </div>
            <span className="text-accent text-xs">▼</span>
          </button>
        </div>

        {/* Themed DayPicker Calendar Popup with Sold Out Disabled Days */}
        {showDatePicker && (
          <div className="bg-base border border-subtle p-4 rounded-sm flex flex-col items-center shadow-2xl animate-in fade-in duration-200">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={handleSelectDateRange}
              disabled={[
                { before: today },
                // Disable dates returned as sold-out in the calendar feed
                ...(calendarMonth?.days
                  .filter((d) => d.state === "sold-out")
                  .map((d) => parseISO(d.date)) || []),
              ]}
              numberOfMonths={1}
              showOutsideDays={false}
            />
            <div className="w-full pt-3 mt-2 border-t border-subtle flex items-center justify-between">
              <span className="text-xs text-muted-dark">
                {pricing.nights > 0 ? `${pricing.nights} nights selected` : "Select departure date"}
              </span>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="bg-surface hover:bg-subtle text-on-dark text-xs py-1.5 px-4 rounded-sm transition-colors border border-subtle"
              >
                APPLY DATES
              </button>
            </div>
          </div>
        )}

        {/* Availability Badge */}
        {isCheckingAvail && (
          <div className="text-xs text-muted-dark animate-pulse flex items-center gap-1.5 pt-1">
            <span>•</span>
            <span>Checking live space availability...</span>
          </div>
        )}

        {!isCheckingAvail && availability && (
          <div className="pt-1">
            {availability.isAvailable ? (
              <span
                className={`text-xs px-2.5 py-1 rounded-sm border inline-flex items-center gap-1.5 ${
                  availability.minUnitsLeft <= 2
                    ? "bg-accent/15 border-accent text-accent"
                    : "bg-success/15 border-success text-success"
                }`}
              >
                <span>✓</span>
                <span>
                  {availability.minUnitsLeft <= 2
                    ? `Only ${availability.minUnitsLeft} left for these dates!`
                    : "Available for selected dates"}
                </span>
              </span>
            ) : (
              <div className="p-3 bg-base border border-subtle rounded-sm text-xs text-accent space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <span>✕</span>
                  <span>Fully booked for these dates.</span>
                </div>

                {soldOutAlternatives && soldOutAlternatives.alternativeDates.length > 0 && (
                  <div className="pt-1">
                    <span className="text-on-dark block mb-1">Nearby available dates:</span>
                    <div className="flex flex-wrap gap-2">
                      {soldOutAlternatives.alternativeDates.map((alt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDateRange({ from: parseISO(alt.checkIn), to: parseISO(alt.checkOut) });
                            setValue("checkIn", alt.checkIn, { shouldValidate: true });
                            setValue("checkOut", alt.checkOut, { shouldValidate: true });
                          }}
                          className="bg-surface hover:bg-subtle text-on-dark text-[10px] px-2.5 py-1 rounded-sm border border-subtle transition-colors"
                        >
                          {alt.checkIn} → {alt.checkOut} ({alt.minUnitsLeft} left)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Radio-Card Room Selector */}
      <div className="space-y-3 font-mono">
        <label className="text-[11px] uppercase tracking-widest text-accent flex items-center gap-2">
          <span>02 // CHOOSE YOUR SPACE</span>
        </label>

        <div role="radiogroup" aria-label="Choose your space" className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rooms.map((room) => {
            const isSelected = selectedRoomId === room.id;

            return (
              <div
                key={room.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleRoomSelect(room.id)}
                className={`relative bg-base p-4 rounded-sm border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-accent ring-1 ring-accent shadow-xl"
                    : "border-subtle hover:border-accent/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden bg-surface">
                    <SiteImage
                      slot={room.imageSlots?.[0] || room.images[0]?.slot || "hero-main"}
                      sizes="300px"
                      className="object-cover"
                    />
                    {room.highlight && (
                      <span className="absolute top-2 left-2 bg-base/90 border border-accent/40 text-accent text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm">
                        {room.highlight}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-normal text-base text-on-dark leading-snug">
                      {room.name}
                    </h4>
                    <span className="text-[10px] text-muted-dark block mt-0.5">
                      Max {room.maxGuests} {room.maxGuests === 1 ? "guest" : "guests"} • {room.bedConfig}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-subtle/60 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium text-on-dark">
                        {formatAED(room.startingRateAED * 0.85)}
                      </span>
                      <span className="text-[10px] text-muted-dark line-through">
                        {formatAED(room.startingRateAED)}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-dark block">
                      Sample rate
                    </span>
                  </div>
                  <span className="text-[10px] text-accent uppercase">
                    15% OFF
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Guests and Guest Information */}
      <div className="space-y-4 font-mono">
        <label className="text-[11px] uppercase tracking-widest text-accent flex items-center gap-2">
          <span>03 // GUEST COUNT &amp; DETAILS</span>
        </label>

        {/* Guest Stepper */}
        <div className="bg-base p-4 rounded-sm border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-on-dark block">
              Adult Guests
            </span>
            <span className="text-[10px] text-muted-dark">
              Clamped to space limit ({currentRoom.maxGuests} max for {currentRoom.name})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={adultsCount <= 1}
              onClick={() => setValue("adults", Math.max(1, adultsCount - 1), { shouldValidate: true })}
              className="w-7 h-7 rounded-sm bg-surface hover:bg-subtle disabled:opacity-30 border border-subtle flex items-center justify-center text-on-dark text-xs"
              aria-label="Decrease adult count"
            >
              -
            </button>

            <span className="text-xs text-on-dark w-6 text-center">
              {adultsCount}
            </span>

            <button
              type="button"
              disabled={adultsCount >= currentRoom.maxGuests}
              onClick={() => setValue("adults", Math.min(currentRoom.maxGuests, adultsCount + 1), { shouldValidate: true })}
              className="w-7 h-7 rounded-sm bg-surface hover:bg-subtle disabled:opacity-30 border border-subtle flex items-center justify-center text-on-dark text-xs"
              aria-label="Increase adult count"
            >
              +
            </button>
          </div>
        </div>

        {/* Single line under the guest selector */}
        <div className="text-[11px] text-muted-dark px-1">
          {propertyPolicies.minGuestAge.status === "confirmed" && propertyPolicies.minGuestAge.value
            ? `Adults only property. Guests must be ${propertyPolicies.minGuestAge.value}+.`
            : "Adults only property."}
        </div>

        {/* Required Adults-Only Confirmation Checkbox */}
        <label className="flex items-center gap-2.5 p-3.5 bg-base border border-subtle rounded-sm cursor-pointer hover:border-accent/40 transition-colors">
          <input
            type="checkbox"
            checked={isAdultsConfirmed}
            onChange={(e) => setIsAdultsConfirmed(e.target.checked)}
            className="w-4 h-4 rounded-sm accent-accent text-accent focus:ring-accent bg-surface border-subtle cursor-pointer"
            id="adults-age-confirmation-checkbox"
          />
          <span className="text-xs text-on-dark select-none font-sans font-light">
            All guests are {propertyPolicies.minGuestAge.value || 18} or older.
          </span>
        </label>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="guestName" className="text-xs text-muted-dark flex items-center gap-1">
              <span>Full Name</span>
              <span className="text-accent">*</span>
            </label>
            <input
              id="guestName"
              type="text"
              placeholder="e.g. Elena Rostova"
              {...register("guestName")}
              className="w-full bg-base border border-subtle text-on-dark text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-accent"
              aria-invalid={Boolean(errors.guestName)}
            />
            {errors.guestName && (
              <p className="text-xs text-rose-400 mt-1">{errors.guestName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="guestPhone" className="text-xs text-muted-dark flex items-center gap-1">
              <span>Phone / WhatsApp</span>
              <span className="text-accent">*</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              placeholder="+971 50 123 4567"
              {...register("guestPhone")}
              className="w-full bg-base border border-subtle text-on-dark text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-accent font-mono"
              aria-invalid={Boolean(errors.guestPhone)}
            />
            {errors.guestPhone && (
              <p className="text-xs text-rose-400 mt-1">{errors.guestPhone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="guestEmail" className="text-xs text-muted-dark flex items-center gap-1">
            <span>Email Address (Optional)</span>
          </label>
          <input
            id="guestEmail"
            type="email"
            placeholder="e.g. elena@company.com"
            {...register("guestEmail")}
            className="w-full bg-base border border-subtle text-on-dark text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Special Requests */}
        <div className="space-y-1">
          <label htmlFor="notes" className="text-xs text-muted-dark">
            Arrival Notes / Special Requests (Optional)
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="e.g. Late flight arrival, quiet space request."
            {...register("notes")}
            className="w-full bg-base border border-subtle text-on-dark text-xs px-3.5 py-2 rounded-sm focus:outline-none focus:border-accent resize-none font-sans"
          />
        </div>
      </div>

      {/* Step 4: Optional Add-ons (from addons.ts) */}
      <div className="space-y-3 font-mono">
        <label className="text-[11px] uppercase tracking-widest text-accent flex items-center gap-2">
          <span>04 // OPTIONAL ADD-ONS (ON REQUEST)</span>
        </label>

        <div className="space-y-2">
          {propertyAddons.map((addon) => {
            const isChecked = selectedAddons.includes(addon.id);

            return (
              <label
                key={addon.id}
                className={`flex items-start gap-3 p-3.5 rounded-sm border cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-base border-accent"
                    : "bg-base border-subtle hover:border-subtle/80"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleAddon(addon.id)}
                  className="mt-0.5 rounded-sm border-subtle accent-accent text-accent focus:ring-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-dark block">{addon.name}</span>
                    <span className="text-[10px] text-accent">
                      {addon.id === "airport-shuttle" || !addon.priceConfirmed
                        ? "Request, subject to confirmation"
                        : `${addon.priceAED} AED`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-dark mt-0.5 leading-relaxed font-sans font-light">
                    {addon.description} <em className="text-accent">(Subject to confirmation)</em>
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Step 5: Promo Code Box */}
      <div className="bg-base p-4 rounded-sm border border-subtle flex items-center justify-between font-mono">
        <div className="flex items-center gap-2.5">
          <span className="text-accent">★</span>
          <div>
            <span className="text-xs text-on-dark">
              {siteConfig.promoCode}
            </span>
            <span className="text-[10px] text-muted-dark block">
              Direct Booking Privilege (15% Off Total Stay)
            </span>
          </div>
        </div>

        <span className="text-[10px] text-accent border border-accent/40 px-2 py-0.5 rounded-sm">
          ✓ APPLIED
        </span>
      </div>

      {/* Price Summary Block */}
      <div className="bg-base border border-accent/40 p-6 rounded-sm space-y-4 shadow-xl font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-subtle text-xs text-muted-dark">
          <span>
            {formatAED(currentRoom.startingRateAED)} × {pricing.nights} {pricing.nights === 1 ? "night" : "nights"}
          </span>
          <span className="text-on-dark font-medium">
            {formatAED(pricing.subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-subtle text-xs text-accent">
          <span>Direct 15% Privilege</span>
          <span>
            - {formatAED(pricing.discountAmount)}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-dark block">
              ESTIMATED TOTAL
            </span>
            <span className="text-[11px] text-muted-dark font-sans font-light">
              Our team confirms your request by WhatsApp.
            </span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-mono text-on-dark font-medium">
              {formatAED(pricing.totalAED)}
            </span>
            <span className="text-[10px] text-muted-dark block">
              Sample rate
            </span>
          </div>
        </div>
      </div>

      {/* Action / Submit Button */}
      <div className="space-y-3 font-mono">
        <button
          type="submit"
          disabled={Boolean(
            isSubmitting ||
            pricing.nights <= 0 ||
            !isAdultsConfirmed ||
            (availability && !availability.isAvailable)
          )}
          className="w-full bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-base py-3.5 px-6 rounded-sm text-xs font-medium uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-xl"
        >
          <span>{isSubmitting ? "CREATING RESERVATION HOLD..." : "REQUEST DIRECT RESERVATION"}</span>
          <span aria-hidden="true">→</span>
        </button>

        <div
          id={errorAlertId}
          aria-live="polite"
          className="text-center text-xs text-muted-dark space-y-1.5"
        >
          <p className="text-on-dark">
            12-Hour Courtesy Hold • Team Confirms via WhatsApp
          </p>
          <p className="text-[11px] text-muted-dark leading-relaxed font-sans font-light">
            We collect your name, phone number, and stay preferences solely to process your reservation request. We do not sell your data. Guest records are retained for {propertyPolicies.retentionPeriodDays} days after check-out and can be removed upon request.
          </p>
        </div>
      </div>
    </form>
  );
}
