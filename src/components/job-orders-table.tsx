"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2, Eye,
  ArrowUpDown, ArrowUp,
  ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, CheckCircle2, XCircle, Loader,
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

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  "Open": { color: "text-green-500", icon: <Clock className="h-3 w-3" />, bg: "bg-green-500/10 text-green-500 border-green-500/20" },
  "In Progress": { color: "text-amber-500", icon: <Loader className="h-3 w-3" />, bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "Completed": { color: "text-blue-500", icon: <CheckCircle2 className="h-3 w-3" />, bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "Cancelled": { color: "text-red-500", icon: <XCircle className="h-3 w-3" />, bg: "bg-red-500/10 text-red-500 border-red-500/20" },
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

  // Status summary cards
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const jo of jobOrders) {
      const s = jo.statusName || "Unknown";
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [jobOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = jobOrders;
    if (statusFilter !== "all") list = list.filter((jo) => jo.statusName === statusFilter);
    if (q) {
      list = list.filter(
        (jo) =>
          jo.joNumber.toLowerCase().includes(q) ||
          (jo.customerName && jo.customerName.toLowerCase().includes(q)) ||
          (jo.carLabel && jo.carLabel.toLowerCase().includes(q))
      );
    }
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

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          className={`border-border/40 backdrop-blur-md cursor-pointer transition-all ${statusFilter === "all" ? "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20" : "bg-card/60 hover:bg-card/80"}`}
          onClick={() => { setStatusFilter("all"); setPage(1); }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{jobOrders.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>
        {statuses.map((s) => {
          const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["Open"];
          const count = statusCounts[s.status] || 0;
          const isActive = statusFilter === s.status;
          return (
            <Card
              key={s.id}
              className={`border-border/40 backdrop-blur-md cursor-pointer transition-all ${isActive ? `${cfg.bg} border-current/30 ring-1 ring-current/20` : "bg-card/60 hover:bg-card/80"}`}
              onClick={() => { setStatusFilter(isActive ? "all" : s.status); setPage(1); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.status}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    {cfg.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Job Order
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader sticky>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("joNumber")}>
                <div className="flex items-center">JO # <SortIndicator active={sortKey === "joNumber"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("customer")}>
                <div className="flex items-center">Customer <SortIndicator active={sortKey === "customer"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Car</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                <div className="flex items-center">Status <SortIndicator active={sortKey === "status"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("checkinDate")}>
                <div className="flex items-center">Check-in <SortIndicator active={sortKey === "checkinDate"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Check-out</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                    <p>{search || statusFilter !== "all" ? "No job orders match your filters" : "No job orders yet"}</p>
                    {!search && statusFilter === "all" && (
                      <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create your first job order
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((jo) => {
                const cfg = STATUS_CONFIG[jo.statusName || ""] || { bg: "bg-muted text-muted-foreground", icon: null };
                return (
                  <TableRow key={jo.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                    <TableCell className="font-mono font-bold text-sm">
                      <Link href={`/dashboard/job-orders/${jo.id}`} className="text-orange-500 hover:text-orange-400 hover:underline transition-colors">
                        {jo.joNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {jo.customerName || <span className="text-muted-foreground">Walk-in</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {jo.carLabel || "—"}
                    </TableCell>
                    <TableCell>
                      {jo.statusName ? (
                        <Badge variant="secondary" className={`text-[10px] gap-1 ${cfg.bg}`}>
                          {cfg.icon}
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
                          <DropdownMenuItem onClick={() => { window.location.href = `/dashboard/job-orders/${jo.id}`; }}>
                            <Eye className="h-4 w-4 mr-2" /> View
                          </DropdownMenuItem>
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
                );
              })
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
        <JobOrderDialog open={!!editJo} onOpenChange={(o) => { if (!o) setEditJo(null); }} jobOrder={editJo} statuses={statuses} customers={customers} cars={cars} />
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
