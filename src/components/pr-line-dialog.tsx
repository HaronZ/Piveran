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
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { addPrLine, updatePrLine } from "@/lib/actions/purchase-requests";
import type { PrLineRow, PrLineStatusOption, PartOption, VendorOption } from "@/lib/db/queries/purchase-requests";

interface PrLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prId: string;
  line?: PrLineRow | null;
  parts: PartOption[];
  vendors: VendorOption[];
  lineStatuses: PrLineStatusOption[];
}

export function PrLineDialog({
  open,
  onOpenChange,
  prId,
  line,
  parts,
  vendors,
  lineStatuses,
}: PrLineDialogProps) {
  const isEdit = !!line;

  const boundAction = line
    ? updatePrLine.bind(null, line.id, prId)
    : addPrLine.bind(null, prId);

  const [state, formAction, isPending] = useActionState(boundAction, {});

  // Track part/vendor for hidden inputs
  const initialPart = line?.partId
    ? parts.find((p) => p.id === line.partId)?.name || ""
    : "";
  const initialVendor = line?.supplierId
    ? vendors.find((v) => v.id === line.supplierId)?.name || ""
    : "";
  const initialStatus = line?.statusId
    ? lineStatuses.find((s) => s.id === line.statusId)?.status || ""
    : "";

  const [selectedPart, setSelectedPart] = useState(initialPart);
  const [selectedVendor, setSelectedVendor] = useState(initialVendor);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open && !prevOpen) {
    setPrevOpen(true);
    setSelectedPart(
      line?.partId
        ? parts.find((p) => p.id === line.partId)?.name || ""
        : ""
    );
    setSelectedVendor(
      line?.supplierId
        ? vendors.find((v) => v.id === line.supplierId)?.name || ""
        : ""
    );
    setSelectedStatus(
      line?.statusId
        ? lineStatuses.find((s) => s.id === line.statusId)?.status || ""
        : ""
    );
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const partId = parts.find((p) => p.name === selectedPart)?.id || "";
  const supplierId = vendors.find((v) => v.name === selectedVendor)?.id || "";
  const statusId = lineStatuses.find((s) => s.status === selectedStatus)?.id;

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Line item updated" : "Line item added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Line Item" : "Add Line Item"}
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
          <input type="hidden" name="supplierId" value={supplierId} />
          {statusId && (
            <input type="hidden" name="statusId" value={statusId} />
          )}

          <div className="space-y-4">
            {/* Part Selector */}
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

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-medium">
                  Quantity <span className="text-red-400">*</span>
                </Label>
                <div className="flex items-center h-9 rounded-md border border-input bg-background/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .nextElementSibling as HTMLInputElement;
                      const val = Math.max(
                        1,
                        parseInt(input.value || "1") - 1
                      );
                      const setter =
                        Object.getOwnPropertyDescriptor(
                          window.HTMLInputElement.prototype,
                          "value"
                        )!.set!;
                      setter.call(input, val.toString());
                      input.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }}
                    className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={line?.quantity ?? 1}
                    className="flex-1 h-full bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      const val = parseInt(input.value || "1") + 1;
                      const setter =
                        Object.getOwnPropertyDescriptor(
                          window.HTMLInputElement.prototype,
                          "value"
                        )!.set!;
                      setter.call(input, val.toString());
                      input.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );
                    }}
                    className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                </div>
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
                  defaultValue={line?.unitPrice ?? ""}
                  placeholder="0.00"
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Target Price */}
              <div className="space-y-1.5">
                <Label htmlFor="targetPrice" className="text-xs font-medium">
                  Target Sell Price
                </Label>
                <Input
                  id="targetPrice"
                  name="targetPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={line?.targetPrice ?? ""}
                  placeholder="0.00"
                  className="h-9 text-sm bg-background/50"
                />
              </div>

              {/* Line Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v ?? "")}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {lineStatuses.map((s) => (
                      <SelectItem key={s.id} value={s.status}>
                        {s.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vendor / Supplier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Supplier</Label>
              <Select
                value={selectedVendor}
                onValueChange={(v) => setSelectedVendor(v ?? "")}
              >
                <SelectTrigger className="h-9 text-sm bg-background/50">
                  <SelectValue placeholder="Select supplier" />
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

            {/* Link */}
            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-xs font-medium">
                Link
              </Label>
              <Input
                id="link"
                name="link"
                defaultValue={line?.link || ""}
                placeholder="https://..."
                className="h-9 text-sm bg-background/50"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <Label htmlFor="comment" className="text-xs font-medium">
                Comment
              </Label>
              <Input
                id="comment"
                name="comment"
                defaultValue={line?.comment || ""}
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
              className="text-sm gap-2 bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
