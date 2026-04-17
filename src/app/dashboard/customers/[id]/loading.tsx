export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-36 rounded bg-muted/30" />
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-muted/40" />
        <div className="flex flex-col sm:flex-row gap-6 p-6">
          <div className="h-20 w-20 rounded-2xl bg-muted/40" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-60 rounded bg-muted/40" />
            <div className="h-3 w-40 rounded bg-muted/30" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="h-4 w-full rounded bg-muted/30" />
              <div className="h-4 w-full rounded bg-muted/30" />
              <div className="h-4 w-full rounded bg-muted/30" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md" />
        <div className="h-48 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md" />
      </div>
      <div className="h-56 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md" />
    </div>
  );
}
