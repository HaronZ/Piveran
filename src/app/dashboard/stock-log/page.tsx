import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { StockLogTable } from "@/components/stock-log-table";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import {
  getStockLogs,
  getInventoryActions,
  getUnits,
  getSalesTypes,
  getPaymentTypes,
} from "@/lib/db/queries/stock-log";
import {
  getPartsForSelector,
  getVendorsForSelector,
} from "@/lib/db/queries/purchase-requests";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Stock Log | Sir Keith Auto Parts & Garage",
  description: "Track inventory movements — stock in, sales, damage, and more.",
};

async function StockLogContent() {
  const [logs, parts, vendors, actions, units, salesTypes, paymentTypes] =
    await Promise.all([
      getStockLogs(),
      getPartsForSelector(),
      getVendorsForSelector(),
      getInventoryActions(),
      getUnits(),
      getSalesTypes(),
      getPaymentTypes(),
    ]);

  return (
    <StockLogTable
      logs={logs}
      parts={parts}
      vendors={vendors}
      actions={actions}
      units={units}
      salesTypes={salesTypes}
      paymentTypes={paymentTypes}
    />
  );
}

export default function StockLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Log"
        description="Track every inventory movement — stock in, sales, damage, and adjustments."
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Live data</span>
        </div>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columns={8} rows={8} />}>
        <StockLogContent />
      </Suspense>
    </div>
  );
}
