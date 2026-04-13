import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { ServiceCatalogTable } from "@/components/service-catalog-table";
import { getLaborTypesWithStats } from "@/lib/db/queries/service-catalog";

export const metadata = {
  title: "Service Catalog | Sir Keith Auto Parts & Garage",
};

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Catalog"
        description="Define labor types and service pricing for job orders"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <ServicesData />
      </Suspense>
    </div>
  );
}

async function ServicesData() {
  const laborTypes = await getLaborTypesWithStats();
  return <ServiceCatalogTable laborTypes={laborTypes} />;
}
