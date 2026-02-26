export default function LandingSocialProof() {
  const badges = [
    "AARP",
    "Forbes",
    "20M+ Check-ins",
    "★★★★★ 4.9/5",
  ];

  return (
    <section className="py-10 md:py-12 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground mb-6">Trusted by families and care organizations</p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {badges.map((b) => (
            <span key={b} className="px-5 py-2 rounded-full border border-border bg-card text-sm font-bold text-muted-foreground">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
