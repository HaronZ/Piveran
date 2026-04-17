"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { inventoryLog } from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/actions";

const stockLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  partId: z.string().uuid("Part is required"),
  actionId: z.coerce.number().int().min(1, "Action is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitId: z.coerce.number().int().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  vendorId: z.string().uuid().optional().or(z.literal("")),
  salesTypeId: z.coerce.number().int().optional(),
  paymentTypeId: z.coerce.number().int().optional(),
  payableDueDate: z.string().optional(),
  comments: z.string().optional(),
  addStockLink: z.string().optional(),
});

export type StockLogFormState = {
  error?: string;
  success?: boolean;
};

function revalidateAll() {
  revalidatePath("/dashboard/stock-log");
  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard");
}

export async function createStockLog(
  _prev: StockLogFormState,
  formData: FormData
): Promise<StockLogFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = stockLogSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const d = parsed.data;
  const total = d.quantity * (d.unitPrice ?? 0);

  try {
    const userId = await requireUserId();
    await db.insert(inventoryLog).values({
      date: new Date(d.date),
      partId: d.partId,
      actionId: d.actionId,
      quantity: d.quantity,
      unitId: d.unitId || null,
      unitPrice: d.unitPrice != null ? d.unitPrice.toFixed(2) : null,
      totalPrice: total > 0 ? total.toFixed(2) : null,
      vendorId: d.vendorId || null,
      salesTypeId: d.salesTypeId || null,
      paymentTypeId: d.paymentTypeId || null,
      payableDueDate: d.payableDueDate || null,
      comments: d.comments || null,
      addStockLink: d.addStockLink || null,
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e: any) {
    return { error: e.message || "Failed to create stock log entry" };
  }

  revalidateAll();
  return { success: true };
}

export async function updateStockLog(
  id: string,
  _prev: StockLogFormState,
  formData: FormData
): Promise<StockLogFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = stockLogSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const d = parsed.data;
  const total = d.quantity * (d.unitPrice ?? 0);

  try {
    const userId = await requireUserId();
    await db
      .update(inventoryLog)
      .set({
        date: new Date(d.date),
        partId: d.partId,
        actionId: d.actionId,
        quantity: d.quantity,
        unitId: d.unitId || null,
        unitPrice: d.unitPrice != null ? d.unitPrice.toFixed(2) : null,
        totalPrice: total > 0 ? total.toFixed(2) : null,
        vendorId: d.vendorId || null,
        salesTypeId: d.salesTypeId || null,
        paymentTypeId: d.paymentTypeId || null,
        payableDueDate: d.payableDueDate || null,
        comments: d.comments || null,
        addStockLink: d.addStockLink || null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(inventoryLog.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to update stock log entry" };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteStockLog(id: string): Promise<StockLogFormState> {
  try {
    await db.delete(inventoryLog).where(eq(inventoryLog.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to delete stock log entry" };
  }

  revalidateAll();
  return { success: true };
}
