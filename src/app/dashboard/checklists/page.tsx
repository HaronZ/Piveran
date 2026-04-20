import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { ChecklistsTable } from "@/components/checklists-table";
import { getChecklists } from "@/lib/db/queries/checklists";

export default function ChecklistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Checklists"
        description="Manage inspection checklists and their media references"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <ChecklistsData />
      </Suspense>
    </div>
  );
}

async function ChecklistsData() {
  const checklists = await getChecklists();
  return <ChecklistsTable checklists={checklists} />;
}
