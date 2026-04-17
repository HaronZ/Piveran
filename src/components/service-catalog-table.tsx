"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { useState, useMemo, useActionState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2, Wrench,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, DollarSign,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ListChecks, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import { createLaborType, updateLaborType, deleteLaborType } from "@/lib/actions/service-catalog";
import type { LaborTypeFullRow } from "@/lib/db/queries/service-catalog";

type SortKey = "name" | "defaultPrice" | "usageCount";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

interface ServiceCatalogTableProps {
  laborTypes: LaborTypeFullRow[];
}

function fmt(n: number | string | null | undefined) {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (isNaN(v)) return "—";
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export function ServiceCatalogTable({ laborTypes }: ServiceCatalogTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<LaborTypeFullRow | null>(null);
  const [delItem, setDelItem] = useState<LaborTypeFullRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  // KPIs
  const totalServices = laborTypes.length;
  const totalUsage = laborTypes.reduce((s, l) => s + l.usageCount, 0);
  const avgPrice = totalServices > 0
    ? laborTypes.reduce((s, l) => s + parseFloat(l.defaultPrice || "0"), 0) / totalServices
    : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = laborTypes;
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "defaultPrice") cmp = parseFloat(a.defaultPrice || "0") - parseFloat(b.defaultPrice || "0");
      else if (sortKey === "usageCount") cmp = a.usageCount - b.usageCount;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [laborTypes, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{totalServices}</p>
              </div>
              <ListChecks className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">{fmt(avgPrice)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total JO Usage</p>
                <p className="text-2xl font-bold">{totalUsage}</p>
              </div>
              <Hash className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Service
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader sticky>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <div className="flex items-center">Service Name <SortIndicator active={sortKey === "name"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Description</TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("defaultPrice")}>
                <div className="flex items-center justify-end">Default Price <SortIndicator active={sortKey === "defaultPrice"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("usageCount")}>
                <div className="flex items-center justify-center">JO Usage <SortIndicator active={sortKey === "usageCount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-10 w-10 text-muted-foreground/30" />
                    <p>{search ? "No services match your search" : "No services yet"}</p>
                    {!search && (
                      <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create your first service
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((lt) => (
                <TableRow key={lt.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                        <Wrench className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="font-medium text-sm">{lt.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    <span className="line-clamp-1">{lt.description || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {lt.defaultPrice ? (
                      <span className="font-mono text-sm font-semibold text-green-500">{fmt(lt.defaultPrice)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No price set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {lt.usageCount} {lt.usageCount === 1 ? "JO" : "JOs"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditItem(lt)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDelItem(lt)}
                          className="text-red-500 focus:text-red-500"
                          disabled={lt.usageCount > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {lt.usageCount > 0 ? "In use" : "Delete"}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ServiceDialog open={addOpen} onOpenChange={setAddOpen} />
      {editItem && (
        <ServiceDialog
          open={!!editItem}
          onOpenChange={(o) => { if (!o) setEditItem(null); }}
          item={editItem}
        />
      )}
      {delItem && (
        <DeleteDialog
          open={!!delItem}
          onOpenChange={(o) => { if (!o) setDelItem(null); }}
          title="Delete Service"
          description={`Are you sure you want to delete "${delItem.name}"? This cannot be undone.`}
          onConfirm={async () => { await deleteLaborType(delItem.id); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  SERVICE DIALOG (Add / Edit)
// ═══════════════════════════════════════
function ServiceDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item?: LaborTypeFullRow;
}) {
  const isEdit = !!item;

  const boundAction = item
    ? updateLaborType.bind(null, item.id)
    : createLaborType;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Service updated" : "Service created");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={`svc-${item?.id || "new"}`}
        className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl"
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-400" />
            {isEdit ? "Edit Service" : "New Service"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="svc-name" className="text-xs">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="svc-name"
              name="name"
              defaultValue={item?.name || ""}
              required
              className="border-border/40 bg-card/60"
              placeholder="e.g. Oil Change, Brake Service..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-price" className="text-xs">Default Price (₱)</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-mono">₱</span>
              <Input
                id="svc-price"
                name="defaultPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.defaultPrice || ""}
                className="border-border/40 bg-card/60 font-mono pl-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
            {isEdit && (
              <p className="text-[10px] text-muted-foreground">
                💡 Changing the price will create a new price history entry
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc" className="text-xs">Description</Label>
            <Textarea
              id="svc-desc"
              name="description"
              defaultValue={item?.description || ""}
              className="border-border/40 bg-card/60 min-h-[60px]"
              placeholder="What does this service include?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
