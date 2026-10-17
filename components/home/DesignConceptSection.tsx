import { SavingsCalculator } from "@/components/home/SavingsCalculator";

export function DesignConceptSection() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!isDemo) {
    return null;
  }

  const conceptCards = [
    {
      num: "01",
      title: "Direct Host Relationship",
      description:
        "Every reservation made directly through WhatsApp connects guests immediately with the on-site team. Retaining direct communication enables personalized guest care and exclusive direct privileges like the 15% promotional code.",
    },
    {
      num: "02",
      title: "Highlight Core Amenities",
      description:
        "Third-party listing sites often obscure key differentiators. This bespoke direct portal highlights the 500 Mbps Wi-Fi, outdoor swimming pool, coworking space, and social lounge/café with high visual fidelity.",
    },
    {
      num: "03",
      title: "Direct WhatsApp Inquiries",
      description:
        "Digital nomads and remote builders value rapid communication. Direct WhatsApp routing captures high-intent inquiries immediately, allowing team members to answer questions and confirm stays seamlessly.",
    },
  ];

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle relative overflow-hidden font-mono">
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-surface border border-accent/40 px-3 py-1 rounded-sm text-[11px] text-accent uppercase tracking-widest">
            <span>DESIGN CONCEPT • OWNER BRIEF</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl uppercase tracking-tight text-on-dark font-normal leading-tight">
            Why This Direct Platform Exists
          </h2>
          <p className="text-sm text-muted-dark leading-relaxed font-sans font-light">
            Built specifically for Rizq Luxurious Villa to build direct guest relationships through an owned direct booking channel.
          </p>
        </div>

        {/* 3 Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {conceptCards.map((card, idx) => {
            return (
              <div
                key={idx}
                className="bg-surface border border-subtle p-6 sm:p-7 rounded-sm space-y-4 hover:border-accent/50 transition-colors shadow-lg"
              >
                <div className="w-8 h-8 rounded-sm bg-base border border-accent/40 flex items-center justify-center text-accent text-xs">
                  {card.num}
                </div>
                <h3 className="font-serif text-lg text-on-dark uppercase font-normal">{card.title}</h3>
                <p className="text-xs text-muted-dark leading-relaxed font-sans font-light">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Savings Calculator Component */}
        <SavingsCalculator />
      </div>
    </section>
  );
}
