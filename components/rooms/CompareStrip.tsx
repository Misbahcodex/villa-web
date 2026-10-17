import Link from "next/link";
import { rooms } from "@/data/rooms";
import { formatAED, calculateDiscount } from "@/lib/pricing";
import { siteConfig } from "@/data/site";

export function CompareStrip() {
  const comparisonRows = [
    {
      feature: "Standard Rate",
      render: (r: (typeof rooms)[0]) => (
        <div>
          <span className="text-muted-dark line-through text-xs block font-mono">
            {formatAED(r.startingRateAED)} / nt
          </span>
        </div>
      ),
    },
    {
      feature: `Direct Privilege (-${siteConfig.discountPercent}%)`,
      render: (r: (typeof rooms)[0]) => {
        const discount = calculateDiscount(r.startingRateAED, siteConfig.discountPercent);
        return (
          <div className="font-mono">
            <span className="font-medium text-base text-on-dark block">
              {formatAED(r.startingRateAED - discount)} / nt
            </span>
            <span className="text-[10px] text-muted-dark">Sample rate</span>
          </div>
        );
      },
    },
    {
      feature: "Max Occupancy",
      render: (r: (typeof rooms)[0]) => (
        <span className="font-mono text-xs">{r.maxGuests} {r.maxGuests === 1 ? "Guest" : "Guests"}</span>
      ),
    },
    {
      feature: "Bedding Type",
      render: (r: (typeof rooms)[0]) => <span className="text-xs text-muted-dark font-mono">{r.bedConfig}</span>,
    },
    {
      feature: "500 Mbps Wi-Fi",
      render: () => <span className="text-accent font-bold">✓</span>,
    },
    {
      feature: "Coworking Space Access",
      render: () => <span className="text-accent font-bold">✓</span>,
    },
    {
      feature: "Outdoor Pool Access",
      render: () => <span className="text-accent font-bold">✓</span>,
    },
    {
      feature: "Work Desk Setup",
      render: (r: (typeof rooms)[0]) =>
        r.id === "executive-private-suite" ? (
          <span className="text-[11px] text-on-dark font-mono">In-Suite Desk</span>
        ) : (
          <span className="text-[11px] text-muted-dark font-mono">In Coworking</span>
        ),
    },
    {
      feature: "Secure Storage",
      render: () => <span className="text-accent font-bold">✓</span>,
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-5 h-px bg-accent" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-accent">
              Direct Comparison
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl uppercase tracking-tight text-on-dark font-normal">
            Compare Capsules &amp; Suites
          </h2>
          <p className="text-sm text-muted-dark font-light leading-relaxed">
            Every direct reservation unlocks 15% savings with code {siteConfig.promoCode}. Rates shown are illustrative until confirmed by the property.
          </p>
        </div>

        {/* Horizontally scrollable comparison table */}
        <div className="overflow-x-auto pb-4">
          <table className="w-full min-w-[700px] border-collapse text-left border border-subtle bg-surface rounded-sm overflow-hidden shadow-xl">
            <thead>
              <tr className="border-b border-subtle">
                <th className="p-4 sm:p-5 text-xs font-mono uppercase tracking-widest text-on-dark bg-base/80 w-1/4">
                  Specification
                </th>
                {rooms.map((room) => (
                  <th
                    key={room.id}
                    className="p-4 sm:p-5 text-center border-l border-subtle w-1/4 bg-surface"
                  >
                    <div className="space-y-1">
                      {room.highlight && (
                        <span className="inline-block text-[9px] font-mono uppercase tracking-widest bg-base border border-accent/40 text-accent px-2 py-0.5 rounded-sm">
                          {room.highlight}
                        </span>
                      )}
                      <span className="font-serif text-lg text-on-dark block font-normal">
                        {room.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle text-xs sm:text-sm text-on-dark">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-base/40 transition-colors">
                  <td className="p-3.5 sm:p-4 text-on-dark font-mono text-xs bg-base/50">
                    {row.feature}
                  </td>
                  {rooms.map((room) => (
                    <td
                      key={room.id}
                      className="p-3.5 sm:p-4 text-center border-l border-subtle"
                    >
                      {row.render(room)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Action CTA Row */}
              <tr className="bg-base/60">
                <td className="p-4 text-on-dark font-mono uppercase text-xs">Direct Reservation</td>
                {rooms.map((room) => (
                  <td key={room.id} className="p-4 text-center border-l border-subtle">
                    <Link
                      href={`/book?room=${room.id}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-accent hover:bg-accent-strong text-base text-xs font-mono font-medium py-2.5 px-3 rounded-sm uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <span>Book Direct</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
