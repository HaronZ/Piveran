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
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createSkill, updateSkill } from "@/lib/actions/skills";
import type { SkillRow } from "@/lib/db/queries/skills";

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillItem?: SkillRow | null;
}

export function SkillDialog({ open, onOpenChange, skillItem }: SkillDialogProps) {
  const isEdit = !!skillItem;
  const boundAction = skillItem ? updateSkill.bind(null, skillItem.id) : createSkill;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Skill updated" : "Skill added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Skill" : "Add New Skill"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <FormError message={state?.error} />

          <div className="space-y-1.5">
            <Label htmlFor="skill" className="text-xs">
              Skill Name <span className="text-red-500">*</span>
            </Label>
            <Input id="skill" name="skill" defaultValue={skillItem?.skill || ""} required className="border-border/40 bg-card/60" placeholder="Welding" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea id="description" name="description" defaultValue={skillItem?.description || ""} className="border-border/40 bg-card/60 min-h-20" placeholder="What this skill covers..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
