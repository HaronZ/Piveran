"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { useState, useMemo } from "react";
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
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { StockLogDialog } from "@/components/stock-log-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteStockLog } from "@/lib/actions/stock-log";
import type {
  StockLogRow,
  ActionOption,
  UnitOption,
  SalesTypeOption,
  PaymentTypeOption,
} from "@/lib/db/queries/stock-log";
import type { PartOption, VendorOption } from "@/lib/db/queries/purchase-requests";

type SortKey = "date" | "partName" | "actionName" | "quantity" | "totalPrice";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

function getActionColor(actionName: string) {
  switch (actionName) {
    case "Add stock":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Manual Add":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Sale":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Damage":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "Lost":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface StockLogTableProps {
  logs: StockLogRow[];
  parts: PartOption[];
  vendors: VendorOption[];
  actions: ActionOption[];
  units: UnitOption[];
  salesTypes: SalesTypeOption[];
  paymentTypes: PaymentTypeOption[];
}

export function StockLogTable({
  logs,
  parts,
  vendors,
  actions,
  units,
  salesTypes,
  paymentTypes,
}: StockLogTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<StockLogRow | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<StockLogRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = [...logs];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.partName.toLowerCase().includes(q) ||
          (r.partNumber && r.partNumber.toLowerCase().includes(q)) ||
          (r.vendorName && r.vendorName.toLowerCase().includes(q))
      );
    }

    if (actionFilter !== "All") {
      rows = rows.filter((r) => r.actionName === actionFilter);
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "partName":
          cmp = a.partName.localeCompare(b.partName);
          break;
        case "actionName":
          cmp = a.actionName.localeCompare(b.actionName);
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        case "totalPrice":
          cmp = (a.totalPrice ?? 0) - (b.totalPrice ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [logs, search, actionFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search part, vendor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-sm bg-background/50"
            />
          </div>
          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v ?? "All");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-44 text-sm bg-background/50">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a.id} value={a.name}>
                  {a.addMinus === 1 ? "↑" : "↓"} {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
            </p>
            <Button
              onClick={() => setAddOpen(true)}
              className="h-9 text-sm gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="h-4 w-4" />
              Record Entry
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
                    className="cursor-pointer select-none text-xs w-[100px]"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      Date <SortIndicator active={sortKey === "date"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[180px]"
                    onClick={() => toggleSort("partName")}
                  >
                    <div className="flex items-center gap-1.5">
                      Part <SortIndicator active={sortKey === "partName"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[130px]"
                    onClick={() => toggleSort("actionName")}
                  >
                    <div className="flex items-center gap-1.5">
                      Action <SortIndicator active={sortKey === "actionName"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[70px] text-center"
                    onClick={() => toggleSort("quantity")}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Qty <SortIndicator active={sortKey === "quantity"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs w-[90px] text-right">
                    Unit Price
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs w-[100px] text-right"
                    onClick={() => toggleSort("totalPrice")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total <SortIndicator active={sortKey === "totalPrice"} dir={sortDir} variant="amber" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs w-[120px]">Vendor</TableHead>
                  <TableHead className="text-xs w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30">
                          <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            No stock log entries found
                          </p>
                          <p className="text-xs mt-0.5">
                            {search || actionFilter !== "All"
                              ? "Try adjusting your filters"
                              : "Record your first stock movement to get started"}
                          </p>
                        </div>
                        {!search && actionFilter === "All" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddOpen(true)}
                            className="mt-1 gap-2 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Record Entry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group border-border/20 hover:bg-emerald-500/[0.03]"
                    >
                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(row.date)}
                      </TableCell>

                      {/* Part */}
                      <TableCell className="max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="text-sm font-medium truncate block cursor-default" />
                            }
                          >
                            {row.partName}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs max-w-xs">
                            <p className="font-medium">{row.partName}</p>
                            {row.partNumber && (
                              <p className="text-muted-foreground">
                                Part #: {row.partNumber}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Action Badge */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-medium px-2 py-0.5 gap-1 ${getActionColor(
                            row.actionName
                          )}`}
                        >
                          {row.addMinus === 1 ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5" />
                          )}
                          {row.actionName}
                        </Badge>
                      </TableCell>

                      {/* Qty */}
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            row.addMinus === 1
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {row.addMinus === 1 ? "+" : "−"}
                          {row.quantity}
                        </span>
                      </TableCell>

                      {/* Unit Price */}
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {row.unitPrice != null
                          ? formatCurrency(row.unitPrice)
                          : "—"}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {row.totalPrice != null
                          ? formatCurrency(row.totalPrice)
                          : "—"}
                      </TableCell>

                      {/* Vendor */}
                      <TableCell className="max-w-[120px]">
                        {row.vendorName ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="text-xs text-muted-foreground truncate block cursor-default" />
                              }
                            >
                              {row.vendorName}
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {row.vendorName}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">
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
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => setEditEntry(row)}
                              className="gap-2 text-sm"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingEntry(row)}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        <StockLogDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          parts={parts}
          vendors={vendors}
          actions={actions}
          units={units}
          salesTypes={salesTypes}
          paymentTypes={paymentTypes}
        />

        {/* Edit Dialog */}
        <StockLogDialog
          open={!!editEntry}
          onOpenChange={(open) => !open && setEditEntry(null)}
          entry={editEntry}
          parts={parts}
          vendors={vendors}
          actions={actions}
          units={units}
          salesTypes={salesTypes}
          paymentTypes={paymentTypes}
        />

        {/* Delete Dialog */}
        <DeleteDialog
          open={!!deletingEntry}
          onOpenChange={(open) => !open && setDeletingEntry(null)}
          title="Delete Stock Entry"
          description={`Are you sure you want to delete this "${deletingEntry?.actionName}" entry for "${deletingEntry?.partName}"? This will affect the part's stock count. This action cannot be undone.`}
          onConfirm={async () => {
            if (deletingEntry) {
              await deleteStockLog(deletingEntry.id);
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}
