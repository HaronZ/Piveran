"use client";

import { useActionState, useEffect } from "react";
import { FormError } from "@/components/form-error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import type { CustomerRow } from "@/lib/db/queries/customers";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerRow | null;
  defaultAddress?: {
    street?: string;
    village?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  defaultAddress,
}: CustomerDialogProps) {
  const isEdit = !!customer;

  const boundAction = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer;

  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Customer updated" : "Customer added");
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <FormError message={state?.error} />

          {/* Name Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={customer?.firstName || ""}
                required
                className="border-border/40 bg-card/60"
                placeholder="Juan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={customer?.lastName || ""}
                className="border-border/40 bg-card/60"
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="middleName" className="text-xs">Middle Name</Label>
              <Input
                id="middleName"
                name="middleName"
                defaultValue={customer?.middleName || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nickName" className="text-xs">Nickname</Label>
              <Input
                id="nickName"
                name="nickName"
                defaultValue={customer?.nickName || ""}
                className="border-border/40 bg-card/60"
                placeholder="Jun"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suffix" className="text-xs">Suffix</Label>
              <Input
                id="suffix"
                name="suffix"
                defaultValue={customer?.suffix || ""}
                className="border-border/40 bg-card/60"
                placeholder="Jr./Sr./III"
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="primaryContact" className="text-xs">Contact Number</Label>
              <Input
                id="primaryContact"
                name="primaryContact"
                defaultValue={customer?.primaryContact || ""}
                className="border-border/40 bg-card/60"
                placeholder="09XX-XXX-XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email || ""}
                className="border-border/40 bg-card/60"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="birthday" className="text-xs">Birthday</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={customer?.birthday || ""}
              className="border-border/40 bg-card/60"
            />
          </div>

          {/* Address Section */}
          <Separator className="border-border/30" />
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Address
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-xs">Street</Label>
              <Input
                id="street"
                name="street"
                defaultValue={defaultAddress?.street || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="village" className="text-xs">Village / Subdivision</Label>
              <Input
                id="village"
                name="village"
                defaultValue={defaultAddress?.village || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="barangay" className="text-xs">Barangay</Label>
              <Input
                id="barangay"
                name="barangay"
                defaultValue={defaultAddress?.barangay || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs">City / Municipality</Label>
              <Input
                id="city"
                name="city"
                defaultValue={defaultAddress?.city || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="province" className="text-xs">Province</Label>
              <Input
                id="province"
                name="province"
                defaultValue={defaultAddress?.province || ""}
                className="border-border/40 bg-card/60"
              />
            </div>
          </div>

          <div className="w-1/3 space-y-1.5">
            <Label htmlFor="zipCode" className="text-xs">Zip Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              defaultValue={defaultAddress?.zipCode || ""}
              className="border-border/40 bg-card/60"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
