"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteImage } from "@/components/ui/SiteImage";
import { siteConfig } from "@/data/site";
import { rooms } from "@/data/rooms";

export function Hero() {
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState<string>(rooms[0]?.id || "premium-single-capsule");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedRoom) params.set("room", selectedRoom);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    router.push(`/book?${params.toString()}`);
  };

  return (
    <section className="bg-base text-on-dark pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Eyebrow & Editorial Title Section */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="w-6 h-px bg-accent" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-accent">
              Rizq Luxurious Villa • Dubai Sanctuary
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-on-dark font-normal leading-[1.05]">
            A Different Way to Stay in Dubai.
          </h1>

          <p className="text-muted-dark text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed">
            A serene boutique villa-hostel and coworking sanctuary on the Al Quoz / Business Bay border. 
            Capsule pods, private suites, 500 Mbps Wi-Fi, an outdoor pool, and quiet social spaces for creators and travelers.
          </p>
        </div>

        {/* Architectural Quick Availability Bar */}
        <div className="bg-surface border border-subtle p-3 sm:p-4 rounded-sm shadow-2xl">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center"
          >
            {/* Check-In */}
            <div className="bg-base/70 border border-subtle/80 p-3 rounded-sm">
              <label htmlFor="hero-checkin" className="block text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
                Check-In Date
              </label>
              <input
                id="hero-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-on-dark text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Check-Out */}
            <div className="bg-base/70 border border-subtle/80 p-3 rounded-sm">
              <label htmlFor="hero-checkout" className="block text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
                Check-Out Date
              </label>
              <input
                id="hero-checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-on-dark text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Room Type */}
            <div className="bg-base/70 border border-subtle/80 p-3 rounded-sm">
              <label htmlFor="hero-room" className="block text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
                Accommodation
              </label>
              <select
                id="hero-room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-transparent text-on-dark text-xs font-mono focus:outline-none"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id} className="bg-surface text-on-dark">
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Submit */}
            <div className="flex items-center">
              <button
                type="submit"
                className="w-full h-full min-h-[52px] bg-accent hover:bg-accent-strong text-base px-6 py-3 rounded-sm text-xs font-mono font-medium tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>CHECK AVAILABILITY</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          <div className="pt-3 mt-3 border-t border-subtle/50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted-dark">
            <span className="text-accent">
              ★ Direct Privilege: 15% off with code {siteConfig.promoCode}
            </span>
            <span>Adults Only Residence • WhatsApp Confirmation</span>
          </div>
        </div>

        {/* Main Architectural Hero Image */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-sm overflow-hidden border border-subtle bg-surface">
          <SiteImage
            slot="hero-main"
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent pointer-events-none" />

          {/* Coordinates & Location Stamp */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[11px] font-mono tracking-widest uppercase text-on-dark/90 bg-base/80 backdrop-blur-md px-4 py-2 border border-subtle rounded-sm">
            <span>25.1867° N, 55.2530° E</span>
            <span className="hidden sm:inline text-accent">•</span>
            <span>AL QUOZ / BUSINESS BAY • DUBAI</span>
          </div>
        </div>

        {/* Minimal Numbered Pillar Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-subtle/60">
          <div className="bg-surface/50 border border-subtle p-5 rounded-sm space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">01 // ACCOMMODATION</span>
            <h2 className="font-serif text-lg text-on-dark font-medium">Capsule Pods &amp; Suites</h2>
            <p className="text-xs text-muted-dark font-light leading-relaxed">
              Quiet sleeping pods with personal storage, reading light, and access to shared villa amenities.
            </p>
          </div>

          <div className="bg-surface/50 border border-subtle p-5 rounded-sm space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">02 // CONNECTIVITY</span>
            <h2 className="font-serif text-lg text-on-dark font-medium">500 Mbps Wi-Fi</h2>
            <p className="text-xs text-muted-dark font-light leading-relaxed">
              High-speed internet in dedicated coworking rooms and common spaces for seamless remote work.
            </p>
          </div>

          <div className="bg-surface/50 border border-subtle p-5 rounded-sm space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">03 // WELLNESS</span>
            <h2 className="font-serif text-lg text-on-dark font-medium">Outdoor Pool &amp; Lounge</h2>
            <p className="text-xs text-muted-dark font-light leading-relaxed">
              Open-air swimming pool surrounded by peaceful sun loungers and shared outdoor seating.
            </p>
          </div>

          <div className="bg-surface/50 border border-subtle p-5 rounded-sm space-y-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">04 // PRIVILEGE</span>
            <h2 className="font-serif text-lg text-on-dark font-medium">15% Direct Privilege</h2>
            <p className="text-xs text-muted-dark font-light leading-relaxed">
              Book direct on our platform with code {siteConfig.promoCode} and receive instant confirmation via WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
