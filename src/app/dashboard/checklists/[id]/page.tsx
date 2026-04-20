import { notFound } from "next/navigation";
import { getChecklistDetail } from "@/lib/db/queries/checklists";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import { ChecklistMediaSection } from "@/components/checklist-media-section";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChecklistDetailPage({ params }: Props) {
  const { id } = await params;
  const checklist = await getChecklistDetail(id);
  if (!checklist) return notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Checklists", href: "/dashboard/checklists" },
          { label: checklist.name },
        ]}
      />

      <Card className="border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500" />
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{checklist.name}</h1>
              {checklist.description && (
                <p className="text-sm text-muted-foreground mt-1">{checklist.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChecklistMediaSection
        checklistId={checklist.id}
        photos={checklist.photos}
        videos={checklist.videos}
      />
    </div>
  );
}
