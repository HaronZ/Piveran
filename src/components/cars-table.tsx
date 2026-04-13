"use client";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Car,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { CarDialog } from "@/components/car-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteCar } from "@/lib/actions/cars";
import type { CarRow } from "@/lib/db/queries/cars";
import type { CustomerSelectorRow } from "@/lib/db/queries/customers";

type SortKey = "plate" | "make" | "owner" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

interface CarsTableProps {
  cars: CarRow[];
  customers: CustomerSelectorRow[];
}

export function CarsTable({ cars, customers }: CarsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("plate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editCar, setEditCar] = useState<CarRow | null>(null);
  const [deletingCar, setDeletingCar] = useState<CarRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-teal-500" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-teal-500" />
    );
  }

  const carLabel = (c: CarRow) =>
    [c.make, c.model, c.year].filter(Boolean).join(" ") || "Unknown";

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = cars;
    if (q) {
      list = list.filter(
        (c) =>
          carLabel(c).toLowerCase().includes(q) ||
          (c.plateNumber && c.plateNumber.toLowerCase().includes(q)) ||
          (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
          (c.color && c.color.toLowerCase().includes(q))
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "plate") cmp = (a.plateNumber || "").localeCompare(b.plateNumber || "");
      else if (sortKey === "make") cmp = carLabel(a).localeCompare(carLabel(b));
      else if (sortKey === "owner") cmp = (a.ownerName || "").localeCompare(b.ownerName || "");
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [cars, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plate, make, model, owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Car className="h-3 w-3" />
            {cars.length} total
          </Badge>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Car
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("plate")}
              >
                <div className="flex items-center">
                  Plate # <SortIcon col="plate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("make")}
              >
                <div className="flex items-center">
                  Vehicle <SortIcon col="make" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead className="hidden md:table-cell">Color</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("owner")}
              >
                <div className="flex items-center">
                  Owner <SortIcon col="owner" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {search ? "No cars match your search" : "No cars yet. Add one!"}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow key={c.id} className="border-border/40 hover:bg-teal-500/5 transition-colors">
                  <TableCell className="font-mono font-semibold text-sm">
                    {c.plateNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {c.make || "Unknown"} {c.model || ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {c.year || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full border border-border/40"
                          style={{ backgroundColor: c.color.toLowerCase() }}
                        />
                        <span className="text-sm text-muted-foreground">{c.color}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.ownerName ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
                        {c.ownerName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Unlinked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditCar(c)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCar(c)}
                          className="text-red-500 focus:text-red-500"
                        >
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
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(1)}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CarDialog open={addOpen} onOpenChange={setAddOpen} customers={customers} />
      {editCar && (
        <CarDialog
          open={!!editCar}
          onOpenChange={(o) => { if (!o) setEditCar(null); }}
          car={editCar}
          customers={customers}
        />
      )}
      {deletingCar && (
        <DeleteDialog
          open={!!deletingCar}
          onOpenChange={(o) => { if (!o) setDeletingCar(null); }}
          title="Delete Car"
          description={`Are you sure you want to delete "${carLabel(deletingCar)}" (${deletingCar.plateNumber || "no plate"})?`}
          onConfirm={async () => { await deleteCar(deletingCar.id); }}
        />
      )}
    </div>
  );
}
