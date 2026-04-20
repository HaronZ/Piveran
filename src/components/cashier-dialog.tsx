"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { createCashier, updateCashier } from "@/lib/actions/cashiers";
import type { CashierRow } from "@/lib/db/queries/cashiers";

interface CashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier?: CashierRow | null;
}

export function CashierDialog({ open, onOpenChange, cashier }: CashierDialogProps) {
  const isEdit = !!cashier;
  const boundAction = cashier ? updateCashier.bind(null, cashier.id) : createCashier;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Cashier updated" : "Cashier added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Cashier" : "Add New Cashier"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <FormError message={state?.error} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input id="firstName" name="firstName" defaultValue={cashier?.firstName || ""} required className="border-border/40 bg-card/60" placeholder="Maria" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="middleName" className="text-xs">Middle Name</Label>
              <Input id="middleName" name="middleName" defaultValue={cashier?.middleName || ""} className="border-border/40 bg-card/60" placeholder="Santos" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last Name</Label>
              <Input id="lastName" name="lastName" defaultValue={cashier?.lastName || ""} className="border-border/40 bg-card/60" placeholder="Dela Cruz" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactNumber" className="text-xs">Contact Number</Label>
              <Input id="contactNumber" name="contactNumber" defaultValue={cashier?.contactNumber || ""} className="border-border/40 bg-card/60" placeholder="09XX-XXX-XXXX" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Cashier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
