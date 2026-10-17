import Link from "next/link";
import { siteConfig } from "@/data/site";

export const metadata = {
  title: "404 • Page Not Found | Rizq Luxurious Villa",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="min-h-[85vh] bg-base text-on-dark flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden font-mono">
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3 py-1 rounded-sm text-xs text-accent uppercase tracking-widest">
          <span>Error 404 • Page Not Located</span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl uppercase tracking-tight text-on-dark font-normal leading-tight">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-muted-dark text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-sans font-light">
          The requested page is unavailable or has moved. Return to our main villa portal, explore our
          capsule pods and suites, or contact concierge directly via WhatsApp.
        </p>

        {/* Direct Action Grid */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-strong text-base font-medium px-6 py-3.5 rounded-sm text-xs tracking-widest uppercase transition-colors shadow-lg"
          >
            <span>Return to Homepage →</span>
          </Link>

          <Link
            href="/rooms"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-on-dark px-6 py-3.5 rounded-sm text-xs uppercase tracking-widest border border-subtle transition-colors"
          >
            <span>Explore Rooms →</span>
          </Link>

          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
              "Hello Rizq Luxurious Villa Team, I would like to inquire about booking a stay."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-on-dark px-6 py-3.5 rounded-sm text-xs uppercase tracking-widest border border-subtle transition-colors"
          >
            <span>WhatsApp Concierge →</span>
          </a>
        </div>
      </div>
    </div>
  );
}
