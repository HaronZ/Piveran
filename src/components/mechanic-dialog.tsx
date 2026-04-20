"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wrench, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createMechanic, updateMechanic } from "@/lib/actions/mechanics";
import type { MechanicRow } from "@/lib/db/queries/mechanics";
import type { SkillSelectorRow } from "@/lib/db/queries/skills";

interface MechanicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanic?: MechanicRow | null;
  allSkills: SkillSelectorRow[];
}

export function MechanicDialog({ open, onOpenChange, mechanic, allSkills }: MechanicDialogProps) {
  const isEdit = !!mechanic;
  const boundAction = mechanic ? updateMechanic.bind(null, mechanic.id) : createMechanic;
  const [state, formAction, isPending] = useActionState(boundAction, {});
  const assignedIds = new Set((mechanic?.skills ?? []).map((s) => s.id));

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Mechanic updated" : "Mechanic added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl">
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

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Skills
            </Label>
            {allSkills.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No skills defined yet. Create skills in <span className="text-amber-500">Dashboard → Skills</span> first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border border-border/40 bg-card/40 p-3">
                {allSkills.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:text-amber-500 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name={`skill_${s.id}`}
                      defaultChecked={assignedIds.has(s.id)}
                      className="h-3.5 w-3.5 accent-amber-500"
                    />
                    <span className="truncate">{s.skill}</span>
                  </label>
                ))}
              </div>
            )}
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
