import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { ReportsClient } from "@/components/reports-client";
import {
  getInventorySnapshots,
  getVendorPricing,
  getStockAudits,
  getReportKPIs,
} from "@/lib/db/queries/reports";

export const metadata = {
  title: "Reports | Sir Keith Auto Parts & Garage",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Audits"
        description="Inventory valuation, vendor pricing comparison, and stock audits"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <ReportsData />
      </Suspense>
    </div>
  );
}

async function ReportsData() {
  const [kpis, snapshots, pricing, audits] = await Promise.all([
    getReportKPIs(),
    getInventorySnapshots(),
    getVendorPricing(),
    getStockAudits(),
  ]);
  return (
    <ReportsClient
      kpis={kpis}
      snapshots={snapshots}
      pricing={pricing}
      audits={audits}
    />
  );
}
