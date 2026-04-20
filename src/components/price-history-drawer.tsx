"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PriceHistoryEntry } from "@/lib/db/queries/price-history";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  fetchHistory: () => Promise<PriceHistoryEntry[]>;
}

function fmt(n: number | string | null | undefined) {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (isNaN(v)) return "—";
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PriceHistoryDrawer({ open, onOpenChange, title, subtitle, fetchHistory }: Props) {
  const [rows, setRows] = useState<PriceHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    startTransition(() => {
      fetchHistory()
        .then((data) => { if (!cancelled) { setRows(data); setError(null); } })
        .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); });
    });
    return () => { cancelled = true; };
  }, [open, fetchHistory]);

  const loading = isPending;

  const latest = rows[0] ? parseFloat(rows[0].price) : null;
  const earliest = rows.length > 1 ? parseFloat(rows[rows.length - 1].price) : null;
  const delta = latest !== null && earliest !== null ? latest - earliest : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-border/40 bg-card/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-base">{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 py-6 text-center">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No price history recorded yet.</p>
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current</p>
                  <p className="text-lg font-bold text-emerald-500">{fmt(latest)}</p>
                </div>
                {delta !== null && (
                  <Badge
                    variant="secondary"
                    className={
                      delta > 0
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : delta < 0
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {delta > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : delta < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                    {delta > 0 ? "+" : ""}{fmt(delta)}
                  </Badge>
                )}
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entries</p>
                  <p className="text-lg font-bold">{rows.length}</p>
                </div>
              </div>

              {/* History list */}
              <div className="space-y-2">
                {rows.map((r, idx) => {
                  const prev = rows[idx + 1];
                  const prevPrice = prev ? parseFloat(prev.price) : null;
                  const diff = prevPrice !== null ? parseFloat(r.price) - prevPrice : null;
                  return (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{fmt(r.price)}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(r.date)}</p>
                        {r.changedBy && (
                          <p className="text-[11px] text-muted-foreground truncate">by {r.changedBy}</p>
                        )}
                        {r.comment && (
                          <p className="text-[11px] text-muted-foreground italic mt-1">“{r.comment}”</p>
                        )}
                      </div>
                      {diff !== null && diff !== 0 && (
                        <Badge
                          variant="secondary"
                          className={
                            diff > 0
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] shrink-0"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] shrink-0"
                          }
                        >
                          {diff > 0 ? "+" : ""}{fmt(diff)}
                        </Badge>
                      )}
                      {idx === 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                          Latest
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
