export default function PrDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 rounded-lg bg-muted/30" />
        <div className="h-7 w-44 rounded bg-muted/40" />
        <div className="h-5 w-20 rounded-full bg-muted/30" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md" />
        ))}
      </div>
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md h-80" />
    </div>
  );
}
