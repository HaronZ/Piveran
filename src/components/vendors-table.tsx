"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { EmptyState } from "@/components/empty-state";
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
  Truck,
  ExternalLink,
  Phone,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { VendorDialog } from "@/components/vendor-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteVendor } from "@/lib/actions/vendors";
import type { VendorRow } from "@/lib/db/queries/vendors";

type SortKey = "name" | "partsSuppliedCount" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

interface VendorsTableProps {
  vendors: VendorRow[];
}

export function VendorsTable({ vendors }: VendorsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorRow | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<VendorRow | null>(null);

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

  const filtered = useMemo(() => {
    let rows = [...vendors];

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.address && v.address.toLowerCase().includes(q)) ||
          (v.contactNumber && v.contactNumber.toLowerCase().includes(q))
      );
    }

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "partsSuppliedCount":
          cmp = a.partsSuppliedCount - b.partsSuppliedCount;
          break;
        case "createdAt":
          cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [vendors, search, sortKey, sortDir]);

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
            placeholder="Search name, address, phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/50"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-9 text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader sticky>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead
                  className="cursor-pointer select-none text-xs w-[220px] min-w-[180px]"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1.5">
                    Vendor
                    <SortIndicator active={sortKey === "name"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-[200px]">Address</TableHead>
                <TableHead className="text-xs w-[140px]">Contact</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs w-[80px] text-center"
                  onClick={() => toggleSort("partsSuppliedCount")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Parts
                    <SortIndicator active={sortKey === "partsSuppliedCount"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-xs w-[100px]"
                  onClick={() => toggleSort("createdAt")}
                >
                  <div className="flex items-center gap-1.5">
                    Added
                    <SortIndicator active={sortKey === "createdAt"} dir={sortDir} variant="amber" />
                  </div>
                </TableHead>
                <TableHead className="text-xs w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={Truck}
                      title="No vendors found"
                      description={
                        search ? "Try adjusting your search." : "Add your first vendor to get started."
                      }
                      action={
                        !search && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddOpen(true)}
                            className="gap-2 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Vendor
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="group border-border/20 transition-colors hover:bg-amber-500/[0.03]"
                  >
                    {/* Vendor Name + Website */}
                    <TableCell className="py-3 max-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <Truck className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger
                              render={<p className="text-sm font-medium truncate cursor-default" />}
                            >
                              {vendor.name}
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-xs text-xs">
                              <p className="font-medium">{vendor.name}</p>
                              {vendor.comments && (
                                <p className="text-muted-foreground mt-0.5">{vendor.comments}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          {vendor.link && (
                            <a
                              href={vendor.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-amber-500 hover:underline mt-0.5"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Address */}
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {vendor.address ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="block truncate cursor-default" />}
                          >
                            {vendor.address}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-xs">
                            {vendor.address}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>

                    {/* Contact */}
                    <TableCell className="text-sm">
                      {vendor.contactNumber ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="text-xs">{vendor.contactNumber}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 text-sm">—</span>
                      )}
                      {vendor.contactCount > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="h-2.5 w-2.5 text-muted-foreground/50" />
                          <p className="text-[10px] text-muted-foreground/60">
                            +{vendor.contactCount} contact
                            {vendor.contactCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </TableCell>

                    {/* Parts Supplied */}
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-500 border-blue-500/20"
                      >
                        <Package className="h-2.5 w-2.5 mr-1" />
                        {vendor.partsSuppliedCount}
                      </Badge>
                    </TableCell>

                    {/* Date Added */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(vendor.createdAt)}
                    </TableCell>

                    {/* Actions — always visible */}
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
                            onClick={() => setEditVendor(vendor)}
                            className="gap-2 text-sm"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingVendor(vendor)}
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

      {/* Add Dialog */}
      <VendorDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Dialog — conditionally mounted so defaultValue inputs always see a real record */}
      {editVendor && (
        <VendorDialog
          open={true}
          onOpenChange={(open) => !open && setEditVendor(null)}
          vendor={editVendor}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingVendor}
        onOpenChange={(open) => !open && setDeletingVendor(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deletingVendor?.name}"? This will also remove all associated contacts. This action cannot be undone.`}
        onConfirm={async () => {
          if (deletingVendor) {
            await deleteVendor(deletingVendor.id);
          }
        }}
      />
    </div>
    </TooltipProvider>
  );
}
