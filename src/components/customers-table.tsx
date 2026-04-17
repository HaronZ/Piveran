"use client";

import { SortIndicator } from "@/components/sort-indicator";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Users,
  Car,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from "lucide-react";
import { CustomerDialog } from "@/components/customer-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteCustomer } from "@/lib/actions/customers";
import type { CustomerRow } from "@/lib/db/queries/customers";

type SortKey = "name" | "carsCount" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

interface CustomersTableProps {
  customers: CustomerRow[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const fullName = (c: CustomerRow) =>
    [c.firstName, c.middleName, c.lastName, c.suffix].filter(Boolean).join(" ");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = customers;
    if (q) {
      list = list.filter(
        (c) =>
          fullName(c).toLowerCase().includes(q) ||
          (c.nickName && c.nickName.toLowerCase().includes(q)) ||
          (c.primaryContact && c.primaryContact.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = fullName(a).localeCompare(fullName(b));
      else if (sortKey === "carsCount") cmp = a.carsCount - b.carsCount;
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [customers, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, nickname, contact, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Users className="h-3 w-3" />
            {customers.length} total
          </Badge>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
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
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center">
                  Name <SortIndicator active={sortKey === "name"} dir={sortDir} variant="teal" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Nickname</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden xl:table-cell">Address</TableHead>
              <TableHead
                className="cursor-pointer select-none text-center"
                onClick={() => toggleSort("carsCount")}
              >
                <div className="flex items-center justify-center">
                  Cars <SortIndicator active={sortKey === "carsCount"} dir={sortDir} variant="teal" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search ? "No customers match your search" : "No customers yet. Add one!"}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-border/40 cursor-pointer hover:bg-blue-500/5 transition-colors"
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold">
                        {c.firstName.charAt(0)}
                        {c.lastName ? c.lastName.charAt(0) : ""}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{fullName(c)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {c.nickName || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {c.primaryContact || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {c.email || "—"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                    {c.address || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.carsCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-teal-500/10 text-teal-500 border-teal-500/20 text-[10px]">
                        <Car className="h-3 w-3" />
                        {c.carsCount}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${c.id}`); }}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditCustomer(c); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeletingCustomer(c); }}
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
      <CustomerDialog open={addOpen} onOpenChange={setAddOpen} />
      {editCustomer && (
        <CustomerDialog
          open={!!editCustomer}
          onOpenChange={(o) => { if (!o) setEditCustomer(null); }}
          customer={editCustomer}
        />
      )}
      {deletingCustomer && (
        <DeleteDialog
          open={!!deletingCustomer}
          onOpenChange={(o) => { if (!o) setDeletingCustomer(null); }}
          title="Delete Customer"
          description={`Are you sure you want to delete "${fullName(deletingCustomer)}"? This will also remove their addresses, contacts, and unlink their cars.`}
          onConfirm={async () => { await deleteCustomer(deletingCustomer.id); }}
        />
      )}
    </div>
  );
}
