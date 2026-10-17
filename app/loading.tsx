export default function RootLoading() {
  return (
    <div
      className="min-h-screen bg-base text-on-dark pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <span className="sr-only">Loading Rizq Luxurious Villa...</span>

      {/* Hero Skeleton */}
      <div className="max-w-7xl mx-auto w-full py-12 lg:py-20 space-y-8 animate-pulse">
        {/* Chip skeleton */}
        <div className="h-7 w-64 bg-surface rounded-full border border-subtle" />

        {/* Eyebrow skeleton */}
        <div className="h-4 w-48 bg-surface/60 rounded" />

        {/* H1 Headline skeleton */}
        <div className="space-y-3 max-w-3xl">
          <div className="h-12 sm:h-16 w-full bg-surface rounded" />
          <div className="h-12 sm:h-16 w-3/4 bg-surface rounded" />
        </div>

        {/* Subhead skeleton */}
        <div className="space-y-2 max-w-xl pt-2">
          <div className="h-4 w-full bg-surface/60 rounded" />
          <div className="h-4 w-5/6 bg-surface/60 rounded" />
        </div>

        {/* CTA Buttons skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="h-12 w-64 bg-accent/20 rounded-sm border border-accent/30" />
          <div className="h-12 w-48 bg-surface rounded-sm border border-subtle" />
        </div>
      </div>

      {/* Booking Bar / Strip Skeleton */}
      <div className="max-w-7xl mx-auto w-full animate-pulse pt-8">
        <div className="h-24 bg-surface/80 border border-subtle rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 p-4 items-center">
          <div className="h-10 bg-base rounded" />
          <div className="h-10 bg-base rounded" />
          <div className="h-10 bg-base rounded hidden md:block" />
          <div className="h-10 bg-base rounded hidden md:block" />
        </div>
      </div>
    </div>
  );
}
