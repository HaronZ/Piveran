import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getJobOrderById,
  getJoMaterials,
  getJoLabors,
  getJoPayments,
  getJoLaborMechanics,
  getJoPhotos,
  getJoComments,
  getLaborTypes,
  getJoMaterialStatuses,
  getJoLaborStatuses,
  getCashiers,
} from "@/lib/db/queries/jo-detail";
import { getPartsForSelector, getVendorsForSelector } from "@/lib/db/queries/purchase-requests";
import { getMechanicsForSelector } from "@/lib/db/queries/mechanics";
import { JoDetailClient } from "@/components/jo-detail-client";

export const metadata = {
  title: "Job Order Detail | Sir Keith Auto Parts & Garage",
};

async function JoDetailContent({ id }: { id: string }) {
  const [
    jo,
    materials,
    labors,
    payments,
    laborMechanics,
    photos,
    comments,
    parts,
    laborTypes,
    materialStatuses,
    laborStatuses,
    cashiers,
    mechanics,
  ] = await Promise.all([
    getJobOrderById(id),
    getJoMaterials(id),
    getJoLabors(id),
    getJoPayments(id),
    getJoLaborMechanics(id),
    getJoPhotos(id),
    getJoComments(id),
    getPartsForSelector(),
    getLaborTypes(),
    getJoMaterialStatuses(),
    getJoLaborStatuses(),
    getCashiers(),
    getMechanicsForSelector(),
  ]);

  if (!jo) return notFound();

  return (
    <JoDetailClient
      jo={jo}
      materials={materials}
      labors={labors}
      payments={payments}
      laborMechanics={laborMechanics}
      photos={photos}
      comments={comments}
      parts={parts}
      laborTypes={laborTypes}
      materialStatuses={materialStatuses}
      laborStatuses={laborStatuses}
      cashiers={cashiers}
      mechanics={mechanics}
    />
  );
}

export default async function JoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-sm text-muted-foreground">
            Loading job order...
          </div>
        </div>
      }
    >
      <JoDetailContent id={id} />
    </Suspense>
  );
}
