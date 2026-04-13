import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { CashLogTable } from "@/components/cash-log-table";
import { getCashLog, getCashActions, getExpenseTypes, getOpexTypes } from "@/lib/db/queries/cash-log";

export default function CashLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Log"
        description="Track all cash transactions"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <CashLogData />
      </Suspense>
    </div>
  );
}

async function CashLogData() {
  const [entries, actions, expenseTypes, opexTypes] = await Promise.all([
    getCashLog(),
    getCashActions(),
    getExpenseTypes(),
    getOpexTypes(),
  ]);
  return (
    <CashLogTable
      entries={entries}
      actions={actions}
      expenseTypes={expenseTypes}
      opexTypes={opexTypes}
    />
  );
}
