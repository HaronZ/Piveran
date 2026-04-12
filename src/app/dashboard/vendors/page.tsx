import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/vendors-table";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { getVendors } from "@/lib/db/queries/vendors";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Vendors | Sir Keith Auto Parts & Garage",
  description: "Manage your parts vendors and supplier contacts.",
};

async function VendorsContent() {
  const vendors = await getVendors();
  return <VendorsTable vendors={vendors} />;
}

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage your parts suppliers, contacts, and vendor information."
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>Live data</span>
        </div>
      </PageHeader>

      <Suspense fallback={<DataTableSkeleton columns={6} rows={8} />}>
        <VendorsContent />
      </Suspense>
    </div>
  );
}
