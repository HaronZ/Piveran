"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Package } from "lucide-react";
import { createPart, updatePart } from "@/lib/actions/parts";
import type { PartRow, BrandOption, CabinetCodeOption } from "@/lib/db/queries/parts";

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: PartRow | null;
  brands: BrandOption[];
  cabinetCodes: CabinetCodeOption[];
}

export function PartDialog({
  open,
  onOpenChange,
  part,
  brands,
  cabinetCodes,
}: PartDialogProps) {
  const isEdit = !!part;

  // Find initial display names for edit mode
  const initialBrand = part?.brandId
    ? brands.find((b) => b.id === part.brandId)?.name || ""
    : "";
  const initialCabinet = part?.cabinetCodeId
    ? cabinetCodes.find((c) => c.id === part.cabinetCodeId)?.code || ""
    : "";

  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedCabinet, setSelectedCabinet] = useState(initialCabinet);

  // Reset when dialog opens/closes or part changes
  useEffect(() => {
    if (open) {
      setSelectedBrand(
        part?.brandId
          ? brands.find((b) => b.id === part.brandId)?.name || ""
          : ""
      );
      setSelectedCabinet(
        part?.cabinetCodeId
          ? cabinetCodes.find((c) => c.id === part.cabinetCodeId)?.code || ""
          : ""
      );
    }
  }, [open, part, brands, cabinetCodes]);

  // Resolve IDs from names
  const brandId = brands.find((b) => b.name === selectedBrand)?.id || "";
  const cabinetCodeId =
    cabinetCodes.find((c) => c.code === selectedCabinet)?.id || "";

  const boundUpdate = part ? updatePart.bind(null, part.id) : createPart;

  const [state, formAction, isPending] = useActionState(boundUpdate, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Part updated successfully" : "Part added successfully");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Part" : "Add New Part"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          {/* Hidden inputs for actual IDs sent to server */}
          <input type="hidden" name="brandId" value={brandId} />
          <input type="hidden" name="cabinetCodeId" value={cabinetCodeId} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={part?.name || ""}
                placeholder="e.g. Oil Filter"
                required
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Brand</Label>
              <Select
                value={selectedBrand}
                onValueChange={(v) => setSelectedBrand(v ?? "")}
              >
                <SelectTrigger className="h-9 text-sm bg-background/50">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cabinet Code</Label>
              <Select
                value={selectedCabinet}
                onValueChange={(v) => setSelectedCabinet(v ?? "")}
              >
                <SelectTrigger className="h-9 text-sm bg-background/50">
                  <SelectValue placeholder="Select code" />
                </SelectTrigger>
                <SelectContent>
                  {cabinetCodes.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partNumber" className="text-xs font-medium">
                Part Number
              </Label>
              <Input
                id="partNumber"
                name="partNumber"
                defaultValue={part?.partNumber || ""}
                placeholder="e.g. 15400-RTA-003"
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="partCode" className="text-xs font-medium">
                Part Code
              </Label>
              <Input
                id="partCode"
                name="partCode"
                defaultValue={part?.partCode || ""}
                placeholder="e.g. OF-001"
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={part?.description || ""}
                placeholder="Optional description..."
                rows={2}
                className="text-sm bg-background/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="criticalCount" className="text-xs font-medium">
                Critical Stock Level
              </Label>
              <div className="flex items-center h-9 rounded-md border border-input bg-background/50 overflow-hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .nextElementSibling as HTMLInputElement;
                    const val = Math.max(0, parseInt(input.value || "0") - 1);
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      "value"
                    )!.set!;
                    nativeInputValueSetter.call(input, val.toString());
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }}
                  className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <input
                  id="criticalCount"
                  name="criticalCount"
                  type="number"
                  min={0}
                  defaultValue={part?.criticalCount ?? 0}
                  className="flex-1 h-full bg-transparent text-center text-sm font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    const val = parseInt(input.value || "0") + 1;
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      "value"
                    )!.set!;
                    nativeInputValueSetter.call(input, val.toString());
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }}
                  className="flex items-center justify-center w-9 h-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="includeCritical"
                  defaultChecked={part?.includeCritical ?? false}
                  className="h-4 w-4 rounded border-border accent-amber-500"
                />
                <span className="text-xs text-muted-foreground">
                  Include in low-stock alerts
                </span>
              </label>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="comment" className="text-xs font-medium">
                Comment
              </Label>
              <Input
                id="comment"
                name="comment"
                defaultValue={""}
                placeholder="Optional comment..."
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
              className="text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Part"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
