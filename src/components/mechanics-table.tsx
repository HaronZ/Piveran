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
  Wrench, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { MechanicDialog } from "@/components/mechanic-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteMechanic } from "@/lib/actions/mechanics";
import type { MechanicRow } from "@/lib/db/queries/mechanics";

type SortKey = "name" | "jobsCount" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

interface MechanicsTableProps {
  mechanics: MechanicRow[];
}

export function MechanicsTable({ mechanics }: MechanicsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editMech, setEditMech] = useState<MechanicRow | null>(null);
  const [deletingMech, setDeletingMech] = useState<MechanicRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-purple-500" />
      : <ArrowDown className="h-3 w-3 ml-1 text-purple-500" />;
  }

  const fullName = (m: MechanicRow) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = mechanics;
    if (q) {
      list = list.filter(
        (m) =>
          fullName(m).toLowerCase().includes(q) ||
          (m.nickName && m.nickName.toLowerCase().includes(q)) ||
          (m.primaryContact && m.primaryContact.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = fullName(a).localeCompare(fullName(b));
      else if (sortKey === "jobsCount") cmp = a.jobsCount - b.jobsCount;
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [mechanics, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, nickname, contact..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Wrench className="h-3 w-3" />
            {mechanics.length} total
          </Badge>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Mechanic
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <div className="flex items-center">Name <SortIcon col="name" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Nickname</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("jobsCount")}>
                <div className="flex items-center justify-center">Jobs <SortIcon col="jobsCount" /></div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {search ? "No mechanics match your search" : "No mechanics yet. Add one!"}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((m) => (
                <TableRow key={m.id} className="border-border/40 hover:bg-purple-500/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 text-sm font-bold">
                        {m.firstName.charAt(0)}{m.lastName ? m.lastName.charAt(0) : ""}
                      </div>
                      <p className="font-semibold text-sm">{fullName(m)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {m.nickName || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {m.primaryContact || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {m.jobsCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px]">
                        <Wrench className="h-3 w-3" />{m.jobsCount}
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
                        <DropdownMenuItem onClick={() => setEditMech(m)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingMech(m)} className="text-red-500 focus:text-red-500">
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
      <MechanicDialog open={addOpen} onOpenChange={setAddOpen} />
      {editMech && (
        <MechanicDialog open={!!editMech} onOpenChange={(o) => { if (!o) setEditMech(null); }} mechanic={editMech} />
      )}
      {deletingMech && (
        <DeleteDialog
          open={!!deletingMech}
          onOpenChange={(o) => { if (!o) setDeletingMech(null); }}
          title="Delete Mechanic"
          description={`Are you sure you want to delete "${fullName(deletingMech)}"?`}
          onConfirm={async () => { await deleteMechanic(deletingMech.id); }}
        />
      )}
    </div>
  );
}
