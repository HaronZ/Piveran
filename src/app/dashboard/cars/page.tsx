import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { CarsTable } from "@/components/cars-table";
import { getCars } from "@/lib/db/queries/cars";
import { getCustomersForSelector } from "@/lib/db/queries/customers";

export default function CarsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cars"
        description="All vehicles in the system"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <CarsData />
      </Suspense>
    </div>
  );
}

async function CarsData() {
  const [cars, customers] = await Promise.all([
    getCars(),
    getCustomersForSelector(),
  ]);
  return <CarsTable cars={cars} customers={customers} />;
}
