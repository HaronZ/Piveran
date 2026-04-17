"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, ClipboardList, Package, Wrench, CreditCard,
  Plus, MoreHorizontal, Pencil, Trash2, Loader2, DollarSign,
  Clock, CheckCircle2, XCircle, Loader, User, Car, Calendar,
  Images, MessageSquare,
} from "lucide-react";
import { JoPhotosSection } from "@/components/jo-photos-section";
import { JoCommentsSection } from "@/components/jo-comments-section";
import { JoMaterialDetailsDialog } from "@/components/jo-material-details-dialog";
import { JoLaborDetailsDialog } from "@/components/jo-labor-details-dialog";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  addJoMaterial, updateJoMaterial, deleteJoMaterial,
  addJoLabor, updateJoLabor, deleteJoLabor,
  addJoPayment, updateJoPayment, deleteJoPayment,
} from "@/lib/actions/jo-detail";
import type {
  JoDetailRow, JoMaterialRow, JoLaborRow, JoPaymentRow,
  JoLaborMechanicRow, JoPhotoRow, JoCommentRow, LaborTypeRow,
  JoMaterialStatusRow, JoLaborStatusRow, CashierRow,
  JoMaterialPhotoRow, JoMaterialCommentRow,
  JoLaborPhotoRow, JoLaborCommentRow,
} from "@/lib/db/queries/jo-detail";
import type { PartOption } from "@/lib/db/queries/purchase-requests";
import type { MechanicSelectorRow } from "@/lib/db/queries/mechanics";

const STATUS_STYLES: Record<string, string> = {
  "Open": "bg-green-500/10 text-green-500 border-green-500/20",
  "In Progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Completed": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Cancelled": "bg-red-500/10 text-red-500 border-red-500/20",
};

