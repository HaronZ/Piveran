"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  Loader2, Plus, Pencil, Trash2, Store, ExternalLink, Crown, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  listPartSuppliers,
  addPartSupplier,
  updatePartSupplier,
  deletePartSupplier,
} from "@/lib/actions/parts";
import type { PartSupplierRow, VendorOption } from "@/lib/db/queries/parts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  partName: string;
  partNumber?: string | null;
  vendors: VendorOption[];
}

function fmt(n: string | null) {
  if (!n) return "—";
  const v = parseFloat(n);
  if (isNaN(v)) return "—";
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PartSuppliersDialog({
  open, onOpenChange, partId, partName, partNumber, vendors,
}: Props) {
  const [rows, setRows] = useState<PartSupplierRow[] | null>(null);
  const [editing, setEditing] = useState<PartSupplierRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(() => {
      listPartSuppliers(partId).then(setRows);
    });
  };

  useEffect(() => {
    if (open) {
      setRows(null);
      setEditing(null);
      setShowAdd(false);
      setDeleteId(null);
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partId]);

  const toDelete = rows?.find((r) => r.id === deleteId) ?? null;

  // cheapest price among rows with a non-null numeric price
  const cheapestPrice =
    rows && rows.length > 0
      ? rows
          .map((r) => (r.price ? parseFloat(r.price) : null))
          .filter((v): v is number => v !== null && !isNaN(v))
          .reduce<number | null>((min, v) => (min === null || v < min ? v : min), null)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-border/40 bg-card/95 backdrop-blur-xl">
      <TooltipProvider>
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Store className="h-5 w-5 text-amber-500" />
            Vendor prices · {partName}
          </DialogTitle>
          <DialogDescription>
            {partNumber ? `Part # ${partNumber} · ` : ""}Compare prices across vendors. Cheapest is highlighted.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {rows === null ? "Loading…" : `${rows.length} vendor${rows.length === 1 ? "" : "s"}`}
            </p>
            <Button
              size="sm"
              onClick={() => { setEditing(null); setShowAdd(true); }}
              className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add vendor
            </Button>
          </div>

          {showAdd && (
            <SupplierForm
              partId={partId}
              vendors={vendors}
              existingVendorIds={(rows ?? []).map((r) => r.vendorId)}
              onCancel={() => setShowAdd(false)}
              onSaved={() => { setShowAdd(false); refresh(); }}
            />
          )}

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {rows === null || isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No vendor prices yet. Add one to start comparing.
              </p>
            ) : (
              rows.map((r) => {
                if (editing?.id === r.id) {
                  return (
                    <SupplierForm
                      key={r.id}
                      partId={partId}
                      vendors={vendors}
                      existingVendorIds={(rows ?? [])
                        .filter((x) => x.id !== r.id)
                        .map((x) => x.vendorId)}
                      initial={r}
                      onCancel={() => setEditing(null)}
                      onSaved={() => { setEditing(null); refresh(); }}
                    />
                  );
                }
                const priceNum = r.price ? parseFloat(r.price) : null;
                const isCheapest =
                  cheapestPrice !== null &&
                  priceNum !== null &&
                  !isNaN(priceNum) &&
                  priceNum === cheapestPrice;
                return (
                  <div
                    key={r.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors ${
                      isCheapest
                        ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                        : "border-border/40 bg-card/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{r.vendorName}</p>
                        {isCheapest && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-0.5"
                          >
                            <Crown className="h-3 w-3" /> Cheapest
                          </Badge>
                        )}
                      </div>
                      <p className={`mt-1 font-mono text-lg font-bold ${isCheapest ? "text-emerald-500" : ""}`}>
                        {fmt(r.price)}
                      </p>
                      {r.comment && (
                        <p className="text-[11px] text-muted-foreground italic mt-1">&ldquo;{r.comment}&rdquo;</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-muted-foreground">Updated {formatDate(r.lastUpdate)}</p>
                        {r.link && (
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-amber-500 hover:underline flex items-center gap-0.5"
                          >
                            Open link <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => { setShowAdd(false); setEditing(r); }}
                              aria-label="Edit vendor price"
                            />
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Edit price</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-500"
                              onClick={() => setDeleteId(r.id)}
                              aria-label="Remove vendor price"
                            />
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Remove vendor</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </TooltipProvider>
      </DialogContent>

      <DeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Remove vendor price"
        description={`Remove ${toDelete?.vendorName || "this vendor"}'s price entry for ${partName}?`}
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await deletePartSupplier(toDelete.id);
          if (res.error) toast.error(res.error);
          else { toast.success("Vendor removed"); refresh(); }
        }}
      />
    </Dialog>
  );
}

// ─── inline add / edit form ───
function SupplierForm({
  partId, vendors, existingVendorIds, initial, onCancel, onSaved,
}: {
  partId: string;
  vendors: VendorOption[];
  existingVendorIds: string[];
  initial?: PartSupplierRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [vendorId, setVendorId] = useState(initial?.vendorId || "");
  const [price, setPrice] = useState(initial?.price || "");
  const [link, setLink] = useState(initial?.link || "");
  const [comment, setComment] = useState(initial?.comment || "");
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) { toast.error("Select a vendor"); return; }
    setSaving(true);
    const payload = {
      vendorId,
      price: price ? parseFloat(price) : undefined,
      link: link || undefined,
      comment: comment || undefined,
    };
    const res = isEdit
      ? await updatePartSupplier(initial!.id, payload)
      : await addPartSupplier(partId, payload);
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(isEdit ? "Vendor price updated" : "Vendor price added");
    onSaved();
  }

  const availableVendors = vendors.filter(
    (v) => v.id === vendorId || !existingVendorIds.includes(v.id)
  );
  const selected = vendors.find((v) => v.id === vendorId);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-500">
          {isEdit ? "Edit vendor price" : "New vendor price"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCancel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Vendor *</Label>
          <Select
            value={vendorId}
            onValueChange={(v) => setVendorId(v ?? "")}
            disabled={isEdit}
          >
            <SelectTrigger className="h-8 text-sm bg-background/50">
              <SelectValue placeholder="Select vendor…">
                {selected?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableVendors.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  All vendors already added
                </div>
              ) : (
                availableVendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Price (₱)</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs font-mono">₱</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 text-sm bg-background/50 pl-6 font-mono"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Link (optional)</Label>
        <Input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="h-8 text-sm bg-background/50"
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Comment (optional)</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="text-sm bg-background/50 min-h-[50px]"
          placeholder="Notes about this quote…"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !vendorId}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
          {isEdit ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}
