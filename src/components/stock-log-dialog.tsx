"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ClipboardList } from "lucide-react";
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

  // Track selected values for hidden inputs
  const [selectedPart, setSelectedPart] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedSalesType, setSelectedSalesType] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedPart(
        entry?.partId
          ? parts.find((p) => p.id === entry.partId)?.name || ""
          : ""
      );
      setSelectedAction(
        entry?.actionId
          ? actions.find((a) => a.id === entry.actionId)?.name || ""
          : ""
      );
      setSelectedVendor(
        entry?.vendorId
          ? vendors.find((v) => v.id === entry.vendorId)?.name || ""
          : ""
      );
      setSelectedUnit(
        entry?.unitId
          ? units.find((u) => u.id === entry.unitId)?.name || ""
          : ""
      );
      setSelectedSalesType(
        entry?.salesTypeId
          ? salesTypes.find((s) => s.id === entry.salesTypeId)?.type || ""
          : ""
      );
      setSelectedPaymentType(
        entry?.paymentTypeId
          ? paymentTypes.find((p) => p.id === entry.paymentTypeId)?.type || ""
          : ""
      );
    }
  }, [open, entry, parts, actions, vendors, units, salesTypes, paymentTypes]);

  // Resolve IDs
  const partId = parts.find((p) => p.name === selectedPart)?.id || "";
  const actionId = actions.find((a) => a.name === selectedAction)?.id;
  const vendorId = vendors.find((v) => v.name === selectedVendor)?.id || "";
  const unitId = units.find((u) => u.name === selectedUnit)?.id;
  const salesTypeId = salesTypes.find((s) => s.type === selectedSalesType)?.id;
  const paymentTypeId = paymentTypes.find((p) => p.type === selectedPaymentType)?.id;

  // Get the selected action details
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
      <DialogContent className="sm:max-w-[520px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Stock Entry" : "Record Stock Movement"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          {/* Hidden inputs for IDs */}
          <input type="hidden" name="partId" value={partId} />
          {actionId && <input type="hidden" name="actionId" value={actionId} />}
          <input type="hidden" name="vendorId" value={vendorId} />
          {unitId && <input type="hidden" name="unitId" value={unitId} />}
          {salesTypeId && <input type="hidden" name="salesTypeId" value={salesTypeId} />}
          {paymentTypeId && <input type="hidden" name="paymentTypeId" value={paymentTypeId} />}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium">
                  Date <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  className="h-9 text-sm bg-background/50"
                />
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Action <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={selectedAction}
                  onValueChange={(v) => setSelectedAction(v ?? "")}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.addMinus === 1 ? "↑" : "↓"} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Part */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Part <span className="text-red-400">*</span>
              </Label>
              <Select
                value={selectedPart}
                onValueChange={(v) => setSelectedPart(v ?? "")}
              >
                <SelectTrigger className="h-9 text-sm bg-background/50">
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                      {p.partNumber && ` (${p.partNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Qty <span className="text-red-400">*</span>
                </Label>
                <div className="flex items-center h-9 rounded-md border border-input bg-background/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                      const val = Math.max(1, parseInt(input.value || "1") - 1);
                      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
                      setter.call(input, val.toString());
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                    }}
                    className="flex items-center justify-center w-8 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                  >
                    −
                  </button>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={entry?.quantity ?? 1}
                    className="flex-1 h-full bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="flex items-center justify-center w-8 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Unit</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(v) => setSelectedUnit(v ?? "")}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Price */}
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice" className="text-xs font-medium">
                  Unit Price
                </Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={entry?.unitPrice ?? ""}
                  placeholder="0.00"
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            </div>

            {/* Conditional: Vendor (for Add stock / Manual Add) */}
            {isAddStock && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Vendor</Label>
                <Select
                  value={selectedVendor}
                  onValueChange={(v) => setSelectedVendor(v ?? "")}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.name}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conditional: Payment Type + Due Date (for Add stock) */}
            {isAddStock && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Payment Type</Label>
                  <Select
                    value={selectedPaymentType}
                    onValueChange={(v) => setSelectedPaymentType(v ?? "")}
                  >
                    <SelectTrigger className="h-9 text-sm bg-background/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((p) => (
                        <SelectItem key={p.id} value={p.type}>
                          {p.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPaymentType === "Payable" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="payableDueDate" className="text-xs font-medium">
                      Due Date
                    </Label>
                    <Input
                      id="payableDueDate"
                      name="payableDueDate"
                      type="date"
                      defaultValue={entry?.payableDueDate || ""}
                      className="h-9 text-sm bg-background/50"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Conditional: Sales Type (for Sale) */}
            {isSale && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sales Type</Label>
                <Select
                  value={selectedSalesType}
                  onValueChange={(v) => setSelectedSalesType(v ?? "")}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Select sales type" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTypes.map((s) => (
                      <SelectItem key={s.id} value={s.type}>
                        {s.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Link (for Add stock) */}
            {isAddStock && (
              <div className="space-y-1.5">
                <Label htmlFor="addStockLink" className="text-xs font-medium">
                  Link
                </Label>
                <Input
                  id="addStockLink"
                  name="addStockLink"
                  defaultValue={entry?.addStockLink || ""}
                  placeholder="https://..."
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            )}

            {/* Comment */}
            <div className="space-y-1.5">
              <Label htmlFor="comments" className="text-xs font-medium">
                Comment
              </Label>
              <Input
                id="comments"
                name="comments"
                defaultValue={entry?.comments || ""}
                placeholder="Optional note..."
                className="h-9 text-sm bg-background/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="text-sm gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Record Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
