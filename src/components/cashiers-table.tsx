"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { EmptyState } from "@/components/empty-state";
import { useState, useMemo } from "react";
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
  Search, Plus, MoreHorizontal, Pencil, Trash2,
  Banknote, Phone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { CashierDialog } from "@/components/cashier-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteCashier } from "@/lib/actions/cashiers";
import type { CashierRow } from "@/lib/db/queries/cashiers";

type SortKey = "name" | "paymentsCount" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

interface CashiersTableProps {
  cashiers: CashierRow[];
}

export function CashiersTable({ cashiers }: CashiersTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editCashier, setEditCashier] = useState<CashierRow | null>(null);
  const [deletingCashier, setDeletingCashier] = useState<CashierRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  const fullName = (c: CashierRow) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ");

  const totalPayments = useMemo(
    () => cashiers.reduce((sum, c) => sum + c.paymentsCount, 0),
    [cashiers]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = cashiers;
    if (q) {
      list = list.filter(
        (c) =>
          fullName(c).toLowerCase().includes(q) ||
          (c.middleName && c.middleName.toLowerCase().includes(q)) ||
          (c.contactNumber && c.contactNumber.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = fullName(a).localeCompare(fullName(b));
      else if (sortKey === "paymentsCount") cmp = a.paymentsCount - b.paymentsCount;
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [cashiers, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cashiers</p>
                <p className="text-2xl font-bold">{cashiers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Payments Processed</p>
                <p className="text-2xl font-bold">{totalPayments}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md hidden sm:block">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Payments / Cashier</p>
                <p className="text-2xl font-bold">{cashiers.length > 0 ? (totalPayments / cashiers.length).toFixed(1) : "0"}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, contact..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Cashier
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader sticky>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <div className="flex items-center">Name <SortIndicator active={sortKey === "name"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Middle Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("paymentsCount")}>
                <div className="flex items-center justify-center">Payments <SortIndicator active={sortKey === "paymentsCount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={Banknote}
                    title={search ? "No cashiers match your search" : "No cashiers yet"}
                    description={search ? "Try a different keyword." : "Add your first cashier to get started."}
                    iconClassName="bg-emerald-500/10 text-emerald-500"
                    action={
                      !search && (
                        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add cashier
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow key={c.id} className="border-border/40 hover:bg-emerald-500/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold">
                        {c.firstName.charAt(0)}{c.lastName ? c.lastName.charAt(0) : ""}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{fullName(c)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {c.middleName || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {c.contactNumber ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {c.contactNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.paymentsCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                        <Banknote className="h-3 w-3" />{c.paymentsCount}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditCashier(c)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingCashier(c)} className="text-red-500 focus:text-red-500">
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
      <CashierDialog open={addOpen} onOpenChange={setAddOpen} />
      {editCashier && (
        <CashierDialog open={!!editCashier} onOpenChange={(o) => { if (!o) setEditCashier(null); }} cashier={editCashier} />
      )}
      {deletingCashier && (
        <DeleteDialog
          open={!!deletingCashier}
          onOpenChange={(o) => { if (!o) setDeletingCashier(null); }}
          title="Delete Cashier"
          description={`Are you sure you want to delete "${fullName(deletingCashier)}"?`}
          onConfirm={async () => { await deleteCashier(deletingCashier.id); }}
        />
      )}
    </div>
  );
}
