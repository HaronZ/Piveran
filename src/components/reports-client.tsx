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
  Search, TrendingUp, Package, ClipboardCheck, ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown, DollarSign, AlertTriangle,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import type {
  InventorySnapshotRow,
  VendorPricingRow,
  StockAuditRow,
  ReportKPIs,
} from "@/lib/db/queries/reports-types";

type Tab = "valuation" | "pricing" | "audits";
const PAGE_SIZE = 20;

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

interface ReportsClientProps {
  kpis: ReportKPIs;
  snapshots: InventorySnapshotRow[];
  pricing: VendorPricingRow[];
  audits: StockAuditRow[];
}

export function ReportsClient({ kpis, snapshots, pricing, audits }: ReportsClientProps) {
  const [tab, setTab] = useState<Tab>("valuation");

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "valuation", label: "Inventory Value", icon: <TrendingUp className="h-4 w-4" />, count: snapshots.length },
    { key: "pricing", label: "Vendor Pricing", icon: <DollarSign className="h-4 w-4" />, count: pricing.length },
    { key: "audits", label: "Stock Audits", icon: <ClipboardCheck className="h-4 w-4" />, count: audits.length },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Parts</p>
                <p className="text-2xl font-bold">{kpis.totalParts}</p>
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
                <p className="text-2xl font-bold">{kpis.latestValuation ? fmt(kpis.latestValuation) : "—"}</p>
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
                <p className="text-2xl font-bold">{kpis.totalVendorLinks}</p>
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
                <p className="text-2xl font-bold">{kpis.totalAudits}</p>
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
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{t.count}</Badge>
          </button>
        ))}
      </div>

      {tab === "valuation" && <ValuationTab snapshots={snapshots} />}
      {tab === "pricing" && <PricingTab pricing={pricing} />}
      {tab === "audits" && <AuditsTab audits={audits} />}
    </div>
  );
}

// ═══════════════════════════════════════
//  VALUATION TAB
// ═══════════════════════════════════════
function ValuationTab({ snapshots }: { snapshots: InventorySnapshotRow[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Quarter</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Inventory Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                  <p>No valuation snapshots recorded yet</p>
                </TableCell>
              </TableRow>
            ) : (
              snapshots.map((s) => (
                <TableRow key={s.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell className="text-sm">{fmtDate(s.date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{s.quarter || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.year || "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm font-semibold text-green-500">{fmt(s.currentValue)}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  VENDOR PRICING TAB
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

  // Group by part for comparison
  const partGroups = useMemo(() => {
    const groups = new Map<string, VendorPricingRow[]>();
    filtered.forEach((p) => {
      const existing = groups.get(p.partId) || [];
      existing.push(p);
      groups.set(p.partId, existing);
    });
    return groups;
  }, [filtered]);

  // Find cheapest vendor per part
  function isCheapest(row: VendorPricingRow): boolean {
    const group = partGroups.get(row.partId);
    if (!group || group.length <= 1) return false;
    const prices = group.filter((g) => g.price).map((g) => parseFloat(g.price!));
    if (prices.length <= 1) return false;
    const minPrice = Math.min(...prices);
    return row.price ? parseFloat(row.price) === minPrice : false;
  }

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search parts or vendors..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
        />
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Part</TableHead>
              <TableHead className="hidden sm:table-cell">Brand</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                  <p>{search ? "No results match your search" : "No vendor pricing data yet"}</p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p) => (
                <TableRow key={p.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm">{p.partName}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {p.brandName || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.vendorName}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isCheapest(p) && (
                        <Badge className="text-[9px] px-1 py-0 bg-green-500/10 text-green-400 border-green-500/20">
                          Best
                        </Badge>
                      )}
                      <span className={`font-mono text-sm font-semibold ${isCheapest(p) ? "text-green-500" : "text-foreground"}`}>
                        {p.price ? fmt(p.price) : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    <span className="line-clamp-1">{p.comment || "—"}</span>
                  </TableCell>
                  <TableCell>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent">
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
    </div>
  );
}

// ═══════════════════════════════════════
//  STOCK AUDITS TAB
// ═══════════════════════════════════════
function AuditsTab({ audits }: { audits: StockAuditRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return audits;
    return audits.filter(
      (a) =>
        a.partName.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [audits, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function statusColor(status: string) {
    const s = status.toLowerCase();
    if (s.includes("match") || s.includes("ok") || s.includes("pass")) return "bg-green-500/10 text-green-400 border-green-500/20";
    if (s.includes("over")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s.includes("short") || s.includes("miss") || s.includes("fail")) return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search audits..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 border-border/40 bg-card/60 backdrop-blur-md"
        />
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Part</TableHead>
              <TableHead className="text-center">Counted</TableHead>
              <TableHead className="text-center">System Stock</TableHead>
              <TableHead className="text-center">Discrepancy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/20 mb-2" />
                  <p>{search ? "No audits match your search" : "No stock audits recorded yet"}</p>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((a) => (
                <TableRow key={a.id} className="border-border/40 hover:bg-orange-500/5 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm">{a.partName}</span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">{a.auditCount}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">
                    {a.currentStock ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {a.discrepancy !== null ? (
                      <span className={`font-mono text-sm font-semibold ${
                        a.discrepancy === 0 ? "text-green-500" :
                        a.discrepancy > 0 ? "text-blue-500" : "text-red-500"
                      }`}>
                        {a.discrepancy > 0 ? `+${a.discrepancy}` : a.discrepancy}
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
    </div>
  );
}