function fmt(n: number | string | null | undefined) {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return `₱${Math.abs(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

type Tab = "materials" | "labors" | "payments" | "photos" | "comments";

interface JoDetailClientProps {
  jo: JoDetailRow;
  materials: JoMaterialRow[];
  labors: JoLaborRow[];
  payments: JoPaymentRow[];
  laborMechanics: JoLaborMechanicRow[];
  photos: JoPhotoRow[];
  comments: JoCommentRow[];
  materialPhotos: JoMaterialPhotoRow[];
  materialComments: JoMaterialCommentRow[];
  laborPhotos: JoLaborPhotoRow[];
  laborComments: JoLaborCommentRow[];
  parts: PartOption[];
  laborTypes: LaborTypeRow[];
  materialStatuses: JoMaterialStatusRow[];
  laborStatuses: JoLaborStatusRow[];
  cashiers: CashierRow[];
  mechanics: MechanicSelectorRow[];
}

export function JoDetailClient({
  jo,
  materials,
  labors,
  payments,
  laborMechanics,
  photos,
  comments,
  materialPhotos,
  materialComments,
  laborPhotos,
  laborComments,
  parts,
  laborTypes,
  materialStatuses,
  laborStatuses,
  cashiers,
  mechanics,
}: JoDetailClientProps) {
  const [tab, setTab] = useState<Tab>("materials");

  // KPI totals
  const totalMaterials = useMemo(
    () => materials.reduce((s, m) => s + (m.includeInTotal !== false ? parseFloat(m.finalPrice || "0") : 0), 0),
    [materials]
  );
  const totalLabor = useMemo(
    () => labors.reduce((s, l) => s + parseFloat(l.totalPrice || "0"), 0),
    [labors]
  );
  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + parseFloat(p.amountPaid || "0"), 0),
    [payments]
  );
  const grandTotal = totalMaterials + totalLabor;
  const discount = parseFloat(jo.discount || "0");
  const balanceDue = grandTotal - discount - totalPaid;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "materials", label: "Materials", icon: <Package className="h-4 w-4" />, count: materials.length },
    { key: "labors", label: "Labors", icon: <Wrench className="h-4 w-4" />, count: labors.length },
    { key: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />, count: payments.length },
    { key: "photos", label: "Photos", icon: <Images className="h-4 w-4" />, count: photos.length },
    { key: "comments", label: "Comments", icon: <MessageSquare className="h-4 w-4" />, count: comments.length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/job-orders">
            <Button variant="ghost" size="icon" className="h-9 w-9 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-orange-500">{jo.joNumber}</h1>
              {jo.statusName && (
                <Badge variant="secondary" className={`text-xs ${STATUS_STYLES[jo.statusName] || ""}`}>
                  {jo.statusName}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {jo.customerName && (
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{jo.customerName}</span>
              )}
              {jo.carLabel && (
                <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" />{jo.carLabel}</span>
              )}
              {jo.checkinDate && (
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />In: {fmtDate(jo.checkinDate)}</span>
              )}
              {jo.checkoutDate && (
                <span className="flex items-center gap-1">Out: {fmtDate(jo.checkoutDate)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Materials</p>
            <p className="text-lg font-bold text-blue-400 mt-1">{fmt(totalMaterials)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Labor</p>
            <p className="text-lg font-bold text-purple-400 mt-1">{fmt(totalLabor)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Grand Total</p>
            <p className="text-lg font-bold mt-1">{fmt(grandTotal)}</p>
            {discount > 0 && <p className="text-[10px] text-muted-foreground">-{fmt(discount)} disc</p>}
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total Paid</p>
            <p className="text-lg font-bold text-green-500 mt-1">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className={`border-border/40 backdrop-blur-md ${balanceDue > 0 ? "bg-red-500/5 border-red-500/30" : "bg-green-500/5 border-green-500/30"}`}>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Balance Due</p>
            <p className={`text-lg font-bold mt-1 ${balanceDue > 0 ? "text-red-500" : "text-green-500"}`}>
              {balanceDue <= 0 ? "PAID" : fmt(balanceDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/40">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{t.count}</Badge>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === "materials" && (
        <MaterialsTab
          joId={jo.id}
          materials={materials}
          materialPhotos={materialPhotos}
          materialComments={materialComments}
          parts={parts}
          statuses={materialStatuses}
        />
      )}
      {tab === "labors" && (
        <LaborsTab
          joId={jo.id}
          labors={labors}
          laborTypes={laborTypes}
          statuses={laborStatuses}
          laborMechanics={laborMechanics}
          laborPhotos={laborPhotos}
          laborComments={laborComments}
        />
      )}
      {tab === "payments" && (
        <PaymentsTab
          joId={jo.id}
          payments={payments}
          cashiers={cashiers}
        />
      )}
      {tab === "photos" && <JoPhotosSection joId={jo.id} photos={photos} />}
      {tab === "comments" && <JoCommentsSection joId={jo.id} comments={comments} />}
    </div>
  );
}

// ═══════════════════════════════════════
//  MATERIALS TAB
// ═══════════════════════════════════════
function MaterialsTab({
  joId, materials, materialPhotos, materialComments, parts, statuses,
}: {
  joId: string;
  materials: JoMaterialRow[];
  materialPhotos: JoMaterialPhotoRow[];
  materialComments: JoMaterialCommentRow[];
  parts: PartOption[];
  statuses: JoMaterialStatusRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<JoMaterialRow | null>(null);
  const [delItem, setDelItem] = useState<JoMaterialRow | null>(null);
  const [detailsItem, setDetailsItem] = useState<JoMaterialRow | null>(null);

  const photosByMat = useMemo(() => {
    const m = new Map<string, JoMaterialPhotoRow[]>();
    for (const p of materialPhotos) {
      const arr = m.get(p.joMaterialId) ?? [];
      arr.push(p);
      m.set(p.joMaterialId, arr);
    }
    return m;
  }, [materialPhotos]);

  const commentsByMat = useMemo(() => {
    const m = new Map<string, JoMaterialCommentRow[]>();
    for (const c of materialComments) {
      const arr = m.get(c.joMaterialId) ?? [];
      arr.push(c);
      m.set(c.joMaterialId, arr);
    }
    return m;
  }, [materialComments]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Part</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                No materials added
              </TableCell></TableRow>
            ) : (
              materials.map((m) => {
                const pCount = photosByMat.get(m.id)?.length ?? 0;
                const cCount = commentsByMat.get(m.id)?.length ?? 0;
                return (
                <TableRow key={m.id} className="border-border/40 hover:bg-orange-500/5">
                  <TableCell className="text-sm">
                    <div className="line-clamp-1 font-medium">{m.partName || "Unknown Part"}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.partNumber && <span className="text-[10px] text-muted-foreground font-mono">{m.partNumber}</span>}
                      {pCount > 0 && (
                        <span className="text-[10px] text-violet-500 flex items-center gap-0.5">
                          <Images className="h-3 w-3" />{pCount}
                        </span>
                      )}
                      {cCount > 0 && (
                        <span className="text-[10px] text-sky-500 flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" />{cCount}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">{fmt(m.price)}</TableCell>
                  <TableCell className="text-center text-sm">{m.quantity ?? 1}</TableCell>
                  <TableCell className="text-right text-sm font-mono font-semibold">{fmt(m.finalPrice)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {m.statusName && <Badge variant="secondary" className="text-[10px]">{m.statusName}</Badge>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setDetailsItem(m)}><FileText className="h-4 w-4 mr-2" />Photos & Comments</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditItem(m)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDelItem(m)} className="text-red-500 focus:text-red-500"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MaterialDialog open={addOpen} onOpenChange={setAddOpen} joId={joId} parts={parts} statuses={statuses} />
      {editItem && <MaterialDialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }} joId={joId} item={editItem} parts={parts} statuses={statuses} />}
      {delItem && <DeleteDialog open={!!delItem} onOpenChange={(o) => { if (!o) setDelItem(null); }} title="Delete Material" description={`Remove "${delItem.partName}"?`} onConfirm={async () => { await deleteJoMaterial(delItem.id, joId); }} />}
      {detailsItem && (
        <JoMaterialDetailsDialog
          open={!!detailsItem}
          onOpenChange={(o) => { if (!o) setDetailsItem(null); }}
          joId={joId}
          material={detailsItem}
          photos={photosByMat.get(detailsItem.id) ?? []}
          comments={commentsByMat.get(detailsItem.id) ?? []}
        />
      )}
    </div>
  );
}

function MaterialDialog({
  open, onOpenChange, joId, item, parts, statuses,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; joId: string;
  item?: JoMaterialRow; parts: PartOption[]; statuses: JoMaterialStatusRow[];
}) {
  const isEdit = !!item;
  const [partId, setPartId] = useState(item?.partId || "");
  const [statusId, setStatusId] = useState(item?.statusId?.toString() || "");
  const [partSearch, setPartSearch] = useState("");

  const boundAction = item
    ? updateJoMaterial.bind(null, item.id, joId)
    : addJoMaterial.bind(null, joId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) { toast.success(isEdit ? "Material updated" : "Material added"); onOpenChange(false); }
  }, [state?.success, onOpenChange, isEdit]);

  const filteredParts = useMemo(() => {
    if (!partSearch.trim()) return parts.slice(0, 50);
    const q = partSearch.toLowerCase();
    return parts.filter((p) => p.name.toLowerCase().includes(q) || (p.partNumber && p.partNumber.toLowerCase().includes(q))).slice(0, 50);
  }, [parts, partSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`mat-${item?.id || "new"}`} className="sm:max-w-[480px] border-border/40 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            {isEdit ? "Edit Material" : "Add Material"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">{state.error}</div>}

          <input type="hidden" name="partId" value={partId} />
          <div className="space-y-1.5">
            <Label className="text-xs">Part <span className="text-red-500">*</span></Label>
            <Input placeholder="Search parts..." value={partSearch} onChange={(e) => setPartSearch(e.target.value)} className="border-border/40 bg-card/60 mb-1" />
            <div className="max-h-[140px] overflow-y-auto rounded-md border border-border/40 bg-card/60">
              {filteredParts.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground text-center">No parts found</div>
              ) : (
                filteredParts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPartId(p.id); setPartSearch(p.name); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-500/10 transition-colors border-b border-border/20 last:border-0 ${partId === p.id ? "bg-orange-500/10 text-orange-500" : ""}`}
                  >
                    <div className="line-clamp-1 font-medium">{p.name}</div>
                    {p.partNumber && <div className="text-[10px] text-muted-foreground font-mono">{p.partNumber}</div>}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mat-price" className="text-xs">Price (₱)</Label>
              <Input id="mat-price" name="price" type="number" step="0.01" min="0" defaultValue={item?.price || ""} className="border-border/40 bg-card/60 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-qty" className="text-xs">Qty</Label>
              <Input id="mat-qty" name="quantity" type="number" min="1" defaultValue={item?.quantity || "1"} className="border-border/40 bg-card/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-disc" className="text-xs">Discount (₱)</Label>
              <Input id="mat-disc" name="discount" type="number" step="0.01" min="0" defaultValue={item?.discount || ""} className="border-border/40 bg-card/60 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <input type="hidden" name="statusId" value={statusId} />
            <Select value={statusId} onValueChange={(val) => { if (val) setStatusId(val); }}>
              <SelectTrigger className="border-border/40 bg-card/60"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                {statuses.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Textarea name="comment" defaultValue={item?.comment || ""} placeholder="Notes..." className="border-border/40 bg-card/60 min-h-[50px]" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-orange-600 to-amber-600">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════
//  LABORS TAB
// ═══════════════════════════════════════
function LaborsTab({
  joId, labors, laborTypes, statuses, laborMechanics, laborPhotos, laborComments,
}: {
  joId: string;
  labors: JoLaborRow[];
  laborTypes: LaborTypeRow[];
  statuses: JoLaborStatusRow[];
  laborMechanics: JoLaborMechanicRow[];
  laborPhotos: JoLaborPhotoRow[];
  laborComments: JoLaborCommentRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<JoLaborRow | null>(null);
  const [delItem, setDelItem] = useState<JoLaborRow | null>(null);
  const [detailsItem, setDetailsItem] = useState<JoLaborRow | null>(null);

  const photosByLabor = useMemo(() => {
    const m = new Map<string, JoLaborPhotoRow[]>();
    for (const p of laborPhotos) {
      const arr = m.get(p.joLaborId) ?? [];
      arr.push(p);
      m.set(p.joLaborId, arr);
    }
    return m;
  }, [laborPhotos]);

  const commentsByLabor = useMemo(() => {
    const m = new Map<string, JoLaborCommentRow[]>();
    for (const c of laborComments) {
      const arr = m.get(c.joLaborId) ?? [];
      arr.push(c);
      m.set(c.joLaborId, arr);
    }
    return m;
  }, [laborComments]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Labor
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Mechanics</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {labors.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                No labor entries
              </TableCell></TableRow>
            ) : (
              labors.map((l) => {
                const mechs = laborMechanics.filter((m) => m.joLaborId === l.id);
                const pCount = photosByLabor.get(l.id)?.length ?? 0;
                const cCount = commentsByLabor.get(l.id)?.length ?? 0;
                return (
                  <TableRow key={l.id} className="border-border/40 hover:bg-orange-500/5">
                    <TableCell className="text-sm">
                      <div className="font-medium">{l.laborTypeName || "Custom"}</div>
                      {(pCount > 0 || cCount > 0) && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {pCount > 0 && (
                            <span className="text-[10px] text-violet-500 flex items-center gap-0.5">
                              <Images className="h-3 w-3" />{pCount}
                            </span>
                          )}
                          {cCount > 0 && (
                            <span className="text-[10px] text-sky-500 flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3" />{cCount}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">{fmt(l.price)}</TableCell>
                    <TableCell className="text-right text-sm font-mono text-muted-foreground">{l.discount && parseFloat(l.discount) > 0 ? fmt(l.discount) : "—"}</TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold">{fmt(l.totalPrice)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {l.statusName && <Badge variant="secondary" className="text-[10px]">{l.statusName}</Badge>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {mechs.length > 0 ? mechs.map((m) => m.mechanicName).join(", ") : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => setDetailsItem(l)}><FileText className="h-4 w-4 mr-2" />Photos & Comments</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditItem(l)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDelItem(l)} className="text-red-500 focus:text-red-500"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <LaborDialog open={addOpen} onOpenChange={setAddOpen} joId={joId} laborTypes={laborTypes} statuses={statuses} />
      {editItem && <LaborDialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }} joId={joId} item={editItem} laborTypes={laborTypes} statuses={statuses} />}
      {delItem && <DeleteDialog open={!!delItem} onOpenChange={(o) => { if (!o) setDelItem(null); }} title="Delete Labor" description={`Remove "${delItem.laborTypeName}"?`} onConfirm={async () => { await deleteJoLabor(delItem.id, joId); }} />}
      {detailsItem && (
        <JoLaborDetailsDialog
          open={!!detailsItem}
          onOpenChange={(o) => { if (!o) setDetailsItem(null); }}
          joId={joId}
          labor={detailsItem}
          photos={photosByLabor.get(detailsItem.id) ?? []}
          comments={commentsByLabor.get(detailsItem.id) ?? []}
        />
      )}
    </div>
  );
}

function LaborDialog({
  open, onOpenChange, joId, item, laborTypes, statuses,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; joId: string;
  item?: JoLaborRow; laborTypes: LaborTypeRow[]; statuses: JoLaborStatusRow[];
}) {
  const isEdit = !!item;
  const [laborTypeId, setLaborTypeId] = useState(item?.laborTypeId || "");
  const [statusId, setStatusId] = useState(item?.statusId?.toString() || "");
  const [price, setPrice] = useState(item?.price || "");

  const boundAction = item
    ? updateJoLabor.bind(null, item.id, joId)
    : addJoLabor.bind(null, joId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) { toast.success(isEdit ? "Labor updated" : "Labor added"); onOpenChange(false); }
  }, [state?.success, onOpenChange, isEdit]);

  // Auto-fill price when selecting labor type
  function handleLaborTypeChange(val: string) {
    setLaborTypeId(val);
    const lt = laborTypes.find((l) => l.id === val);
    if (lt?.defaultPrice && !price) setPrice(lt.defaultPrice);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`lab-${item?.id || "new"}`} className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-400" />
            {isEdit ? "Edit Labor" : "Add Labor"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">{state.error}</div>}

          <input type="hidden" name="laborTypeId" value={laborTypeId} />
          <div className="space-y-1.5">
            <Label className="text-xs">Service Type <span className="text-red-500">*</span></Label>
            <Select value={laborTypeId} onValueChange={(val) => { if (val) handleLaborTypeChange(val); }}>
              <SelectTrigger className="border-border/40 bg-card/60"><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl max-h-[200px]">
                {laborTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    {lt.name}
                    {lt.defaultPrice && <span className="text-muted-foreground ml-2">({fmt(lt.defaultPrice)})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lab-price" className="text-xs">Price (₱)</Label>
              <Input id="lab-price" name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="border-border/40 bg-card/60 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-disc" className="text-xs">Discount (₱)</Label>
              <Input id="lab-disc" name="discount" type="number" step="0.01" min="0" defaultValue={item?.discount || ""} className="border-border/40 bg-card/60 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <input type="hidden" name="statusId" value={statusId} />
              <Select value={statusId} onValueChange={(val) => { if (val) setStatusId(val); }}>
                <SelectTrigger className="border-border/40 bg-card/60"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                  {statuses.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-date" className="text-xs">Target Date</Label>
              <Input id="lab-date" name="targetDate" type="date" defaultValue={item?.targetDate || ""} className="border-border/40 bg-card/60" />
            </div>
          </div>

          <Textarea name="comment" defaultValue={item?.comment || ""} placeholder="Notes..." className="border-border/40 bg-card/60 min-h-[50px]" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-orange-600 to-amber-600">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════
//  PAYMENTS TAB
// ═══════════════════════════════════════
function PaymentsTab({
  joId, payments, cashiers,
}: {
  joId: string;
  payments: JoPaymentRow[];
  cashiers: CashierRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<JoPaymentRow | null>(null);
  const [delItem, setDelItem] = useState<JoPaymentRow | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
          <Plus className="h-3.5 w-3.5 mr-1" /> Record Payment
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead>OR #</TableHead>
              <TableHead>SI #</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="hidden sm:table-cell">Cashier</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                No payments recorded
              </TableCell></TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="border-border/40 hover:bg-orange-500/5">
                  <TableCell className="text-sm font-mono">{p.orNumber || "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{p.siNumber || "—"}</TableCell>
                  <TableCell className="text-right text-sm font-mono font-semibold text-green-500">{fmt(p.amountPaid)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(p.datePaid)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.cashierName || "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-border/40 bg-card/95 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setEditItem(p)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDelItem(p)} className="text-red-500 focus:text-red-500"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentDialog open={addOpen} onOpenChange={setAddOpen} joId={joId} cashiers={cashiers} />
      {editItem && <PaymentDialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }} joId={joId} item={editItem} cashiers={cashiers} />}
      {delItem && <DeleteDialog open={!!delItem} onOpenChange={(o) => { if (!o) setDelItem(null); }} title="Delete Payment" description={`Remove payment of ${fmt(delItem.amountPaid)}?`} onConfirm={async () => { await deleteJoPayment(delItem.id, joId); }} />}
    </div>
  );
}

function PaymentDialog({
  open, onOpenChange, joId, item, cashiers,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; joId: string;
  item?: JoPaymentRow; cashiers: CashierRow[];
}) {
  const isEdit = !!item;
  const today = new Date().toISOString().slice(0, 10);
  const [cashierId, setCashierId] = useState(item?.cashierId || "");

  const boundAction = item
    ? updateJoPayment.bind(null, item.id, joId)
    : addJoPayment.bind(null, joId);
  const [state, formAction, isPending] = useActionState(boundAction, {});

  useEffect(() => {
    if (state?.success) { toast.success(isEdit ? "Payment updated" : "Payment recorded"); onOpenChange(false); }
  }, [state?.success, onOpenChange, isEdit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`pay-${item?.id || "new"}`} className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            {isEdit ? "Edit Payment" : "Record Payment"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 mt-2">
          {state?.error && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-500">{state.error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-or" className="text-xs">OR Number</Label>
              <Input id="pay-or" name="orNumber" defaultValue={item?.orNumber || ""} className="border-border/40 bg-card/60 font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-si" className="text-xs">SI Number</Label>
              <Input id="pay-si" name="siNumber" defaultValue={item?.siNumber || ""} className="border-border/40 bg-card/60 font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amt" className="text-xs">Amount (₱) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-mono">₱</span>
              <Input id="pay-amt" name="amountPaid" type="number" step="0.01" min="0" defaultValue={item?.amountPaid || ""} required className="border-border/40 bg-card/60 font-mono text-lg pl-7 text-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-date" className="text-xs">Date Paid</Label>
              <Input id="pay-date" name="datePaid" type="date" defaultValue={item?.datePaid || today} max={today} className="border-border/40 bg-card/60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cashier</Label>
              <input type="hidden" name="cashierId" value={cashierId} />
              <Select value={cashierId} onValueChange={(val) => { if (val) setCashierId(val); }}>
                <SelectTrigger className="border-border/40 bg-card/60"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="border-border/40 bg-card/95 backdrop-blur-xl">
                  {cashiers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea name="comment" defaultValue={item?.comment || ""} placeholder="Notes..." className="border-border/40 bg-card/60 min-h-[50px]" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-orange-600 to-amber-600">
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save" : "Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
