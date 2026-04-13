"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, Tag, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { createCashEntry, updateCashEntry } from "@/lib/actions/cash-log";
import type { CashLogRow, CashActionRow, ExpenseTypeRow, OpexTypeRow } from "@/lib/db/queries/cash-log";

interface CashLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: CashLogRow | null;
  actions: CashActionRow[];
  expenseTypes: ExpenseTypeRow[];
  opexTypes: OpexTypeRow[];
}

export function CashLogDialog({
  open,
  onOpenChange,
  entry,
  actions,
  expenseTypes,
  opexTypes,
}: CashLogDialogProps) {
  const isEdit = !!entry;
  const today = new Date().toISOString().slice(0, 10);

  const [actionId, setActionId] = useState(entry?.actionId?.toString() || "");
  const [expenseTypeId, setExpenseTypeId] = useState(entry?.expenseTypeId?.toString() || "");
  const [opexTypeId, setOpexTypeId] = useState(entry?.opexTypeId?.toString() || "");

  const boundAction = entry ? updateCashEntry.bind(null, entry.id) : createCashEntry;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Entry updated" : "Entry added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  const selectedActionName = actions.find((a) => a.id.toString() === actionId)?.action;
  const selectedExpenseName = expenseTypes.find((e) => e.id.toString() === expenseTypeId)?.name;
  const selectedOpexName = opexTypes.find((o) => o.id.toString() === opexTypeId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`cl-${entry?.id || "new"}`} className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Cash Entry" : "New Cash Entry"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "Update the entry details" : "Record a new cash transaction"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-3">
          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          {/* Date + Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Transaction
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={entry?.date || today}
                  required
                  className="border-border/40 bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Action <span className="text-red-500">*</span>
                </Label>
                <input type="hidden" name="actionId" value={actionId} />
                <Select value={actionId} onValueChange={(val) => setActionId(val as string ?? "")}>
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Cash In / Out">
                      {selectedActionName || "Cash In / Out"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {actions.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs">
                Amount (₱) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={entry?.amount || ""}
                required
                className="border-border/40 bg-card/60 font-mono text-lg"
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* Category */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Tag className="h-4 w-4" />
              Category (Optional)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Expense Type</Label>
                <input type="hidden" name="expenseTypeId" value={expenseTypeId} />
                <Select value={expenseTypeId} onValueChange={(val) => setExpenseTypeId(val as string ?? "")}>
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Select type">
                      {selectedExpenseName || "Select type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                    {expenseTypes.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OPEX Type</Label>
                <input type="hidden" name="opexTypeId" value={opexTypeId} />
                <Select value={opexTypeId} onValueChange={(val) => setOpexTypeId(val as string ?? "")}>
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Select type">
                      {selectedOpexName || "Select type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                    {opexTypes.map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* Comment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Notes
            </div>
            <Textarea
              name="comment"
              defaultValue={entry?.comment || ""}
              className="border-border/40 bg-card/60 min-h-[60px]"
              placeholder="Description of this transaction..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
