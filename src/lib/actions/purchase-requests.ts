"use server";
import { getErrorMessage } from "@/lib/utils/errors";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  purchaseRequests, prLines,
  prComments, prLineComments, prLinePhotos,
} from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/actions";
import { deleteMediaByUrl } from "@/lib/supabase/storage-server";

// ── Schemas ──

const prSchema = z.object({
  prNumber: z.string().min(1, "PR number is required"),
  date: z.string().optional(),
  statusId: z.coerce.number().int().optional(),
  label: z.string().optional(),
  comment: z.string().optional(),
});

const prLineSchema = z.object({
  partId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0).optional(),
  targetPrice: z.coerce.number().min(0).optional(),
  statusId: z.coerce.number().int().optional(),
  comment: z.string().optional(),
  link: z.string().optional(),
  supplierId: z.string().uuid().optional().or(z.literal("")),
});

export type PrFormState = {
  error?: string;
  success?: boolean;
  prId?: string;
};

// ── Purchase Request CRUD ──

export async function createPurchaseRequest(
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = prSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    const userId = await requireUserId();
    const result = await db
      .insert(purchaseRequests)
      .values({
        prNumber: data.prNumber,
        date: data.date ? new Date(data.date) : new Date(),
        statusId: data.statusId || 1, // Default to "New"
        label: data.label || null,
        comment: data.comment || null,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning({ id: purchaseRequests.id });

    revalidatePath("/dashboard/purchase-requests");
    revalidatePath("/dashboard");
    return { success: true, prId: result[0]?.id };
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create purchase request") };
  }
}

export async function updatePurchaseRequest(
  id: string,
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = prSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    const userId = await requireUserId();
    await db
      .update(purchaseRequests)
      .set({
        date: data.date ? new Date(data.date) : undefined,
        statusId: data.statusId || undefined,
        label: data.label || null,
        comment: data.comment || null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(purchaseRequests.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update purchase request") };
  }

  revalidatePath("/dashboard/purchase-requests");
  revalidatePath(`/dashboard/purchase-requests/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePrStatus(
  id: string,
  statusId: number
): Promise<PrFormState> {
  try {
    const userId = await requireUserId();
    await db
      .update(purchaseRequests)
      .set({ statusId, updatedAt: new Date(), updatedBy: userId })
      .where(eq(purchaseRequests.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update status") };
  }

  revalidatePath("/dashboard/purchase-requests");
  revalidatePath(`/dashboard/purchase-requests/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePurchaseRequest(
  id: string
): Promise<PrFormState> {
  try {
    await db.delete(purchaseRequests).where(eq(purchaseRequests.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete purchase request") };
  }

  revalidatePath("/dashboard/purchase-requests");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Line Items CRUD ──

export async function addPrLine(
  prId: string,
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = prLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const qty = data.quantity;
  const price = data.unitPrice ?? 0;
  const target = data.targetPrice ?? 0;
  const total = qty * price;
  const totalTarget = qty * target;
  const profit = totalTarget - total;

  try {
    const userId = await requireUserId();
    await db.insert(prLines).values({
      prId,
      partId: data.partId || null,
      quantity: qty,
      unitPrice: price.toFixed(2),
      totalPrice: total.toFixed(2),
      targetPrice: target > 0 ? target.toFixed(2) : null,
      totalTargetPrice: target > 0 ? totalTarget.toFixed(2) : null,
      projectedProfit: target > 0 ? profit.toFixed(2) : null,
      statusId: data.statusId || 1,
      comment: data.comment || null,
      link: data.link || null,
      supplierId: data.supplierId || null,
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add line item") };
  }

  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  revalidatePath("/dashboard/purchase-requests");
  return { success: true };
}

export async function updatePrLine(
  lineId: string,
  prId: string,
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = prLineSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;
  const qty = data.quantity;
  const price = data.unitPrice ?? 0;
  const target = data.targetPrice ?? 0;
  const total = qty * price;
  const totalTarget = qty * target;
  const profit = totalTarget - total;

  try {
    const userId = await requireUserId();
    await db
      .update(prLines)
      .set({
        partId: data.partId || null,
        quantity: qty,
        unitPrice: price.toFixed(2),
        totalPrice: total.toFixed(2),
        targetPrice: target > 0 ? target.toFixed(2) : null,
        totalTargetPrice: target > 0 ? totalTarget.toFixed(2) : null,
        projectedProfit: target > 0 ? profit.toFixed(2) : null,
        statusId: data.statusId || undefined,
        comment: data.comment || null,
        link: data.link || null,
        supplierId: data.supplierId || null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(prLines.id, lineId));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update line item") };
  }

  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  revalidatePath("/dashboard/purchase-requests");
  return { success: true };
}

export async function deletePrLine(
  lineId: string,
  prId: string
): Promise<PrFormState> {
  try {
    await db.delete(prLines).where(eq(prLines.id, lineId));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete line item") };
  }

  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  revalidatePath("/dashboard/purchase-requests");
  return { success: true };
}

// ─── PR Comments ───
const prCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

export async function addPrComment(
  prId: string,
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const parsed = prCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const userId = await requireUserId();
    await db.insert(prComments).values({
      prId,
      comment: parsed.data.comment.trim(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add comment") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}

export async function deletePrComment(id: string, prId: string): Promise<PrFormState> {
  try {
    await db.delete(prComments).where(eq(prComments.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete comment") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}

// ─── PR Line Photos ───
export async function addPrLinePhoto(
  prLineId: string,
  prId: string,
  photoUrl: string,
  comment: string | null
): Promise<PrFormState> {
  if (!photoUrl) return { error: "Photo URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(prLinePhotos).values({
      prLineId,
      photoUrl,
      comment: comment?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add photo") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}

export async function deletePrLinePhoto(
  id: string,
  prId: string,
  photoUrl: string
): Promise<PrFormState> {
  try {
    await db.delete(prLinePhotos).where(eq(prLinePhotos.id, id));
    await deleteMediaByUrl([photoUrl]).catch(() => {});
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete photo") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}

// ─── PR Line Comments ───
const prLineCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

export async function addPrLineComment(
  prLineId: string,
  prId: string,
  _prev: PrFormState,
  formData: FormData
): Promise<PrFormState> {
  const parsed = prLineCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const userId = await requireUserId();
    await db.insert(prLineComments).values({
      prLineId,
      comment: parsed.data.comment.trim(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add comment") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}

export async function deletePrLineComment(id: string, prId: string): Promise<PrFormState> {
  try {
    await db.delete(prLineComments).where(eq(prLineComments.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete comment") };
  }
  revalidatePath(`/dashboard/purchase-requests/${prId}`);
  return { success: true };
}
