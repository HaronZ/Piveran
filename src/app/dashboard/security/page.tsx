import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { SecurityClient } from "@/components/security-client";
import {
  getUsersWithRoles,
  getRolesWithViews,
  getRolesForSelector,
} from "@/lib/db/queries/security";

export const metadata = {
  title: "Security | Sir Keith Auto Parts & Garage",
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Access Control"
        description="Manage users, roles, and page-level permissions"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <SecurityData />
      </Suspense>
    </div>
  );
}

async function SecurityData() {
  const [users, roles, rolesForSelector] = await Promise.all([
    getUsersWithRoles(),
    getRolesWithViews(),
    getRolesForSelector(),
  ]);
  return (
    <SecurityClient
      users={users}
      roles={roles}
      rolesForSelector={rolesForSelector}
    />
  );
}
