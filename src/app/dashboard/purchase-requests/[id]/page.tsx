import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getPurchaseRequestById,
  getPrStatuses,
  getPrLineStatuses,
  getPartsForSelector,
  getVendorsForSelector,
} from "@/lib/db/queries/purchase-requests";
import { PrDetailClient } from "@/components/pr-detail-client";

export const metadata = {
  title: "Purchase Request | Sir Keith Auto Parts & Garage",
};

async function PrDetailContent({ id }: { id: string }) {
  const [pr, statuses, lineStatuses, parts, vendors] = await Promise.all([
    getPurchaseRequestById(id),
    getPrStatuses(),
    getPrLineStatuses(),
    getPartsForSelector(),
    getVendorsForSelector(),
  ]);

  if (!pr) return notFound();

  return (
    <PrDetailClient
      pr={pr}
      statuses={statuses}
      lineStatuses={lineStatuses}
      parts={parts}
      vendors={vendors}
    />
  );
}

export default async function PrDetailPage({
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
            Loading purchase request...
          </div>
        </div>
      }
    >
      <PrDetailContent id={id} />
    </Suspense>
  );
}
