import { DataTableSkeleton } from "@/components/data-table-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted/40" />
          <div className="h-4 w-72 rounded bg-muted/30" />
        </div>
        <div className="h-8 w-28 rounded-lg bg-muted/30" />
      </div>
      <DataTableSkeleton columns={6} rows={8} />
    </div>
  );
}
