"use client";

import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown,
  ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye,
} from "lucide-react";
import { JobOrderDialog } from "@/components/job-order-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteJobOrder } from "@/lib/actions/job-orders";
import type { JobOrderRow } from "@/lib/db/queries/job-orders";
import type { JoStatusRow } from "@/lib/db/queries/job-orders";
import type { CustomerSelectorRow } from "@/lib/db/queries/customers";
import type { CarRow } from "@/lib/db/queries/cars";

type SortKey = "joNumber" | "customer" | "checkinDate" | "status";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  "Open": "bg-green-500/10 text-green-500 border-green-500/20",
  "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Completed": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Cancelled": "bg-red-500/10 text-red-500 border-red-500/20",
};

interface JobOrdersTableProps {
  jobOrders: JobOrderRow[];
  statuses: JoStatusRow[];
  customers: CustomerSelectorRow[];
  cars: CarRow[];
}

export function JobOrdersTable({ jobOrders, statuses, customers, cars }: JobOrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("joNumber");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editJo, setEditJo] = useState<JobOrderRow | null>(null);
  const [deletingJo, setDeletingJo] = useState<JobOrderRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-orange-500" />
      : <ArrowDown className="h-3 w-3 ml-1 text-orange-500" />;
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = jobOrders;

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((jo) => jo.statusName === statusFilter);
    }

    // Search
    if (q) {
      list = list.filter(
        (jo) =>
          jo.joNumber.toLowerCase().includes(q) ||
          (jo.customerName && jo.customerName.toLowerCase().includes(q)) ||
          (jo.carLabel && jo.carLabel.toLowerCase().includes(q))
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "joNumber") cmp = a.joNumber.localeCompare(b.joNumber);
      else if (sortKey === "customer") cmp = (a.customerName || "").localeCompare(b.customerName || "");
      else if (sortKey === "checkinDate") cmp = (a.checkinDate || "").localeCompare(b.checkinDate || "");
      else if (sortKey === "status") cmp = (a.statusName || "").localeCompare(b.statusName || "");
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [jobOrders, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobOrders.length };
    for (const jo of jobOrders) {
      const s = jo.statusName || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [jobOrders]);

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "ghost"}
          size="sm"
          className={statusFilter === "all" ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20" : ""}
          onClick={() => { setStatusFilter("all"); setPage(1); }}
        >
          All <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{statusCounts.all}</Badge>
        </Button>
        {statuses.map((s) => (
          <Button
            key={s.id}
            variant={statusFilter === s.status ? "default" : "ghost"}
            size="sm"
            className={statusFilter === s.status ? `${STATUS_COLORS[s.status] || ""} hover:opacity-90 border` : ""}
            onClick={() => { setStatusFilter(s.status); setPage(1); }}
          >
            {s.status}
            {statusCounts[s.status] ? (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{statusCounts[s.status]}</Badge>
            ) : null}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search JO #, customer, car..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <ClipboardList className="h-3 w-3" />
            {filtered.length} shown
          </Badge>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Job Order
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("joNumber")}>
                <div className="flex items-center">JO # <SortIcon col="joNumber" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("customer")}>
                <div className="flex items-center">Customer <SortIcon col="customer" /></div>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Car</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                <div className="flex items-center">Status <SortIcon col="status" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("checkinDate")}>
                <div className="flex items-center">Check-in <SortIcon col="checkinDate" /></div>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Check-out</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search || statusFilter !== "all" ? "No job orders match your filters" : "No job orders yet. Create one!"}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((jo) => (
                <TableRow key={jo.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell className="font-mono font-bold text-sm text-orange-500">
                    {jo.joNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {jo.customerName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {jo.carLabel || "—"}
                  </TableCell>
                  <TableCell>
                    {jo.statusName ? (
                      <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[jo.statusName] || "bg-muted text-muted-foreground"}`}>
                        {jo.statusName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(jo.checkinDate)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatDate(jo.checkoutDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditJo(jo)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingJo(jo)} className="text-red-500 focus:text-red-500">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
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
      <JobOrderDialog open={addOpen} onOpenChange={setAddOpen} statuses={statuses} customers={customers} cars={cars} />
      {editJo && (
        <JobOrderDialog
          open={!!editJo}
          onOpenChange={(o) => { if (!o) setEditJo(null); }}
          jobOrder={editJo}
          statuses={statuses}
          customers={customers}
          cars={cars}
        />
      )}
      {deletingJo && (
        <DeleteDialog
          open={!!deletingJo}
          onOpenChange={(o) => { if (!o) setDeletingJo(null); }}
          title="Delete Job Order"
          description={`Are you sure you want to delete JO "${deletingJo.joNumber}"? This will also remove all materials, labors, and payments.`}
          onConfirm={async () => { await deleteJobOrder(deletingJo.id); }}
        />
      )}
    </div>
  );
}
