export function DataTableSkeleton({ columns = 5, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-72 rounded-lg bg-muted/50" />
        <div className="h-10 w-36 rounded-lg bg-muted/50" />
        <div className="ml-auto h-10 w-32 rounded-lg bg-muted/50" />
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 border-b border-border/40 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-muted/40" />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-border/20 px-4 py-4 last:border-0"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-muted/30"
                style={{ maxWidth: j === 0 ? "200px" : j === columns - 1 ? "80px" : "150px" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
