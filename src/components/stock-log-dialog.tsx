"use client";

import { useActionState, useEffect, useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, ClipboardList, Package, Calendar, Truck,
  CreditCard, MessageSquare, Link2, Search, Check, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { createStockLog, updateStockLog } from "@/lib/actions/stock-log";
import type {
  StockLogRow,
  ActionOption,
  UnitOption,
  SalesTypeOption,
  PaymentTypeOption,
} from "@/lib/db/queries/stock-log";
import type { PartOption, VendorOption } from "@/lib/db/queries/purchase-requests";

/* ─── Searchable Part Picker ─── */
function PartPicker({
  parts,
  value,
  onChange,
}: {
  parts: PartOption[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return parts.slice(0, 50); // Show first 50 by default
    const q = query.toLowerCase();
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.partNumber && p.partNumber.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [parts, query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 h-9 w-full rounded-md border border-border/40 bg-card/60 px-3 text-sm cursor-pointer hover:bg-card/80 transition-colors"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {value ? (
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{value}</span>
          </span>
        ) : (
          <span className="text-muted-foreground flex-1">Select a part...</span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-lg border border-border/40 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search parts..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
            {query && (
              <span className="text-[10px] text-muted-foreground">{filtered.length} results</span>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No parts match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-emerald-500/10 transition-colors ${
                    value === p.name ? "bg-emerald-500/10 text-emerald-400" : ""
                  }`}
                  onClick={() => {
                    onChange(p.name);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {value === p.name ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Package className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="truncate flex-1">{p.name}</span>
                  {p.partNumber && (
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      #{p.partNumber}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Dialog ─── */
interface StockLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: StockLogRow | null;
  parts: PartOption[];
  vendors: VendorOption[];
  actions: ActionOption[];
  units: UnitOption[];
  salesTypes: SalesTypeOption[];
  paymentTypes: PaymentTypeOption[];
}

export function StockLogDialog({
  open,
  onOpenChange,
  entry,
  parts,
  vendors,
  actions,
  units,
  salesTypes,
  paymentTypes,
}: StockLogDialogProps) {
  const isEdit = !!entry;

  const boundAction = entry
    ? updateStockLog.bind(null, entry.id)
    : createStockLog;

  const [state, formAction, isPending] = useActionState(boundAction, {});

  const [selectedPart, setSelectedPart] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedSalesType, setSelectedSalesType] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedPart(entry?.partId ? parts.find((p) => p.id === entry.partId)?.name || "" : "");
      setSelectedAction(entry?.actionId ? actions.find((a) => a.id === entry.actionId)?.name || "" : "");
      setSelectedVendor(entry?.vendorId ? vendors.find((v) => v.id === entry.vendorId)?.name || "" : "");
      setSelectedUnit(entry?.unitId ? units.find((u) => u.id === entry.unitId)?.name || "" : "");
      setSelectedSalesType(entry?.salesTypeId ? salesTypes.find((s) => s.id === entry.salesTypeId)?.type || "" : "");
      setSelectedPaymentType(entry?.paymentTypeId ? paymentTypes.find((p) => p.id === entry.paymentTypeId)?.type || "" : "");
    }
  }, [open, entry, parts, actions, vendors, units, salesTypes, paymentTypes]);

  const partId = parts.find((p) => p.name === selectedPart)?.id || "";
  const actionId = actions.find((a) => a.name === selectedAction)?.id;
  const vendorId = vendors.find((v) => v.name === selectedVendor)?.id || "";
  const unitId = units.find((u) => u.name === selectedUnit)?.id;
  const salesTypeId = salesTypes.find((s) => s.type === selectedSalesType)?.id;
  const paymentTypeId = paymentTypes.find((p) => p.type === selectedPaymentType)?.id;

  const selectedActionObj = actions.find((a) => a.name === selectedAction);
  const isAddStock = selectedActionObj?.addMinus === 1;
  const isSale = selectedAction === "Sale";

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Stock log updated" : "Stock log entry added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  const defaultDate = entry?.date
    ? new Date(entry.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Stock Entry" : "Record Stock Movement"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "Update the stock entry details" : "Log an inventory change with quantities and pricing"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-3">
          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          <input type="hidden" name="partId" value={partId} />
          {actionId && <input type="hidden" name="actionId" value={actionId} />}
          <input type="hidden" name="vendorId" value={vendorId} />
          {unitId && <input type="hidden" name="unitId" value={unitId} />}
          {salesTypeId && <input type="hidden" name="salesTypeId" value={salesTypeId} />}
          {paymentTypeId && <input type="hidden" name="paymentTypeId" value={paymentTypeId} />}

          {/* ── Section 1: Date & Action ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Date &amp; Action
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  className="border-border/40 bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Action <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedAction}
                  onValueChange={(v) => setSelectedAction(v ?? "")}
                >
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Select action">
                      {selectedAction ? (
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isAddStock ? "bg-green-500" : "bg-red-500"}`} />
                          {selectedAction}
                        </span>
                      ) : "Select action"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {actions.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${a.addMinus === 1 ? "bg-green-500" : "bg-red-500"}`} />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* ── Section 2: Part & Quantity ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Package className="h-4 w-4" />
              Part &amp; Quantity
            </div>

            {/* Searchable Part Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Part <span className="text-red-500">*</span>
              </Label>
              <PartPicker
                parts={parts}
                value={selectedPart}
                onChange={setSelectedPart}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Qty <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center h-9 rounded-md border border-border/40 bg-card/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                      const val = Math.max(1, parseInt(input.value || "1") - 1);
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
                      setter.call(input, val.toString());
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                    }}
                    className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-bold border-r border-border/30"
                  >
                    −
                  </button>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={entry?.quantity ?? 1}
                    className="flex-1 h-full bg-transparent text-center text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const val = parseInt(input.value || "1") + 1;
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
                      setter.call(input, val.toString());
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                    }}
                    className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-bold border-l border-border/30"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(v) => setSelectedUnit(v ?? "")}
                >
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Unit">
                      {selectedUnit || "Unit"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice" className="text-xs">
                  Unit Price (₱)
                </Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={entry?.unitPrice ?? ""}
                  placeholder="0.00"
                  className="border-border/40 bg-card/60 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Supplier (conditional) ── */}
          {isAddStock && (
            <>
              <Separator className="border-border/30" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Supplier Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vendor</Label>
                    <Select
                      value={selectedVendor}
                      onValueChange={(v) => setSelectedVendor(v ?? "")}
                    >
                      <SelectTrigger className="border-border/40 bg-card/60">
                        <SelectValue placeholder="Select vendor">
                          {selectedVendor || "Select vendor"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.name}>
                            <span className="flex items-center gap-2">
                              <Truck className="h-3 w-3 text-blue-500 shrink-0" />
                              {v.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Type</Label>
                    <Select
                      value={selectedPaymentType}
                      onValueChange={(v) => setSelectedPaymentType(v ?? "")}
                    >
                      <SelectTrigger className="border-border/40 bg-card/60">
                        <SelectValue placeholder="Select">
                          {selectedPaymentType ? (
                            <span className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3 text-amber-500" />
                              {selectedPaymentType}
                            </span>
                          ) : "Select"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                        {paymentTypes.map((p) => (
                          <SelectItem key={p.id} value={p.type}>
                            {p.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedPaymentType === "Payable" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="payableDueDate" className="text-xs">
                      Due Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="payableDueDate"
                      name="payableDueDate"
                      type="date"
                      defaultValue={entry?.payableDueDate || ""}
                      className="border-border/40 bg-card/60"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="addStockLink" className="text-xs flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Reference Link
                  </Label>
                  <Input
                    id="addStockLink"
                    name="addStockLink"
                    defaultValue={entry?.addStockLink || ""}
                    placeholder="https://..."
                    className="border-border/40 bg-card/60 text-blue-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Section 3b: Sales Type (conditional) ── */}
          {isSale && (
            <>
              <Separator className="border-border/30" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Sales Details
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sales Type</Label>
                  <Select
                    value={selectedSalesType}
                    onValueChange={(v) => setSelectedSalesType(v ?? "")}
                  >
                    <SelectTrigger className="border-border/40 bg-card/60">
                      <SelectValue placeholder="Select sales type">
                        {selectedSalesType || "Select sales type"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                      {salesTypes.map((s) => (
                        <SelectItem key={s.id} value={s.type}>
                          {s.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator className="border-border/30" />

          {/* ── Section 4: Notes ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Notes
            </div>
            <Textarea
              id="comments"
              name="comments"
              defaultValue={entry?.comments || ""}
              placeholder="Optional note about this stock movement..."
              className="border-border/40 bg-card/60 min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Record Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
