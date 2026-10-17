"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "OVERVIEW", href: "/#overview" },
    { label: "ACCOMMODATIONS", href: "/rooms" },
    { label: "AMENITIES", href: "/amenities" },
    { label: "LOOKUP", href: "/lookup" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-[#10100F]/95 backdrop-blur-md border-b border-subtle py-4 shadow-2xl"
          : "bg-[#10100F] py-5 border-b border-subtle/60"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Architectural Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus:outline-none focus:ring-1 focus:ring-accent rounded-sm"
          >
            <div className="w-8 h-8 rounded-sm border border-accent/40 bg-surface text-accent flex items-center justify-center font-serif text-base tracking-widest group-hover:border-accent transition-colors">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl tracking-wider text-on-dark uppercase leading-none font-medium">
                RIZQ VILLA
              </span>
              <span className="text-[9px] tracking-widest text-accent uppercase font-mono mt-1">
                DUBAI • SANCTUARY
              </span>
            </div>
          </Link>

          {/* Centered Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-[11px] font-mono tracking-widest uppercase transition-colors py-1 ${
                    isActive
                      ? "text-accent border-b border-accent"
                      : "text-muted-dark hover:text-on-dark"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/lookup"
              className="text-[11px] font-mono text-muted-dark hover:text-on-dark tracking-widest uppercase transition-colors"
            >
              FIND STAY
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 border border-accent/60 bg-accent hover:bg-accent-strong text-base px-4 py-2 rounded-sm text-[11px] font-mono font-medium tracking-widest uppercase transition-all duration-200"
            >
              <span>BOOK DIRECT</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/book"
              className="bg-accent text-base font-mono font-semibold px-3 py-1.5 rounded-sm text-[11px] tracking-wider uppercase"
            >
              BOOK
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="text-on-dark p-2 border border-subtle rounded-sm bg-surface font-mono text-xs tracking-wider"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-full bg-[#10100F]/98 backdrop-blur-xl border-b border-subtle px-6 py-8 flex flex-col gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4 text-sm" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-on-dark hover:text-accent font-serif text-lg tracking-wider uppercase py-2 border-b border-subtle flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-accent text-sm font-mono">→</span>
              </Link>
            ))}
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-accent hover:bg-accent-strong text-base font-mono font-medium py-3 rounded-sm text-xs tracking-widest uppercase transition-colors"
            >
              BOOK DIRECT (CODE: RIZQDIRECT) →
            </Link>
            <Link
              href="/lookup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center border border-subtle text-muted-dark hover:text-on-dark font-mono py-2.5 rounded-sm text-xs tracking-widest uppercase transition-colors"
            >
              FIND EXISTING BOOKING
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
