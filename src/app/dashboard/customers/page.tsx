import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { CustomersTable } from "@/components/customers-table";
import { getCustomers } from "@/lib/db/queries/customers";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer database"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <CustomersData />
      </Suspense>
    </div>
  );
}

async function CustomersData() {
  const customers = await getCustomers();
  return <CustomersTable customers={customers} />;
}
