"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Percent,
  ArrowUpRight, ArrowDownRight, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell,
} from "recharts";
import type { IncomeSummaryRow } from "@/lib/db/queries/cash-log";

// ─── Helpers ───
function parseYearMonth(ym: string): { year: string; month: number } {
  if (ym.includes("-")) {
    const [y, m] = ym.split("-");
    return { year: y, month: parseInt(m) };
  }
  return { year: ym.slice(0, 4), month: parseInt(ym.slice(4)) };
}

function monthLabel(ym: string): string {
  const { year, month } = parseYearMonth(ym);
  if (isNaN(month) || month < 1 || month > 12) return ym;
  const d = new Date(parseInt(year), month - 1, 1);
  return d.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function shortMonth(ym: string): string {
  const { month } = parseYearMonth(ym);
  if (isNaN(month) || month < 1 || month > 12) return ym;
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
}

function formatCurrency(amt: number) {
  return `₱${Math.abs(amt).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatCompact(amt: number) {
  const abs = Math.abs(amt);
  if (abs >= 1000000) return `₱${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `₱${(abs / 1000).toFixed(1)}K`;
  return `₱${abs.toFixed(0)}`;
}

// ─── Custom Tooltip ───
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/40 bg-card/95 backdrop-blur-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-border/30 mt-1 pt-1 flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Net</span>
          <span className={`font-mono font-bold ${(payload[0].value - payload[1].value) >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
interface IncomeStatementViewProps {
  data: IncomeSummaryRow[];
}

export function IncomeStatementView({ data }: IncomeStatementViewProps) {
  const years = useMemo(() => {
    const ySet = new Set<string>();
    for (const r of data) {
      const { year } = parseYearMonth(r.yearMonth);
      if (year) ySet.add(year);
    }
    return Array.from(ySet).sort().reverse();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear().toString());

  const filteredData = useMemo(() => {
    return data
      .filter((r) => parseYearMonth(r.yearMonth).year === selectedYear)
      .sort((a, b) => parseYearMonth(a.yearMonth).month - parseYearMonth(b.yearMonth).month);
  }, [data, selectedYear]);

  const yearTotals = useMemo(() => {
    let totalIn = 0, totalOut = 0, totalTx = 0;
    for (const r of filteredData) {
      totalIn += r.totalCashIn;
      totalOut += r.totalCashOut;
      totalTx += r.txCount;
    }
    return { totalIn, totalOut, net: totalIn - totalOut, totalTx };
  }, [filteredData]);

  const margin = yearTotals.totalIn > 0 ? ((yearTotals.net / yearTotals.totalIn) * 100).toFixed(1) : "0.0";
  const isCriticalMargin = parseFloat(margin) < -20;

  // Best/worst months
  const bestMonth = filteredData.length > 1
    ? filteredData.reduce((best, r) => r.netCash > best.netCash ? r : best, filteredData[0])
    : null;
  const worstMonth = filteredData.length > 1
    ? filteredData.reduce((worst, r) => r.netCash < worst.netCash ? r : worst, filteredData[0])
    : null;

  // Chart data
  const chartData = useMemo(() => {
    return filteredData.map((r) => ({
      month: shortMonth(r.yearMonth),
      "Cash In": r.totalCashIn,
      "Cash Out": r.totalCashOut,
      net: r.netCash,
    }));
  }, [filteredData]);

  // MoM change helper
  function momChange(index: number): { direction: "up" | "down" | "flat"; pct: string } | null {
    if (index === 0) return null;
    const prev = filteredData[index - 1].netCash;
    const curr = filteredData[index].netCash;
    if (prev === 0 && curr === 0) return { direction: "flat", pct: "0%" };
    if (prev === 0) return { direction: curr > 0 ? "up" : "down", pct: "∞" };
    const change = ((curr - prev) / Math.abs(prev)) * 100;
    return {
      direction: change >= 0 ? "up" : "down",
      pct: `${Math.abs(change).toFixed(0)}%`,
    };
  }

  return (
    <div className="space-y-6">
      {/* ── Header: Year Picker + Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border/40 bg-card/60 backdrop-blur-md px-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={(val) => { if (val) setSelectedYear(val); }}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto text-sm font-semibold shadow-none focus:ring-0 min-w-[60px]">
                <SelectValue>{selectedYear}</SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="text-xs gap-1">
            <BarChart3 className="h-3 w-3" />
            {filteredData.length} {filteredData.length === 1 ? "month" : "months"}
          </Badge>
        </div>

        {filteredData.length > 1 && (
          <div className="flex items-center gap-3 text-xs">
            {bestMonth && (
              <span className="flex items-center gap-1 text-green-500">
                <TrendingUp className="h-3 w-3" />
                Best: {shortMonth(bestMonth.yearMonth)}
              </span>
            )}
            {worstMonth && bestMonth !== worstMonth && (
              <span className="flex items-center gap-1 text-red-500">
                <TrendingDown className="h-3 w-3" />
                Worst: {shortMonth(worstMonth.yearMonth)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-xl font-bold text-green-500 mt-1">{formatCurrency(yearTotals.totalIn)}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Expenses</p>
                <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(yearTotals.totalOut)}</p>
              </div>
              <TrendingDown className="h-7 w-7 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-border/40 backdrop-blur-md ${yearTotals.net >= 0 ? "bg-green-500/5" : "bg-red-500/5"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Net Profit / Loss</p>
                <p className={`text-xl font-bold mt-1 ${yearTotals.net >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {yearTotals.net >= 0 ? "+" : "-"}{formatCurrency(yearTotals.net)}
                </p>
              </div>
              <DollarSign className={`h-7 w-7 ${yearTotals.net >= 0 ? "text-green-500/20" : "text-red-500/20"}`} />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-border/40 backdrop-blur-md ${isCriticalMargin ? "bg-red-500/10 border-red-500/30" : "bg-card/60"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  Profit Margin
                  {isCriticalMargin && <AlertTriangle className="h-3 w-3 text-red-500" />}
                </p>
                <p className={`text-xl font-bold mt-1 ${parseFloat(margin) >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {margin}%
                </p>
              </div>
              <Percent className="h-7 w-7 text-muted-foreground/20" />
            </div>
            {isCriticalMargin && (
              <p className="text-[10px] text-red-400/80 mt-1.5">⚠ Expenses significantly exceed revenue</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bar Chart ── */}
      {chartData.length > 0 && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Cash Flow — {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
                />
                <Bar dataKey="Cash In" radius={[4, 4, 0, 0]} fill="#22c55e" opacity={0.85} />
                <Bar dataKey="Cash Out" radius={[4, 4, 0, 0]} fill="#ef4444" opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Monthly Breakdown Table ── */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Monthly Breakdown — {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Cash In</TableHead>
                <TableHead className="text-right">Cash Out</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Change</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Entries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/20" />
                      <p>No data for {selectedYear}</p>
                      <p className="text-xs text-muted-foreground/60">Add entries in Cash Log to see data here</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredData.map((row, idx) => {
                    const isBest = bestMonth && row.yearMonth === bestMonth.yearMonth;
                    const isWorst = worstMonth && row.yearMonth === worstMonth.yearMonth && bestMonth !== worstMonth;
                    const mom = momChange(idx);
                    return (
                      <TableRow
                        key={row.yearMonth}
                        className={`border-border/40 hover:bg-muted/5 transition-colors ${
                          isBest ? "bg-green-500/5" : isWorst ? "bg-red-500/5" : ""
                        }`}
                      >
                        <TableCell className="font-medium text-sm">
                          <span className="flex items-center gap-2">
                            {monthLabel(row.yearMonth)}
                            {isBest && (
                              <Badge variant="secondary" className="text-[9px] bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0">
                                Best
                              </Badge>
                            )}
                            {isWorst && (
                              <Badge variant="secondary" className="text-[9px] bg-red-500/10 text-red-500 border-red-500/20 px-1.5 py-0">
                                Worst
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {row.totalCashIn > 0 ? (
                            <span className="text-green-500">+{formatCurrency(row.totalCashIn)}</span>
                          ) : (
                            <span className="text-muted-foreground/30">₱0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {row.totalCashOut > 0 ? (
                            <span className="text-red-500">-{formatCurrency(row.totalCashOut)}</span>
                          ) : (
                            <span className="text-muted-foreground/30">₱0.00</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-mono font-semibold ${row.netCash >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {row.netCash >= 0 ? "+" : "-"}{formatCurrency(row.netCash)}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          {mom ? (
                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                              mom.direction === "up" ? "text-green-500" : mom.direction === "down" ? "text-red-500" : "text-muted-foreground"
                            }`}>
                              {mom.direction === "up" ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : mom.direction === "down" ? (
                                <ArrowDownRight className="h-3 w-3" />
                              ) : null}
                              {mom.pct}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground hidden sm:table-cell">
                          {row.txCount}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals Row */}
                  <TableRow className="border-t-2 border-border bg-muted/10 font-bold">
                    <TableCell className="text-sm font-bold">Total ({selectedYear})</TableCell>
                    <TableCell className="text-right text-sm text-green-500 font-mono font-bold">
                      +{formatCurrency(yearTotals.totalIn)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-500 font-mono font-bold">
                      -{formatCurrency(yearTotals.totalOut)}
                    </TableCell>
                    <TableCell className={`text-right text-sm font-mono font-bold ${yearTotals.net >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {yearTotals.net >= 0 ? "+" : "-"}{formatCurrency(yearTotals.net)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="text-center text-sm text-muted-foreground hidden sm:table-cell font-bold">
                      {yearTotals.totalTx}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
