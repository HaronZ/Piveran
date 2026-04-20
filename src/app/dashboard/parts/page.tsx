import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PartsTable } from "@/components/parts-table";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { getParts, getBrandsForFilter, getCabinetCodes, getVendorsForSelector } from "@/lib/db/queries/parts";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Parts | Sir Keith Auto Parts & Garage",
  description: "Manage your parts catalog, stock levels, and pricing.",
};

async function PartsContent() {
  const [parts, brands, cabinetCodes, vendors] = await Promise.all([
    getParts(),
    getBrandsForFilter(),
    getCabinetCodes(),
    getVendorsForSelector(),
  ]);

  return (
    <PartsTable parts={parts} brands={brands} cabinetCodes={cabinetCodes} vendors={vendors} />
  );
}

export default function PartsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts Catalog"
        description="Manage your auto parts inventory, pricing, and stock levels."
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Live data</span>
        </div>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columns={7} rows={10} />}>
        <PartsContent />
      </Suspense>
    </div>
  );
}
