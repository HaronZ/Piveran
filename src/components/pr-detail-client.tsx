"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShoppingCart,
  Package,
  DollarSign,
  Loader2,
  TrendingUp,
  ClipboardList,
  Truck,
  ExternalLink,
  FileText,
  Images,
  MessageSquare,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PrLineDialog } from "@/components/pr-line-dialog";
import { PrLineDetailsDialog } from "@/components/pr-line-details-dialog";
import { PrCommentsPanel } from "@/components/pr-comments-panel";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  updatePrStatus,
  deletePrLine,
} from "@/lib/actions/purchase-requests";
import type {
  PurchaseRequestDetail,
  PrLineRow,
  PrStatusOption,
  PrLineStatusOption,
  PartOption,
  VendorOption,
  PrCommentRow,
  PrLinePhotoRow,
  PrLineCommentRow,
} from "@/lib/db/queries/purchase-requests";

// Status badge color mapping
function getStatusColor(status: string | null) {
  switch (status) {
    case "New":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Canvas On-going":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "Purchase On-going":
    case "For Purchase":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Purchase Completed":
    case "Purchased":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Waiting Delivery":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Partial Delivered":
    case "Sourced":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "All Delivered":
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Pending Payment":
    case "Pending":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "Canceled":
    case "Returned":
    case "Not Delivered":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface PrDetailClientProps {
  pr: PurchaseRequestDetail;
  statuses: PrStatusOption[];
  lineStatuses: PrLineStatusOption[];
  parts: PartOption[];
  vendors: VendorOption[];
  prComments: PrCommentRow[];
  linePhotos: PrLinePhotoRow[];
  lineComments: PrLineCommentRow[];
}

export function PrDetailClient({
  pr,
  statuses,
  lineStatuses,
  parts,
  vendors,
  prComments,
  linePhotos,
  lineComments,
}: PrDetailClientProps) {
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [editLine, setEditLine] = useState<PrLineRow | null>(null);
  const [deletingLine, setDeletingLine] = useState<PrLineRow | null>(null);
  const [detailsLine, setDetailsLine] = useState<PrLineRow | null>(null);
  const [isUpdatingStatus, startTransition] = useTransition();

  const photosByLine = useMemo(() => {
    const m = new Map<string, PrLinePhotoRow[]>();
    for (const p of linePhotos) {
      const arr = m.get(p.prLineId) ?? [];
      arr.push(p);
      m.set(p.prLineId, arr);
    }
    return m;
  }, [linePhotos]);

  const commentsByLine = useMemo(() => {
    const m = new Map<string, PrLineCommentRow[]>();
    for (const c of lineComments) {
      const arr = m.get(c.prLineId) ?? [];
      arr.push(c);
      m.set(c.prLineId, arr);
    }
    return m;
  }, [lineComments]);

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    const statusObj = statuses.find((s) => s.status === newStatus);
    if (!statusObj) return;

    startTransition(async () => {
      const result = await updatePrStatus(pr.id, statusObj.id);
      if (result.success) {
        toast.success(`Status updated to "${newStatus}"`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    });
  }

  // Summary calculations
  const totalItems = pr.lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  const totalCost = pr.lines.reduce((sum, l) => sum + (l.totalPrice ?? 0), 0);
  const totalTarget = pr.lines.reduce(
    (sum, l) => sum + (l.totalTargetPrice ?? 0),
    0
  );
  const totalProfit = totalTarget > 0 ? totalTarget - totalCost : 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/purchase-requests">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 text-muted-foreground hover:text-foreground text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to PRs
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight font-mono text-purple-400">
                {pr.prNumber}
              </h1>
              <Badge
                variant="secondary"
                className={`text-[11px] font-medium px-2.5 py-0.5 ${getStatusColor(
                  pr.statusName
                )}`}
              >
                {pr.statusName || "Unknown"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created {formatDate(pr.createdAt)}
              {pr.label && (
                <>
                  {" · "}
                  <span className="text-foreground/70">{pr.label}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status + Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status changer */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
              Change Status
            </p>
            <Select
              value={pr.statusName || ""}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="h-9 text-sm bg-background/50 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.status}>
                    {s.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdatingStatus && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Line Items
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">{pr.lineCount}</p>
            <p className="text-[10px] text-muted-foreground">
              {totalItems} total qty
            </p>
          </div>

          {/* Total Cost */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Total Cost
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(totalCost)}
            </p>
          </div>

          {/* Target Revenue */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-3.5 w-3.5 text-purple-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Target Revenue
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {totalTarget > 0
                ? formatCurrency(totalTarget)
                : "—"}
            </p>
          </div>

          {/* Projected Profit */}
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Est. Profit
              </p>
            </div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                totalProfit > 0
                  ? "text-emerald-500"
                  : totalProfit < 0
                  ? "text-red-500"
                  : ""
              }`}
            >
              {totalTarget > 0
                ? formatCurrency(totalProfit)
                : "—"}
            </p>
          </div>
        </div>

        {/* Notes */}
        {pr.comment && (
          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
              Notes
            </p>
            <p className="text-sm text-muted-foreground">{pr.comment}</p>
          </div>
        )}

        {/* PR Comments */}
        <PrCommentsPanel prId={pr.id} comments={prComments} />

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Line Items</h2>
            <Button
              onClick={() => setAddLineOpen(true)}
              size="sm"
              className="h-8 text-xs gap-1.5 bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-xs w-[200px]">Part</TableHead>
                    <TableHead className="text-xs w-[60px] text-center">
                      Qty
                    </TableHead>
                    <TableHead className="text-xs w-[100px] text-right">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-xs w-[100px] text-right">
                      Total
                    </TableHead>
                    <TableHead className="text-xs w-[140px]">
                      Supplier
                    </TableHead>
                    <TableHead className="text-xs w-[130px]">
                      Status
                    </TableHead>
                    <TableHead className="text-xs w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm">No line items yet</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddLineOpen(true)}
                            className="mt-1 gap-1.5 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            Add Item
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pr.lines.map((line) => (
                      <TableRow
                        key={line.id}
                        className="group border-border/20 hover:bg-purple-500/[0.03]"
                      >
                        {/* Part */}
                        <TableCell className="py-2.5 max-w-[200px]">
                          <div className="min-w-0">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <p className="text-sm font-medium truncate cursor-default" />
                                }
                              >
                                {line.partName || "Unknown Part"}
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                align="start"
                                className="max-w-xs text-xs"
                              >
                                <p className="font-medium">
                                  {line.partName}
                                </p>
                                {line.partNumber && (
                                  <p className="text-muted-foreground">
                                    Part #: {line.partNumber}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                            {line.partNumber && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {line.partNumber}
                              </p>
                            )}
                            {(() => {
                              const ph = photosByLine.get(line.id)?.length ?? 0;
                              const cm = commentsByLine.get(line.id)?.length ?? 0;
                              if (!ph && !cm) return null;
                              return (
                                <div className="flex items-center gap-1 mt-1">
                                  {ph > 0 && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5 bg-violet-500/10 text-violet-400 border-violet-500/20">
                                      <Images className="h-2.5 w-2.5" />
                                      {ph}
                                    </Badge>
                                  )}
                                  {cm > 0 && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5 bg-sky-500/10 text-sky-400 border-sky-500/20">
                                      <MessageSquare className="h-2.5 w-2.5" />
                                      {cm}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>

                        {/* Qty */}
                        <TableCell className="text-center text-sm font-medium tabular-nums">
                          {line.quantity ?? 0}
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell className="text-right text-sm tabular-nums">
                          {line.unitPrice != null
                            ? formatCurrency(line.unitPrice)
                            : "—"}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {line.totalPrice != null
                            ? formatCurrency(line.totalPrice)
                            : "—"}
                        </TableCell>

                        {/* Supplier */}
                        <TableCell className="max-w-[140px]">
                          {line.supplierName ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground truncate">
                                {line.supplierName}
                              </span>
                              {line.link && (
                                <a
                                  href={line.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                >
                                  <ExternalLink className="h-2.5 w-2.5 text-amber-500" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 text-sm">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Line Status */}
                        <TableCell>
                          {line.statusName ? (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-medium px-2 py-0.5 ${getStatusColor(
                                line.statusName
                              )}`}
                            >
                              {line.statusName}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/30 text-sm">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => setDetailsLine(line)}
                                className="gap-2 text-sm"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Photos & Comments
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditLine(line)}
                                className="gap-2 text-sm"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingLine(line)}
                                className="gap-2 text-sm text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Add Line Dialog */}
        <PrLineDialog
          open={addLineOpen}
          onOpenChange={setAddLineOpen}
          prId={pr.id}
          parts={parts}
          vendors={vendors}
          lineStatuses={lineStatuses}
        />

        {/* Edit Line Dialog */}
        <PrLineDialog
          open={!!editLine}
          onOpenChange={(open) => !open && setEditLine(null)}
          prId={pr.id}
          line={editLine}
          parts={parts}
          vendors={vendors}
          lineStatuses={lineStatuses}
        />

        {/* Line Details (Photos + Comments) */}
        {detailsLine && (
          <PrLineDetailsDialog
            open={!!detailsLine}
            onOpenChange={(o) => !o && setDetailsLine(null)}
            prId={pr.id}
            line={detailsLine}
            photos={photosByLine.get(detailsLine.id) ?? []}
            comments={commentsByLine.get(detailsLine.id) ?? []}
          />
        )}

        {/* Delete Line Dialog */}
        <DeleteDialog
          open={!!deletingLine}
          onOpenChange={(open) => !open && setDeletingLine(null)}
          title="Delete Line Item"
          description={`Are you sure you want to delete "${
            deletingLine?.partName || "this item"
          }" from the purchase request?`}
          onConfirm={async () => {
            if (deletingLine) {
              await deletePrLine(deletingLine.id, pr.id);
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
