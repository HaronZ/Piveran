"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  Plus, Phone, MapPin, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addContact, deleteContact,
  addAddress, deleteAddress,
} from "@/lib/actions/customers";

interface ContactItem { id: string; contactNumber: string }
interface AddressItem {
  id: string;
  street: string | null;
  village: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  zipCode: string | null;
}

interface CustomerDetailClientProps {
  customerId: string;
  contacts: ContactItem[];
  addresses: AddressItem[];
}

export function CustomerDetailClient({ customerId, contacts, addresses }: CustomerDetailClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ContactsSection customerId={customerId} contacts={contacts} />
      <AddressesSection customerId={customerId} addresses={addresses} />
    </div>
  );
}

// ═══════════════════════════════════════
//  CONTACTS SECTION
// ═══════════════════════════════════════
function ContactsSection({ customerId, contacts }: { customerId: string; contacts: ContactItem[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [delItem, setDelItem] = useState<ContactItem | null>(null);

  async function handleAdd() {
    if (!newNumber.trim()) return;
    setPending(true);
    const result = await addContact(customerId, newNumber);
    setPending(false);
    if (result.success) {
      toast.success("Contact added");
      setNewNumber("");
      setAddOpen(false);
    } else {
      toast.error(result.error || "Failed");
    }
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4 text-blue-500" />
            Contacts
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
              {contacts.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No additional contacts
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-2 group"
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{c.contactNumber}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => setDelItem(c)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Contact Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[360px] border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-400" />
                Add Contact Number
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="e.g. 09171234567"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="border-border/40 bg-card/60"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleAdd}
                  disabled={!newNumber.trim() || pending}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Add Contact
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        {delItem && (
          <DeleteDialog
            open={!!delItem}
            onOpenChange={(o) => { if (!o) setDelItem(null); }}
            title="Remove Contact"
            description={`Remove "${delItem.contactNumber}" from this customer?`}
            onConfirm={async () => { await deleteContact(delItem.id, customerId); }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
//  ADDRESSES SECTION
// ═══════════════════════════════════════
function AddressesSection({ customerId, addresses }: { customerId: string; addresses: AddressItem[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [delItem, setDelItem] = useState<AddressItem | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await addAddress(customerId, formData);
    setPending(false);
    if (result.success) {
      toast.success("Address added");
      setAddOpen(false);
    } else {
      toast.error(result.error || "Failed");
    }
  }

  function formatAddr(a: AddressItem) {
    return [a.street, a.village, a.barangay, a.city, a.province, a.zipCode]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-500" />
            Addresses
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-500 border-teal-500/20 text-[10px]">
              {addresses.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No addresses on file
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between rounded-lg border border-border/40 bg-card/40 px-3 py-2 group"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm">{formatAddr(a)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                  onClick={() => setDelItem(a)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Address Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-400" />
                Add Address
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Street</Label>
                  <Input name="street" className="border-border/40 bg-card/60" placeholder="123 Main St" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Village / Subdivision</Label>
                  <Input name="village" className="border-border/40 bg-card/60" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Barangay</Label>
                  <Input name="barangay" className="border-border/40 bg-card/60" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input name="city" className="border-border/40 bg-card/60" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Province</Label>
                  <Input name="province" className="border-border/40 bg-card/60" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zip Code</Label>
                  <Input name="zipCode" className="border-border/40 bg-card/60" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600"
                >
                  {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Add Address
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        {delItem && (
          <DeleteDialog
            open={!!delItem}
            onOpenChange={(o) => { if (!o) setDelItem(null); }}
            title="Remove Address"
            description={`Remove this address from this customer?`}
            onConfirm={async () => { await deleteAddress(delItem.id, customerId); }}
          />
        )}
      </CardContent>
    </Card>
  );
}
