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
  Sparkles, Users as UsersIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { SkillDialog } from "@/components/skill-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { deleteSkill } from "@/lib/actions/skills";
import type { SkillRow } from "@/lib/db/queries/skills";

type SortKey = "skill" | "mechanicsCount" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 20;

interface SkillsTableProps {
  skills: SkillRow[];
}

export function SkillsTable({ skills }: SkillsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("skill");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillRow | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<SkillRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  const totalAssignments = useMemo(
    () => skills.reduce((sum, s) => sum + s.mechanicsCount, 0),
    [skills]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = skills;
    if (q) {
      list = list.filter(
        (s) =>
          s.skill.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "skill") cmp = a.skill.localeCompare(b.skill);
      else if (sortKey === "mechanicsCount") cmp = a.mechanicsCount - b.mechanicsCount;
      else if (sortKey === "createdAt") cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [skills, search, sortKey, sortDir]);

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
                <p className="text-xs text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold">{skills.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mechanic Assignments</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md hidden sm:block">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Mechanics / Skill</p>
                <p className="text-2xl font-bold">{skills.length > 0 ? (totalAssignments / skills.length).toFixed(1) : "0"}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-yellow-500" />
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
            placeholder="Search skill or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Skill
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader sticky>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("skill")}>
                <div className="flex items-center">Skill <SortIndicator active={sortKey === "skill"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("mechanicsCount")}>
                <div className="flex items-center justify-center">Mechanics <SortIndicator active={sortKey === "mechanicsCount"} dir={sortDir} variant="teal" /></div>
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={Sparkles}
                    title={search ? "No skills match your search" : "No skills yet"}
                    description={search ? "Try a different keyword." : "Add your first skill to get started."}
                    iconClassName="bg-amber-500/10 text-amber-500"
                    action={
                      !search && (
                        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add skill
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((s) => (
                <TableRow key={s.id} className="border-border/40 hover:bg-amber-500/5 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="font-semibold text-sm">{s.skill}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-md truncate">
                    {s.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.mechanicsCount > 0 ? (
                      <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                        <UsersIcon className="h-3 w-3" />{s.mechanicsCount}
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
                        <DropdownMenuItem onClick={() => setEditSkill(s)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingSkill(s)} className="text-red-500 focus:text-red-500">
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
      <SkillDialog open={addOpen} onOpenChange={setAddOpen} />
      {editSkill && (
        <SkillDialog open={!!editSkill} onOpenChange={(o) => { if (!o) setEditSkill(null); }} skillItem={editSkill} />
      )}
      {deletingSkill && (
        <DeleteDialog
          open={!!deletingSkill}
          onOpenChange={(o) => { if (!o) setDeletingSkill(null); }}
          title="Delete Skill"
          description={`Are you sure you want to delete "${deletingSkill.skill}"? This will remove it from all mechanics.`}
          onConfirm={async () => { await deleteSkill(deletingSkill.id); }}
        />
      )}
    </div>
  );
}
