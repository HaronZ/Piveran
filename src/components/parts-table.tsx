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
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PartDialog } from "@/components/part-dialog";
import { PartPhotosDialog } from "@/components/part-photos-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { Images } from "lucide-react";
import { deletePart } from "@/lib/actions/parts";
import type {
  PartRow,
  BrandOption,
  CabinetCodeOption,
} from "@/lib/db/queries/parts";

type SortKey = "name" | "currentStock" | "latestPrice" | "brandName";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

interface PartsTableProps {
  parts: PartRow[];
  brands: BrandOption[];
  cabinetCodes: CabinetCodeOption[];
}

export function PartsTable({ parts, brands, cabinetCodes }: PartsTableProps) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editPart, setEditPart] = useState<PartRow | null>(null);
  const [deletingPart, setDeletingPart] = useState<PartRow | null>(null);
  const [photosPart, setPhotosPart] = useState<PartRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = [...parts];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.partNumber && p.partNumber.toLowerCase().includes(q)) ||
          (p.partCode && p.partCode.toLowerCase().includes(q)) ||
          (p.brandName && p.brandName.toLowerCase().includes(q))
      );
    }

    if (brandFilter !== "All") {
      const selectedBrand = brands.find((b) => b.name === brandFilter);
      if (selectedBrand) {
        rows = rows.filter((p) => p.brandId === selectedBrand.id);
      }
    }

    if (showCriticalOnly) {
      rows = rows.filter(
        (p) => p.includeCritical && p.criticalCount > 0 && p.currentStock <= p.criticalCount
      );
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "brandName":
          cmp = (a.brandName || "").localeCompare(b.brandName || "");
          break;
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
        case "latestPrice":
          cmp = (a.latestPrice ?? 0) - (b.latestPrice ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [parts, search, brandFilter, showCriticalOnly, sortKey, sortDir, brands]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset page when filters change
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleBrand = (val: string | null) => {
    setBrandFilter(val ?? "All");
    setPage(1);
  };

  // Stats
  const lowStockCount = parts.filter(
    (p) => p.includeCritical && p.criticalCount > 0 && p.currentStock <= p.criticalCount
  ).length;




  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Low Stock Alert Banner — Clickable as filter toggle */}
      {lowStockCount > 0 && (
        <button
          type="button"
          onClick={() => { setShowCriticalOnly((v) => !v); setPage(1); }}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 w-full text-left transition-all group ${
            showCriticalOnly
              ? "border-red-500/40 bg-red-500/10 ring-1 ring-red-500/20"
              : "border-red-500/20 bg-red-500/5 hover:border-red-500/30 hover:bg-red-500/8"
          }`}
        >
          {showCriticalOnly ? (
            <Filter className="h-4 w-4 text-red-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <p className="text-sm text-red-400 flex-1">
            <span className="font-semibold">{lowStockCount} part{lowStockCount > 1 ? "s" : ""}</span>{" "}
            at or below critical stock level
            {showCriticalOnly ? (
              <span className="ml-2 text-[10px] font-medium bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">FILTERED</span>
            ) : (
              <span className="ml-2 text-[10px] text-red-400/60 opacity-0 group-hover:opacity-100 transition-opacity">Click to filter</span>
            )}
          </p>
          {showCriticalOnly && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); setShowCriticalOnly(false); setPage(1); }}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/20 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </span>
          )}
        </button>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, part #, brand..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/50"
          />
        </div>
        <Select value={brandFilter} onValueChange={handleBrand}>
          <SelectTrigger className="h-9 w-full sm:w-40 text-sm bg-background/50">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {filtered.length} part{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-9 text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Part
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
                  className="cursor-pointer select-none text-xs w-[280px] min-w-[200px]"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1.5">
                    Name
                    <SortIndicator active={sortKey === "name"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs w-[120px]"
                  onClick={() => toggleSort("brandName")}
                >
                  <div className="flex items-center gap-1.5">
                    Brand
                    <SortIndicator active={sortKey === "brandName"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-[130px]">Part #</TableHead>
                <TableHead className="text-xs w-[90px]">Cabinet</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs w-[90px] text-center"
                  onClick={() => toggleSort("currentStock")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Stock
                    <SortIndicator active={sortKey === "currentStock"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs w-[110px] text-right"
                  onClick={() => toggleSort("latestPrice")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Price
                    <SortIndicator active={sortKey === "latestPrice"} dir={sortDir} variant="amber" />
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
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No parts found</p>
                        <p className="text-xs mt-0.5">
                          {search || brandFilter !== "all"
                            ? "Try adjusting your search or filter"
                            : "Add your first part to get started"}
                        </p>
                      </div>
                      {!search && brandFilter === "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddOpen(true)}
                          className="mt-1 gap-2 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Part
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((part) => {
                  const isLow =
                    part.includeCritical &&
                    part.criticalCount > 0 &&
                    part.currentStock <= part.criticalCount;
                  return (
                    <TableRow
                      key={part.id}
                      className="group border-border/20 transition-colors hover:bg-amber-500/[0.03]"
                    >
                      {/* Name — truncated with tooltip */}
                      <TableCell className="py-3 max-w-[280px]">
                        <Tooltip>
                          <TooltipTrigger
                            render={<div className="truncate cursor-default" />}
                          >
                            <span className="text-sm font-medium">
                              {part.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="start"
                            className="max-w-sm text-xs"
                          >
                            <p className="font-medium">{part.name}</p>
                            {part.partCode && (
                              <p className="text-muted-foreground mt-0.5">
                                Code: {part.partCode}
                              </p>
                            )}
                            {part.description && (
                              <p className="text-muted-foreground mt-0.5">
                                {part.description}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Brand */}
                      <TableCell className="text-sm text-muted-foreground">
                        {part.brandName || (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>

                      {/* Part # */}
                      <TableCell className="max-w-[130px]">
                        {part.partNumber ? (
                          <span className="text-xs font-mono text-muted-foreground truncate block">
                            {part.partNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Cabinet Code */}
                      <TableCell className="text-sm text-muted-foreground">
                        {part.cabinetCode || (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[11px] font-semibold px-2 py-0.5 ${
                            isLow
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : part.currentStock > 0
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {part.currentStock}
                          {isLow && " ⚠"}
                        </Badge>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-sm text-right font-medium tabular-nums">
                        {part.latestPrice !== null ? (
                          formatCurrency(part.latestPrice)
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
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
                              onClick={() => setPhotosPart(part)}
                              className="gap-2 text-sm"
                            >
                              <Images className="h-3.5 w-3.5" />
                              Photos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditPart(part)}
                              className="gap-2 text-sm"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingPart(part)}
                              className="gap-2 text-sm text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
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

      {/* Add Dialog */}
      <PartDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        brands={brands}
        cabinetCodes={cabinetCodes}
      />

      {/* Edit Dialog */}
      <PartDialog
        open={!!editPart}
        onOpenChange={(open) => !open && setEditPart(null)}
        part={editPart}
        brands={brands}
        cabinetCodes={cabinetCodes}
      />

      {/* Photos Dialog */}
      {photosPart && (
        <PartPhotosDialog
          open={!!photosPart}
          onOpenChange={(open) => !open && setPhotosPart(null)}
          partId={photosPart.id}
          partName={photosPart.name}
          partNumber={photosPart.partNumber}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingPart}
        onOpenChange={(open) => !open && setDeletingPart(null)}
        title="Delete Part"
        description={`Are you sure you want to delete "${deletingPart?.name}"? This will also remove all associated photos, prices, and supplier links. This action cannot be undone.`}
        onConfirm={async () => {
          if (deletingPart) {
            await deletePart(deletingPart.id);
          }
        }}
      />
    </div>
    </TooltipProvider>
  );
}
