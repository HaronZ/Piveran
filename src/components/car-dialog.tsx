"use client";

import { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Car } from "lucide-react";
import { toast } from "sonner";
import { createCar, updateCar } from "@/lib/actions/cars";
import type { CarRow } from "@/lib/db/queries/cars";
import type { CustomerSelectorRow } from "@/lib/db/queries/customers";

interface CarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: CarRow | null;
  customers: CustomerSelectorRow[];
  defaultOwnerId?: string;
}

export function CarDialog({
  open,
  onOpenChange,
  car,
  customers,
  defaultOwnerId,
}: CarDialogProps) {
  const isEdit = !!car;

  const boundAction = car ? updateCar.bind(null, car.id) : createCar;

  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Car updated" : "Car added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
              <Car className="h-5 w-5 text-teal-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Car" : "Add New Car"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="make" className="text-xs">Make</Label>
              <Input
                id="make"
                name="make"
                defaultValue={car?.make || ""}
                className="border-border/40 bg-card/60"
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs">Model</Label>
              <Input
                id="model"
                name="model"
                defaultValue={car?.model || ""}
                className="border-border/40 bg-card/60"
                placeholder="Vios"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-xs">Year</Label>
              <Input
                id="year"
                name="year"
                defaultValue={car?.year || ""}
                className="border-border/40 bg-card/60"
                placeholder="2024"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs">Color</Label>
              <Input
                id="color"
                name="color"
                defaultValue={car?.color || ""}
                className="border-border/40 bg-card/60"
                placeholder="White"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plateNumber" className="text-xs">Plate Number</Label>
              <Input
                id="plateNumber"
                name="plateNumber"
                defaultValue={car?.plateNumber || ""}
                className="border-border/40 bg-card/60"
                placeholder="ABC 1234"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryOwnerId" className="text-xs">Owner</Label>
            <Select
              name="primaryOwnerId"
              defaultValue={car?.ownerId || defaultOwnerId || ""}
            >
              <SelectTrigger className="border-border/40 bg-card/60">
                <SelectValue placeholder="Select owner (optional)" />
              </SelectTrigger>
              <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Car"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
