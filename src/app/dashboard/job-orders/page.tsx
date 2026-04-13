import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { JobOrdersTable } from "@/components/job-orders-table";
import { getJobOrders, getJoStatuses } from "@/lib/db/queries/job-orders";
import { getCustomersForSelector } from "@/lib/db/queries/customers";
import { getCars } from "@/lib/db/queries/cars";

export default function JobOrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Orders"
        description="Track all garage service orders"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <JobOrdersData />
      </Suspense>
    </div>
  );
}

async function JobOrdersData() {
  const [jobOrders, statuses, customers, cars] = await Promise.all([
    getJobOrders(),
    getJoStatuses(),
    getCustomersForSelector(),
    getCars(),
  ]);
  return (
    <JobOrdersTable
      jobOrders={jobOrders}
      statuses={statuses}
      customers={customers}
      cars={cars}
    />
  );
}
