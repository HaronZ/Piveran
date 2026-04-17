"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { FormError } from "@/components/form-error";
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
import { Loader2, ClipboardList, Users, Car, Calendar, MessageSquare } from "lucide-react";
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

  const today = new Date().toISOString().slice(0, 10);

  const [customerId, setCustomerId] = useState(jobOrder?.customerId || "");
  const [carId, setCarId] = useState(jobOrder?.carId || "");
  const [statusId, setStatusId] = useState(jobOrder?.statusId?.toString() || "");
  const [checkinDate, setCheckinDate] = useState(toDateLocal(jobOrder?.checkinDate || null) || (isEdit ? "" : today));
  const [checkoutDate, setCheckoutDate] = useState(toDateLocal(jobOrder?.checkoutDate || null) || "");

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
  const selectedCar = cars.find((c) => c.id === carId);
  const selectedCarName = selectedCar
    ? [selectedCar.make, selectedCar.model, selectedCar.plateNumber].filter(Boolean).join(" ")
    : null;
  const selectedStatusName = statuses.find((s) => s.id.toString() === statusId)?.status;

  function toDateLocal(d: string | null) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`jo-${jobOrder?.id || "new"}`} className="sm:max-w-[560px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <ClipboardList className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Job Order" : "New Job Order"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "Update the job order details below" : "Fill in the details to create a new service order"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-3">
          <FormError message={state?.error} />

          {/* ── Section 1: Order Info ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              Order Information
            </div>
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
                      {selectedStatusName ? (
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            selectedStatusName === "Open" ? "bg-green-500" :
                            selectedStatusName === "In Progress" ? "bg-amber-500" :
                            selectedStatusName === "Completed" ? "bg-blue-500" :
                            "bg-red-500"
                          }`} />
                          {selectedStatusName}
                        </span>
                      ) : "Select status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            s.status === "Open" ? "bg-green-500" :
                            s.status === "In Progress" ? "bg-amber-500" :
                            s.status === "Completed" ? "bg-blue-500" :
                            "bg-red-500"
                          }`} />
                          {s.status}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* ── Section 2: Customer & Car ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Users className="h-4 w-4" />
              Customer & Vehicle
            </div>
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
                <Label className="text-xs">
                  Car
                  {customerId && <span className="text-muted-foreground ml-1">(filtered)</span>}
                </Label>
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
                        <span className="flex items-center gap-2">
                          <Car className="h-3 w-3 text-teal-500 shrink-0" />
                          {[c.make, c.model, c.plateNumber].filter(Boolean).join(" ") || "Unknown"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {customerId && (
              <p className="text-[10px] text-muted-foreground">
                💡 Car list is filtered to show vehicles owned by this customer + unlinked cars
              </p>
            )}
          </div>

          <Separator className="border-border/30" />

          {/* ── Section 3: Schedule ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Schedule
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="checkinDate" className="text-xs">Check-in Date</Label>
                <Input
                  id="checkinDate"
                  name="checkinDate"
                  type="date"
                  value={checkinDate}
                  min={isEdit ? undefined : today}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCheckinDate(val);
                    // If checkout is before new checkin, reset it
                    if (checkoutDate && val && checkoutDate < val) {
                      setCheckoutDate(val);
                    }
                  }}
                  className="border-border/40 bg-card/60"
                />
                {!isEdit && (
                  <p className="text-[10px] text-muted-foreground">📅 Defaults to today</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkoutDate" className="text-xs">Check-out Date</Label>
                <Input
                  id="checkoutDate"
                  name="checkoutDate"
                  type="date"
                  value={checkoutDate}
                  min={checkinDate || today}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="border-border/40 bg-card/60"
                />
                <p className="text-[10px] text-muted-foreground">
                  {checkinDate ? `📅 Must be on or after ${new Date(checkinDate + "T00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}` : "📅 Set check-in first"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="border-border/30" />

          {/* ── Section 4: Additional ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Additional Details
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discount" className="text-xs">Discount (₱)</Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-mono">₱</span>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={jobOrder?.discount || ""}
                  className="border-border/40 bg-card/60 font-mono pl-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment" className="text-xs">Comment / Notes</Label>
              <Textarea
                id="comment"
                name="comment"
                defaultValue={jobOrder?.comment || ""}
                className="border-border/40 bg-card/60 min-h-[70px]"
                placeholder="Notes about this job order..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
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
