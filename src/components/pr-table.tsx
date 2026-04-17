"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PrDialog } from "@/components/pr-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deletePurchaseRequest } from "@/lib/actions/purchase-requests";
import type { PurchaseRequestRow, PrStatusOption } from "@/lib/db/queries/purchase-requests";

type SortKey = "prNumber" | "date" | "statusName" | "lineCount" | "totalAmount";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

// Status badge color mapping
function getStatusColor(status: string | null) {
  switch (status) {
    case "New":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Canvas On-going":
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    case "Purchase On-going":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Purchase Completed":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "Waiting Delivery":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Partial Delivered":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "All Delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Pending Payment":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "Canceled":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface PrTableProps {
  purchaseRequests: PurchaseRequestRow[];
  statuses: PrStatusOption[];
  nextPrNumber: string;
}

export function PrTable({
  purchaseRequests,
  statuses,
  nextPrNumber,
}: PrTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editPr, setEditPr] = useState<PurchaseRequestRow | null>(null);
  const [deletingPr, setDeletingPr] = useState<PurchaseRequestRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleStatus = (val: string | null) => {
    setStatusFilter(val ?? "All");
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = [...purchaseRequests];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (pr) =>
          pr.prNumber.toLowerCase().includes(q) ||
          (pr.label && pr.label.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "All") {
      rows = rows.filter((pr) => pr.statusName === statusFilter);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "prNumber":
          cmp = a.prNumber.localeCompare(b.prNumber);
          break;
        case "date":
          cmp = (a.date || "").localeCompare(b.date || "");
          break;
        case "statusName":
          cmp = (a.statusName || "").localeCompare(b.statusName || "");
          break;
        case "lineCount":
          cmp = a.lineCount - b.lineCount;
          break;
        case "totalAmount":
          cmp = a.totalAmount - b.totalAmount;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [purchaseRequests, search, statusFilter, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PR#, label..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-background/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatus}>
            <SelectTrigger className="h-9 w-full sm:w-48 text-sm bg-background/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.status}>
                  {s.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {filtered.length} PR{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={() => setAddOpen(true)}
              className="h-9 text-sm gap-2 bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-4 w-4" />
              New PR
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[140px]"
                    onClick={() => toggleSort("prNumber")}
                  >
                    <div className="flex items-center gap-1.5">
                      PR#
                      <SortIndicator active={sortKey === "prNumber"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[100px]"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      Date
                      <SortIndicator active={sortKey === "date"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs w-[180px]">Label</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[160px]"
                    onClick={() => toggleSort("statusName")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <SortIndicator active={sortKey === "statusName"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[80px] text-center"
                    onClick={() => toggleSort("lineCount")}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Items
                      <SortIndicator active={sortKey === "lineCount"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[120px] text-right"
                    onClick={() => toggleSort("totalAmount")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total
                      <SortIndicator active={sortKey === "totalAmount"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30">
                          <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            No purchase requests found
                          </p>
                          <p className="text-xs mt-0.5">
                            {search || statusFilter !== "All"
                              ? "Try adjusting your filters"
                              : "Create your first purchase request to get started"}
                          </p>
                        </div>
                        {!search && statusFilter === "All" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddOpen(true)}
                            className="mt-1 gap-2 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            New PR
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((pr) => (
                    <TableRow
                      key={pr.id}
                      className="group border-border/20 transition-colors hover:bg-purple-500/[0.03] cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/purchase-requests/${pr.id}`)
                      }
                    >
                      {/* PR Number */}
                      <TableCell className="py-3">
                        <span className="text-sm font-mono font-medium text-purple-400">
                          {pr.prNumber}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(pr.date)}
                      </TableCell>

                      {/* Label */}
                      <TableCell className="max-w-[180px]">
                        {pr.label ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="text-sm text-muted-foreground truncate block cursor-default" />
                              }
                            >
                              {pr.label}
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-xs text-xs"
                            >
                              {pr.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-medium px-2 py-0.5 ${getStatusColor(
                            pr.statusName
                          )}`}
                        >
                          {pr.statusName || "Unknown"}
                        </Badge>
                      </TableCell>

                      {/* Items Count */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold px-2 py-0.5 bg-muted/50 text-muted-foreground"
                        >
                          <Package className="h-2.5 w-2.5 mr-1" />
                          {pr.lineCount}
                        </Badge>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {pr.totalAmount > 0
                          ? formatCurrency(pr.totalAmount)
                          : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>

                      {/* Actions */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/purchase-requests/${pr.id}`
                                )
                              }
                              className="gap-2 text-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditPr(pr)}
                              className="gap-2 text-sm"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingPr(pr)}
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

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {filtered.length}
                </span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground px-2 tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <PrDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          statuses={statuses}
          nextPrNumber={nextPrNumber}
        />

        {/* Edit Dialog */}
        <PrDialog
          open={!!editPr}
          onOpenChange={(open) => !open && setEditPr(null)}
          pr={editPr}
          statuses={statuses}
          nextPrNumber={nextPrNumber}
        />

        {/* Delete Dialog */}
        <DeleteDialog
          open={!!deletingPr}
          onOpenChange={(open) => !open && setDeletingPr(null)}
          title="Delete Purchase Request"
          description={`Are you sure you want to delete "${deletingPr?.prNumber}"? This will also remove all line items. This action cannot be undone.`}
          onConfirm={async () => {
            if (deletingPr) {
              await deletePurchaseRequest(deletingPr.id);
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
