import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { MechanicsTable } from "@/components/mechanics-table";
import { getMechanics } from "@/lib/db/queries/mechanics";

export default function MechanicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mechanics"
        description="Manage your garage mechanics"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <MechanicsData />
      </Suspense>
    </div>
  );
}

async function MechanicsData() {
  const mechanics = await getMechanics();
  return <MechanicsTable mechanics={mechanics} />;
}
