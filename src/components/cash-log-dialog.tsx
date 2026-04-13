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
import { Loader2, DollarSign, Tag, MessageSquare, TrendingUp, TrendingDown, Info } from "lucide-react";
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

  // Determine if selected action is Cash In
  const isCashIn = selectedActionName
    ? selectedActionName.toLowerCase().includes("in") ||
      selectedActionName.toLowerCase().includes("revenue") ||
      selectedActionName.toLowerCase().includes("income")
    : null;

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

          {/* ── Section 1: Transaction ── */}
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
                  max={today}
                  required
                  className="border-border/40 bg-card/60"
                />
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Info className="h-2.5 w-2.5" /> Today or earlier
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Action <span className="text-red-500">*</span>
                </Label>
                <input type="hidden" name="actionId" value={actionId} />
                <Select value={actionId} onValueChange={(val) => setActionId(val as string ?? "")}>
                  <SelectTrigger className="border-border/40 bg-card/60">
                    <SelectValue placeholder="Cash In / Out">
                      {selectedActionName ? (
                        <span className="flex items-center gap-2">
                          {isCashIn ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          {selectedActionName}
                        </span>
                      ) : "Cash In / Out"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {actions.map((a) => {
                      const isIn = a.action.toLowerCase().includes("in") ||
                        a.action.toLowerCase().includes("revenue") ||
                        a.action.toLowerCase().includes("income");
                      return (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${isIn ? "bg-green-500" : "bg-red-500"}`} />
                            {a.action}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount with visual indicator */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs">
                Amount (₱) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-mono">₱</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={entry?.amount || ""}
                  required
                  className={`border-border/40 bg-card/60 font-mono text-lg pl-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    isCashIn === true ? "text-green-500" : isCashIn === false ? "text-red-500" : ""
                  }`}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* ── Section 2: Category ── */}
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

          {/* ── Section 3: Notes ── */}
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
