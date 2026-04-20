import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { SkillsTable } from "@/components/skills-table";
import { getSkills } from "@/lib/db/queries/skills";

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        description="Manage the skill catalog that can be assigned to mechanics"
      />
      <Suspense fallback={<DataTableSkeleton />}>
        <SkillsData />
      </Suspense>
    </div>
  );
}

async function SkillsData() {
  const skills = await getSkills();
  return <SkillsTable skills={skills} />;
}
