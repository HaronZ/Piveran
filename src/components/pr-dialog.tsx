"use client";

import { useActionState, useEffect } from "react";
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
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  createPurchaseRequest,
  updatePurchaseRequest,
} from "@/lib/actions/purchase-requests";
import type { PurchaseRequestRow, PrStatusOption } from "@/lib/db/queries/purchase-requests";

interface PrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pr?: PurchaseRequestRow | null;
  statuses: PrStatusOption[];
  nextPrNumber: string;
}

export function PrDialog({
  open,
  onOpenChange,
  pr,
  statuses,
  nextPrNumber,
}: PrDialogProps) {
  const isEdit = !!pr;

  const boundAction = pr
    ? updatePurchaseRequest.bind(null, pr.id)
    : createPurchaseRequest;

  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(
        isEdit ? "Purchase request updated" : "Purchase request created"
      );
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  const defaultDate = pr?.date
    ? new Date(pr.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const statusName = pr?.statusId
    ? statuses.find((s) => s.id === pr.statusId)?.status || ""
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <ShoppingCart className="h-5 w-5 text-purple-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Purchase Request" : "New Purchase Request"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          <input
            type="hidden"
            name="prNumber"
            value={isEdit ? pr.prNumber : nextPrNumber}
          />

          <div className="space-y-4">
            {/* PR Number — read-only display */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">PR Number</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/30 text-sm font-mono text-muted-foreground">
                {isEdit ? pr.prNumber : nextPrNumber}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium">
                  Date
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  min={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
                  className="h-9 text-sm border-border/40 bg-card/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <input type="hidden" name="statusId" id="statusIdHidden" />
                <Select
                  defaultValue={statusName || "New"}
                  onValueChange={(v) => {
                    const st = statuses.find((s) => s.status === v);
                    const hidden = document.getElementById(
                      "statusIdHidden"
                    ) as HTMLInputElement;
                    if (hidden && st) hidden.value = String(st.id);
                  }}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.status}>
                        {s.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="label" className="text-xs font-medium">
                Label
              </Label>
              <Input
                id="label"
                name="label"
                defaultValue={pr?.label || ""}
                placeholder="e.g. Monthly restock, Urgent order..."
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment" className="text-xs font-medium">
                Comment
              </Label>
              <Textarea
                id="comment"
                name="comment"
                defaultValue={pr?.comment || ""}
                placeholder="Optional notes..."
                rows={2}
                className="text-sm bg-background/50 resize-none"
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
              {isEdit ? "Save Changes" : "Create PR"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
