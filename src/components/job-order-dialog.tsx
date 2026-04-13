"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { createJobOrder, updateJobOrder } from "@/lib/actions/job-orders";
import type { JobOrderRow, JoStatusRow } from "@/lib/db/queries/job-orders";
import type { CustomerSelectorRow } from "@/lib/db/queries/customers";
import type { CarRow } from "@/lib/db/queries/cars";

interface JobOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder?: JobOrderRow | null;
  statuses: JoStatusRow[];
  customers: CustomerSelectorRow[];
  cars: CarRow[];
}

export function JobOrderDialog({
  open,
  onOpenChange,
  jobOrder,
  statuses,
  customers,
  cars,
}: JobOrderDialogProps) {
  const isEdit = !!jobOrder;

  const [customerId, setCustomerId] = useState(jobOrder?.customerId || "");
  const [carId, setCarId] = useState(jobOrder?.carId || "");
  const [statusId, setStatusId] = useState(jobOrder?.statusId?.toString() || "");

  // Reset when dialog opens with different JO
  useEffect(() => {
    setCustomerId(jobOrder?.customerId || "");
    setCarId(jobOrder?.carId || "");
    setStatusId(jobOrder?.statusId?.toString() || "");
  }, [jobOrder, open]);

  const boundAction = jobOrder ? updateJobOrder.bind(null, jobOrder.id) : createJobOrder;
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Job order updated" : "Job order created");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  // Filter cars by selected customer
  const filteredCars = useMemo(() => {
    if (!customerId) return cars;
    return cars.filter((c) => c.ownerId === customerId || !c.ownerId);
  }, [cars, customerId]);

  const selectedCustomerName = customers.find((c) => c.id === customerId)?.name;
  const selectedCarLabel = cars.find((c) => c.id === carId);
  const selectedCarName = selectedCarLabel
    ? [selectedCarLabel.make, selectedCarLabel.model, selectedCarLabel.plateNumber].filter(Boolean).join(" ")
    : null;
  const selectedStatusName = statuses.find((s) => s.id.toString() === statusId)?.status;

  // Format date for input[type=datetime-local]
  function toDateTimeLocal(d: string | null) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 16);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <ClipboardList className="h-5 w-5 text-orange-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Job Order" : "New Job Order"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          {/* JO Number + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="joNumber" className="text-xs">
                JO Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="joNumber"
                name="joNumber"
                defaultValue={jobOrder?.joNumber || ""}
                required
                className="border-border/40 bg-card/60 font-mono"
                placeholder="JO-2024-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <input type="hidden" name="statusId" value={statusId} />
              <Select value={statusId} onValueChange={(val) => setStatusId(val as string ?? "")}>
                <SelectTrigger className="border-border/40 bg-card/60">
                  <SelectValue placeholder="Select status">
                    {selectedStatusName || "Select status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer + Car */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Customer</Label>
              <input type="hidden" name="customerId" value={customerId} />
              <Select value={customerId} onValueChange={(val) => { setCustomerId(val as string ?? ""); setCarId(""); }}>
                <SelectTrigger className="border-border/40 bg-card/60">
                  <SelectValue placeholder="Select customer">
                    {selectedCustomerName || "Select customer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Car</Label>
              <input type="hidden" name="carId" value={carId} />
              <Select value={carId} onValueChange={(val) => setCarId(val as string ?? "")}>
                <SelectTrigger className="border-border/40 bg-card/60">
                  <SelectValue placeholder="Select car">
                    {selectedCarName || "Select car"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                  {filteredCars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {[c.make, c.model, c.plateNumber].filter(Boolean).join(" ") || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkinDate" className="text-xs">Check-in Date</Label>
              <Input
                id="checkinDate"
                name="checkinDate"
                type="datetime-local"
                defaultValue={toDateTimeLocal(jobOrder?.checkinDate || null)}
                className="border-border/40 bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkoutDate" className="text-xs">Check-out Date</Label>
              <Input
                id="checkoutDate"
                name="checkoutDate"
                type="datetime-local"
                defaultValue={toDateTimeLocal(jobOrder?.checkoutDate || null)}
                className="border-border/40 bg-card/60"
              />
            </div>
          </div>

          {/* Discount + Comment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount" className="text-xs">Discount (₱)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                step="0.01"
                defaultValue={jobOrder?.discount || ""}
                className="border-border/40 bg-card/60"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-xs">Comment</Label>
            <Textarea
              id="comment"
              name="comment"
              defaultValue={jobOrder?.comment || ""}
              className="border-border/40 bg-card/60 min-h-[60px]"
              placeholder="Notes about this job order..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Job Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
