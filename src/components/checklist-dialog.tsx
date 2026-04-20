"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { createChecklist, updateChecklist } from "@/lib/actions/checklists";
import type { ChecklistRow } from "@/lib/db/queries/checklists";

interface ChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist?: ChecklistRow | null;
}

export function ChecklistDialog({ open, onOpenChange, checklist }: ChecklistDialogProps) {
  const isEdit = !!checklist;
  const boundAction = checklist ? updateChecklist.bind(null, checklist.id) : createChecklist;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Checklist updated" : "Checklist added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <ClipboardCheck className="h-5 w-5 text-cyan-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Checklist" : "Add New Checklist"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <FormError message={state?.error} />

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" name="name" defaultValue={checklist?.name || ""} required className="border-border/40 bg-card/60" placeholder="Final Inspection" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea id="description" name="description" defaultValue={checklist?.description || ""} className="border-border/40 bg-card/60 min-h-20" placeholder="What to verify before releasing the vehicle..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Checklist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
