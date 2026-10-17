import { SiteImage } from "@/components/ui/SiteImage";
import { siteConfig } from "@/data/site";

export function LocationBlock() {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${siteConfig.geo.lat},${siteConfig.geo.lng}`;

  const proximityPoints = [
    { name: "Downtown Dubai & Burj Khalifa", note: "Minutes from the villa" },
    { name: "Business Bay Border", note: "Adjacent central district" },
    { name: "Al Quoz Creative District", note: "Local arts & cafés area" },
  ];

  return (
    <section id="location" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-base text-on-dark border-b border-subtle font-mono">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-accent block">
              LOCATION &amp; TRANSIT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-on-dark font-normal leading-tight">
              Dubai • Al Quoz &amp; Business Bay
            </h2>
            <p className="text-sm text-muted-dark leading-relaxed font-sans font-light">
              Strategically positioned on the Al Quoz / Business Bay border, convenient to Downtown Dubai and Burj Khalifa.
            </p>
          </div>

          <div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-surface hover:bg-accent text-on-dark hover:text-base px-5 py-3 rounded-sm text-xs tracking-wider uppercase border border-subtle hover:border-accent transition-colors shadow-sm"
            >
              <span>Open in Google Maps →</span>
            </a>
          </div>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Styled Map Graphic */}
          <div className="lg:col-span-8 relative aspect-[16/10] rounded-sm overflow-hidden border border-subtle bg-surface shadow-2xl">
            <SiteImage
              slot="location-view"
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
            {/* Overlay Coordinates Pill */}
            <div className="absolute bottom-4 left-4 bg-base/90 border border-subtle px-3.5 py-1.5 rounded-sm text-xs text-muted-dark backdrop-blur-md flex items-center gap-2 shadow-lg">
              <span className="text-accent">•</span>
              <span className="font-mono text-on-dark font-medium">25.1575° N, 55.2702° E</span>
            </div>
          </div>

          {/* Location Key Points Card */}
          <div className="lg:col-span-4 bg-surface border border-subtle p-6 sm:p-8 rounded-sm flex flex-col justify-between space-y-6 shadow-xl">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-accent block">
                  NEIGHBORHOOD
                </span>
                <h3 className="font-serif text-2xl text-on-dark mt-1 uppercase font-normal">
                  Nearby Areas
                </h3>
              </div>

              <div className="space-y-4">
                {proximityPoints.map((pt, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between pb-3 border-b border-subtle text-xs"
                    >
                      <div className="flex items-center gap-2.5 text-on-dark font-medium font-sans">
                        <span className="text-accent">•</span>
                        <span>{pt.name}</span>
                      </div>
                      <span className="text-muted-dark text-[11px] font-sans">
                        {pt.note}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-base p-4 rounded-sm border border-subtle text-xs space-y-1">
              <span className="text-accent block uppercase text-[10px] tracking-wider">Address Note:</span>
              <p className="text-muted-dark leading-relaxed font-sans font-light">
                {siteConfig.address}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
