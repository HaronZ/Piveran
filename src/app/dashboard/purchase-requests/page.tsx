import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { PrTable } from "@/components/pr-table";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import {
  getPurchaseRequests,
  getPrStatuses,
  getNextPrNumber,
} from "@/lib/db/queries/purchase-requests";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Purchase Requests | Sir Keith Auto Parts & Garage",
  description: "Manage purchase requests for inventory replenishment.",
};

async function PrContent() {
  const [purchaseRequests, statuses, nextPrNumber] = await Promise.all([
    getPurchaseRequests(),
    getPrStatuses(),
    getNextPrNumber(),
  ]);

  return (
    <PrTable
      purchaseRequests={purchaseRequests}
      statuses={statuses}
      nextPrNumber={nextPrNumber}
    />
  );
}

export default function PurchaseRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Requests"
        description="Create and manage purchase requests for inventory replenishment."
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Live data</span>
        </div>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columns={7} rows={8} />}>
        <PrContent />
      </Suspense>
    </div>
  );
}
