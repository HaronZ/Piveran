"use client";

import Link from "next/link";
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
  ClipboardCheck, Image as ImageIcon, Video, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink,
} from "lucide-react";
import { ChecklistDialog } from "@/components/checklist-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteChecklist } from "@/lib/actions/checklists";
import type { ChecklistRow } from "@/lib/db/queries/checklists";

type SortKey = "name" | "photosCount" | "videosCount" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

interface ChecklistsTableProps {
  checklists: ChecklistRow[];
}

export function ChecklistsTable({ checklists }: ChecklistsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<ChecklistRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  const totalPhotos = useMemo(
    () => checklists.reduce((s, c) => s + c.photosCount, 0),
    [checklists]
  );
  const totalVideos = useMemo(
    () => checklists.reduce((s, c) => s + c.videosCount, 0),
    [checklists]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = checklists;
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "photosCount") cmp = a.photosCount - b.photosCount;
      else if (sortKey === "videosCount") cmp = a.videosCount - b.videosCount;
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [checklists, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Checklists</p>
                <p className="text-2xl font-bold">{checklists.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Photos</p>
                <p className="text-2xl font-bold">{totalPhotos}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md hidden sm:block">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold">{totalVideos}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-rose-500" />
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
            placeholder="Search checklist or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Checklist
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
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("photosCount")}>
                <div className="flex items-center justify-center">Photos <SortIndicator active={sortKey === "photosCount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("videosCount")}>
                <div className="flex items-center justify-center">Videos <SortIndicator active={sortKey === "videosCount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={ClipboardCheck}
                    title={search ? "No checklists match your search" : "No checklists yet"}
                    description={search ? "Try a different keyword." : "Add your first quality checklist to get started."}
                    iconClassName="bg-cyan-500/10 text-cyan-500"
                    action={
                      !search && (
                        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add checklist
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((c) => (
                <TableRow key={c.id} className="border-border/40 hover:bg-cyan-500/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <Link href={`/dashboard/checklists/${c.id}`} className="font-semibold text-sm hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                        {c.name}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-md truncate">
                    {c.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.photosCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px]">
                        <ImageIcon className="h-3 w-3" />{c.photosCount}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.videosCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
                        <Video className="h-3 w-3" />{c.videosCount}
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
                        <DropdownMenuItem onClick={() => setEditItem(c)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingItem(c)} className="text-red-500 focus:text-red-500">
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

      <ChecklistDialog open={addOpen} onOpenChange={setAddOpen} />
      {editItem && (
        <ChecklistDialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }} checklist={editItem} />
      )}
      {deletingItem && (
        <DeleteDialog
          open={!!deletingItem}
          onOpenChange={(o) => { if (!o) setDeletingItem(null); }}
          title="Delete Checklist"
          description={`Are you sure you want to delete "${deletingItem.name}"? This will also delete all attached photos and videos.`}
          onConfirm={async () => { await deleteChecklist(deletingItem.id); }}
        />
      )}
    </div>
  );
}
