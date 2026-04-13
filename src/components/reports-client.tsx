"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search, TrendingUp, TrendingDown, Package, ClipboardCheck, ExternalLink,
  DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpRight, ArrowDownRight, Minus, Info,
} from "lucide-react";
import type {
  InventorySnapshotRow,
  VendorPricingRow,
  StockAuditRow,
  ReportKPIs,
} from "@/lib/db/queries/reports-types";

type Tab = "valuation" | "pricing" | "audits";
const PAGE_SIZE = 25;

function fmt(n: number | string | null | undefined) {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (isNaN(v)) return "—";
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

interface ReportsClientProps {
  kpis: ReportKPIs;
  snapshots: InventorySnapshotRow[];
  pricing: VendorPricingRow[];
  audits: StockAuditRow[];
}

export function ReportsClient({ kpis, snapshots, pricing, audits }: ReportsClientProps) {
  const [tab, setTab] = useState<Tab>("valuation");

  // Compute audit summary stats
  const auditStats = useMemo(() => {
    const matched = audits.filter((a) => a.discrepancy === 0).length;
    const over = audits.filter((a) => a.discrepancy !== null && a.discrepancy > 0).length;
    const short = audits.filter((a) => a.discrepancy !== null && a.discrepancy < 0).length;
    return { matched, over, short };
  }, [audits]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "valuation", label: "Inventory Value", icon: <TrendingUp className="h-4 w-4" />, count: snapshots.length },
    { key: "pricing", label: "Vendor Pricing", icon: <DollarSign className="h-4 w-4" />, count: pricing.length },
    { key: "audits", label: "Stock Audits", icon: <ClipboardCheck className="h-4 w-4" />, count: audits.length },
  ];

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Parts</p>
                  <p className="text-2xl font-bold">{kpis.totalParts.toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-orange-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Latest Valuation</p>
                  <p className="text-xl font-bold">{kpis.latestValuation ? fmt(kpis.latestValuation) : "—"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendor Links</p>
                  <p className="text-2xl font-bold">{kpis.totalVendorLinks.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Audits</p>
                  <p className="text-2xl font-bold">{kpis.totalAudits.toLocaleString()}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border/40 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                {t.count.toLocaleString()}
              </Badge>
            </button>
          ))}
        </div>

        {tab === "valuation" && <ValuationTab snapshots={snapshots} />}
        {tab === "pricing" && <PricingTab pricing={pricing} />}
        {tab === "audits" && <AuditsTab audits={audits} stats={auditStats} />}
      </div>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════
//  PAGINATION COMPONENT
// ═══════════════════════════════════════
function Pagination({ page, totalPages, filtered, pageSize, setPage }: {
  page: number; totalPages: number; filtered: number; pageSize: number; setPage: (n: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>
        Showing <span className="text-foreground font-medium">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered)}</span> of {filtered.toLocaleString()}
      </span>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(1)}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-3 text-foreground font-medium">{page} / {totalPages}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  1. VALUATION TAB — with trend arrows
// ═══════════════════════════════════════
function ValuationTab({ snapshots }: { snapshots: InventorySnapshotRow[] }) {
  return (
    <div className="space-y-4">
      {snapshots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm">No valuation snapshots recorded yet</p>
          <p className="text-xs mt-1">Inventory valuations will appear here once added</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Inventory Value</TableHead>
                <TableHead className="text-right w-[100px]">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((s, i) => {
                const current = s.currentValue ? parseFloat(s.currentValue) : 0;
                const prev = i + 1 < snapshots.length && snapshots[i + 1].currentValue
                  ? parseFloat(snapshots[i + 1].currentValue!)
                  : null;
                const change = prev !== null ? ((current - prev) / prev * 100) : null;

                return (
                  <TableRow key={s.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                    <TableCell className="text-sm font-medium">{fmtDate(s.date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.quarter ? `${s.quarter} ${s.year}` : s.year || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-semibold text-green-500">{fmt(s.currentValue)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {change !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                          change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {change > 0 ? <ArrowUpRight className="h-3 w-3" /> :
                           change < 0 ? <ArrowDownRight className="h-3 w-3" /> :
                           <Minus className="h-3 w-3" />}
                          {Math.abs(change).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  2. VENDOR PRICING — fixed layout
// ═══════════════════════════════════════
function PricingTab({ pricing }: { pricing: VendorPricingRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pricing;
    return pricing.filter(
      (p) =>
        p.partName.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q))
    );
  }, [pricing, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Find cheapest vendor per part
  const cheapestMap = useMemo(() => {
    const groups = new Map<string, number>();
    pricing.forEach((p) => {
      if (!p.price) return;
      const price = parseFloat(p.price);
      const current = groups.get(p.partId);
      if (current === undefined || price < current) groups.set(p.partId, price);
    });
    return groups;
  }, [pricing]);

  function isCheapest(row: VendorPricingRow): boolean {
    if (!row.price) return false;
    const min = cheapestMap.get(row.partId);
    return min !== undefined && parseFloat(row.price) === min;
  }

  return (
    <div className="space-y-4">
      {/* Search + Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by part, vendor, or brand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span><span className="text-green-500 font-medium">Best</span> = cheapest vendor per part</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="w-[35%] min-w-[180px]">Part</TableHead>
              <TableHead className="w-[20%] min-w-[120px]">Vendor</TableHead>
              <TableHead className="text-right w-[15%] min-w-[100px]">Price</TableHead>
              <TableHead className="hidden md:table-cell w-[15%]">Brand</TableHead>
              <TableHead className="hidden lg:table-cell w-[10%]">Notes</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm">{search ? "No results match your search" : "No vendor pricing data yet"}</p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p) => (
                <TableRow key={p.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="font-medium text-sm cursor-default block truncate max-w-[300px] text-left">
                        {truncate(p.partName, 45)}
                      </TooltipTrigger>
                      {p.partName.length > 45 && (
                        <TooltipContent side="top" className="max-w-sm text-xs">
                          {p.partName}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{truncate(p.vendorName, 25)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isCheapest(p) && (
                        <Badge className="text-[9px] px-1 py-0 bg-green-500/10 text-green-400 border-green-500/20 shrink-0">
                          Best
                        </Badge>
                      )}
                      <span className={`font-mono text-sm font-semibold whitespace-nowrap ${isCheapest(p) ? "text-green-500" : ""}`}>
                        {p.price ? fmt(p.price) : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.brandName ? (
                      <Badge variant="secondary" className="text-[10px]">{truncate(p.brandName, 20)}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {p.comment ? (
                      <Tooltip>
                        <TooltipTrigger className="line-clamp-1 cursor-default text-left">
                          {truncate(p.comment, 20)}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm text-xs">{p.comment}</TooltipContent>
                      </Tooltip>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} filtered={filtered.length} pageSize={PAGE_SIZE} setPage={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════
//  3. STOCK AUDITS — with summary stats
// ═══════════════════════════════════════
function AuditsTab({ audits, stats }: { audits: StockAuditRow[]; stats: { matched: number; over: number; short: number } }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "match" | "over" | "short">("all");

  const filteredBySearch = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return audits;
    return audits.filter(
      (a) =>
        a.partName.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [audits, search]);

  const filtered = useMemo(() => {
    if (filter === "all") return filteredBySearch;
    if (filter === "match") return filteredBySearch.filter((a) => a.discrepancy === 0);
    if (filter === "over") return filteredBySearch.filter((a) => a.discrepancy !== null && a.discrepancy > 0);
    return filteredBySearch.filter((a) => a.discrepancy !== null && a.discrepancy < 0);
  }, [filteredBySearch, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function statusColor(status: string) {
    const s = status.toLowerCase();
    if (s.includes("match") || s.includes("ok") || s.includes("pass") || s.includes("good")) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (s.includes("over")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s.includes("short") || s.includes("miss") || s.includes("fail")) return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  const filterButtons: { key: typeof filter; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: audits.length, color: "" },
    { key: "match", label: "Matched", count: stats.matched, color: "text-green-500" },
    { key: "over", label: "Over", count: stats.over, color: "text-blue-500" },
    { key: "short", label: "Short", count: stats.short, color: "text-red-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filter buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audits..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
          />
        </div>
        <div className="flex items-center gap-1">
          {filterButtons.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "secondary" : "ghost"}
              size="sm"
              className={`h-7 text-xs gap-1 ${filter === f.key ? "" : "text-muted-foreground"}`}
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              <span className={f.color}>{f.label}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">{f.count.toLocaleString()}</Badge>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="min-w-[200px]">Part</TableHead>
              <TableHead className="text-center w-[90px]">Counted</TableHead>
              <TableHead className="text-center w-[90px]">System</TableHead>
              <TableHead className="text-center w-[100px]">Diff</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="hidden sm:table-cell w-[110px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm">{search || filter !== "all" ? "No audits match your filters" : "No stock audits recorded yet"}</p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((a) => (
                <TableRow key={a.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="font-medium text-sm cursor-default block truncate max-w-[250px] text-left">
                        {truncate(a.partName, 40)}
                      </TooltipTrigger>
                      {a.partName.length > 40 && (
                        <TooltipContent side="top" className="max-w-sm text-xs">{a.partName}</TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">{a.auditCount}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">
                    {a.currentStock ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {a.discrepancy !== null ? (
                      <span className={`inline-flex items-center justify-center gap-0.5 font-mono text-sm font-semibold ${
                        a.discrepancy === 0 ? "text-green-500" :
                        a.discrepancy > 0 ? "text-blue-500" : "text-red-500"
                      }`}>
                        {a.discrepancy === 0 ? "0" : a.discrepancy > 0 ? `+${a.discrepancy}` : a.discrepancy}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${statusColor(a.status)}`}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {fmtDate(a.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} filtered={filtered.length} pageSize={PAGE_SIZE} setPage={setPage} />
    </div>
  );
}
