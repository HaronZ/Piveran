import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { CashiersTable } from "@/components/cashiers-table";
import { getCashiers } from "@/lib/db/queries/cashiers";

export default function CashiersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashiers"
        description="Manage cashier staff who process payments"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <CashiersData />
      </Suspense>
    </div>
  );
}

async function CashiersData() {
  const cashiers = await getCashiers();
  return <CashiersTable cashiers={cashiers} />;
}
