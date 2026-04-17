"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
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
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import type { VendorRow } from "@/lib/db/queries/vendors";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: VendorRow | null;
}

export function VendorDialog({
  open,
  onOpenChange,
  vendor,
}: VendorDialogProps) {
  const isEdit = !!vendor;

  const boundAction = vendor
    ? updateVendor.bind(null, vendor.id)
    : createVendor;

  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Vendor updated successfully" : "Vendor added successfully");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Truck className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <FormError message={state?.error} />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Vendor Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={vendor?.name || ""}
                placeholder="e.g. AutoZone Philippines"
                required
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                defaultValue={vendor?.address || ""}
                placeholder="e.g. 123 Main St, Makati City"
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactNumber" className="text-xs font-medium">
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  defaultValue={vendor?.contactNumber || ""}
                  placeholder="e.g. 0917-123-4567"
                  className="h-9 text-sm bg-background/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link" className="text-xs font-medium">
                  Link / Website
                </Label>
                <Input
                  id="link"
                  name="link"
                  defaultValue={vendor?.link || ""}
                  placeholder="https://..."
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comments" className="text-xs font-medium">
                Comments
              </Label>
              <Textarea
                id="comments"
                name="comments"
                defaultValue={vendor?.comments || ""}
                placeholder="Internal notes about this vendor..."
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
              className="text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
