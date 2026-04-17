"use client";

import { SortIndicator } from "@/components/sort-indicator";
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
  ArrowUpDown, ArrowUp,
  DollarSign, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { CashLogDialog } from "@/components/cash-log-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteCashEntry } from "@/lib/actions/cash-log";
import type { CashLogRow, CashActionRow, ExpenseTypeRow, OpexTypeRow } from "@/lib/db/queries/cash-log";

type SortKey = "date" | "amount" | "action";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 25;

interface CashLogTableProps {
  entries: CashLogRow[];
  actions: CashActionRow[];
  expenseTypes: ExpenseTypeRow[];
  opexTypes: OpexTypeRow[];
}

export function CashLogTable({ entries, actions, expenseTypes, opexTypes }: CashLogTableProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CashLogRow | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CashLogRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  // Totals
  const totals = useMemo(() => {
    let cashIn = 0, cashOut = 0;
    for (const e of entries) {
      const amt = parseFloat(e.amount || "0");
      const action = (e.actionName || "").toLowerCase();
      if (action.includes("in") || action.includes("revenue") || action.includes("income")) {
        cashIn += amt;
      } else {
        cashOut += amt;
      }
    }
    return { cashIn, cashOut, net: cashIn - cashOut };
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = entries;
    if (actionFilter !== "all") list = list.filter((e) => e.actionName === actionFilter);
    if (q) {
      list = list.filter(
        (e) =>
          e.date.includes(q) ||
          e.amount.includes(q) ||
          (e.comment && e.comment.toLowerCase().includes(q)) ||
          (e.actionName && e.actionName.toLowerCase().includes(q)) ||
          (e.expenseTypeName && e.expenseTypeName.toLowerCase().includes(q)) ||
          (e.opexTypeName && e.opexTypeName.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = (a.datetime || "").localeCompare(b.datetime || "");
      else if (sortKey === "amount") cmp = parseFloat(a.amount) - parseFloat(b.amount);
      else if (sortKey === "action") cmp = (a.actionName || "").localeCompare(b.actionName || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [entries, search, actionFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatCurrency(amt: string | number) {
    return `₱${Number(amt).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  function isCashIn(actionName: string) {
    const a = actionName.toLowerCase();
    return a.includes("in") || a.includes("revenue") || a.includes("income");
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{entries.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cash In</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(totals.cashIn)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cash Out</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(totals.cashOut)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-border/40 backdrop-blur-md ${totals.net >= 0 ? "bg-green-500/5" : "bg-red-500/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net Cash</p>
                <p className={`text-xl font-bold ${totals.net >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(totals.net)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${totals.net >= 0 ? "text-green-500/30" : "text-red-500/30"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={actionFilter === "all" ? "default" : "ghost"}
          size="sm"
          className={actionFilter === "all" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20" : ""}
          onClick={() => { setActionFilter("all"); setPage(1); }}
        >
          All
        </Button>
        {actions.map((a) => (
          <Button
            key={a.id}
            variant={actionFilter === a.action ? "default" : "ghost"}
            size="sm"
            className={actionFilter === a.action
              ? isCashIn(a.action) ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              : ""
            }
            onClick={() => { setActionFilter(actionFilter === a.action ? "all" : a.action); setPage(1); }}
          >
            {a.action}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search date, amount, comment..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> New Entry
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader sticky>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <div className="flex items-center">Date <SortIndicator active={sortKey === "date"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("action")}>
                <div className="flex items-center">Action <SortIndicator active={sortKey === "action"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("amount")}>
                <div className="flex items-center justify-end">Amount <SortIndicator active={sortKey === "amount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Comment</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                    <p>{search || actionFilter !== "all" ? "No entries match your filters" : "No cash log entries yet"}</p>
                    {!search && actionFilter === "all" && (
                      <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="mt-1">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add first entry
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((e) => {
                const isIn = isCashIn(e.actionName);
                return (
                  <TableRow key={e.id} className="border-border/40 hover:bg-emerald-500/5 transition-colors">
                    <TableCell className="text-sm font-medium">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] gap-1 ${isIn ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                        {isIn ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {e.actionName}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold text-sm ${isIn ? "text-green-500" : "text-red-500"}`}>
                      {isIn ? "+" : "-"}{formatCurrency(e.amount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {e.expenseTypeName || e.opexTypeName || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {e.comment || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => setEditEntry(e)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingEntry(e)} className="text-red-500 focus:text-red-500">
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
      <CashLogDialog open={addOpen} onOpenChange={setAddOpen} actions={actions} expenseTypes={expenseTypes} opexTypes={opexTypes} />
      {editEntry && (
        <CashLogDialog open={!!editEntry} onOpenChange={(o) => { if (!o) setEditEntry(null); }} entry={editEntry} actions={actions} expenseTypes={expenseTypes} opexTypes={opexTypes} />
      )}
      {deletingEntry && (
        <DeleteDialog
          open={!!deletingEntry}
          onOpenChange={(o) => { if (!o) setDeletingEntry(null); }}
          title="Delete Cash Entry"
          description={`Delete this ${deletingEntry.actionName} entry of ${formatCurrency(deletingEntry.amount)}?`}
          onConfirm={async () => { await deleteCashEntry(deletingEntry.id); }}
        />
      )}
    </div>
  );
}
