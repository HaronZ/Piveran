"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createMechanic, updateMechanic } from "@/lib/actions/mechanics";
import type { MechanicRow } from "@/lib/db/queries/mechanics";

interface MechanicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanic?: MechanicRow | null;
}

export function MechanicDialog({ open, onOpenChange, mechanic }: MechanicDialogProps) {
  const isEdit = !!mechanic;
  const boundAction = mechanic ? updateMechanic.bind(null, mechanic.id) : createMechanic;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Mechanic updated" : "Mechanic added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Wrench className="h-5 w-5 text-purple-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Mechanic" : "Add New Mechanic"}
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
              <Input id="firstName" name="firstName" defaultValue={mechanic?.firstName || ""} required className="border-border/40 bg-card/60" placeholder="Juan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last Name</Label>
              <Input id="lastName" name="lastName" defaultValue={mechanic?.lastName || ""} className="border-border/40 bg-card/60" placeholder="Dela Cruz" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nickName" className="text-xs">Nickname</Label>
              <Input id="nickName" name="nickName" defaultValue={mechanic?.nickName || ""} className="border-border/40 bg-card/60" placeholder="Jun" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primaryContact" className="text-xs">Contact Number</Label>
              <Input id="primaryContact" name="primaryContact" defaultValue={mechanic?.primaryContact || ""} className="border-border/40 bg-card/60" placeholder="09XX-XXX-XXXX" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Mechanic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
