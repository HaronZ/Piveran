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
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar,
} from "lucide-react";
import type { IncomeSummaryRow } from "@/lib/db/queries/cash-log";

interface IncomeStatementViewProps {
  data: IncomeSummaryRow[];
}

export function IncomeStatementView({ data }: IncomeStatementViewProps) {
  // Derive available years
  const years = useMemo(() => {
    const ySet = new Set<string>();
    for (const r of data) {
      const y = r.yearMonth.split("-")[0];
      if (y) ySet.add(y);
    }
    return Array.from(ySet).sort().reverse();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear().toString());

  const filteredData = useMemo(() => {
    return data
      .filter((r) => r.yearMonth.startsWith(selectedYear))
      .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
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

  function formatCurrency(amt: number) {
    return `₱${Math.abs(amt).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  }

  function monthLabel(ym: string) {
    const [y, m] = ym.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
  }

  // Net margin
  const margin = yearTotals.totalIn > 0 ? ((yearTotals.net / yearTotals.totalIn) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Year Picker + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Fiscal Year</span>
          </div>
          <Select value={selectedYear} onValueChange={(val) => { if (val) setSelectedYear(val); }}>
            <SelectTrigger className="w-[140px] border-border/40 bg-card/60">
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
          {filteredData.length} months with data
        </Badge>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-green-500 mt-1">{formatCurrency(yearTotals.totalIn)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(yearTotals.totalOut)}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/40 backdrop-blur-md ${yearTotals.net >= 0 ? "bg-green-500/5" : "bg-red-500/5"}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Profit / Loss</p>
            <p className={`text-xl font-bold mt-1 ${yearTotals.net >= 0 ? "text-green-500" : "text-red-500"}`}>
              {yearTotals.net >= 0 ? "+" : "-"}{formatCurrency(yearTotals.net)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Profit Margin</p>
            <p className={`text-xl font-bold mt-1 ${parseFloat(margin) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {margin}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
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
                <TableHead className="text-center hidden sm:table-cell">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No data for {selectedYear}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredData.map((row) => (
                    <TableRow key={row.yearMonth} className="border-border/40 hover:bg-muted/5">
                      <TableCell className="font-medium text-sm">{monthLabel(row.yearMonth)}</TableCell>
                      <TableCell className="text-right text-sm text-green-500 font-mono">
                        {row.totalCashIn > 0 ? `+${formatCurrency(row.totalCashIn)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-500 font-mono">
                        {row.totalCashOut > 0 ? `-${formatCurrency(row.totalCashOut)}` : "—"}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-mono font-semibold ${row.netCash >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {row.netCash >= 0 ? "+" : "-"}{formatCurrency(row.netCash)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground hidden sm:table-cell">
                        {row.txCount}
                      </TableCell>
                    </TableRow>
                  ))}
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
