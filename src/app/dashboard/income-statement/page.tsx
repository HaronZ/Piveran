import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { IncomeStatementView } from "@/components/income-statement-view";
import { getIncomeSummary } from "@/lib/db/queries/cash-log";

export default function IncomeStatementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Income Statement"
        description="Monthly revenue, expenses, and profit overview"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <IncomeData />
      </Suspense>
    </div>
  );
}

async function IncomeData() {
  const data = await getIncomeSummary();
  return <IncomeStatementView data={data} />;
}
