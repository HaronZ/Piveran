"use server";

import { db } from "@/lib/db";
import { joMaterials, joLabors, joPayments, joPhotos, joComments, joMaterialPhotos, joMaterialComments } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";
import { deleteMediaByUrl } from "@/lib/supabase/storage-server";
import { getErrorMessage } from "@/lib/utils/errors";

export type JoDetailFormState = { success?: boolean; error?: string };

// ─── JO Materials ───
const materialSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  price: z.string().optional(),
  quantity: z.string().optional(),
  discount: z.string().optional(),
  statusId: z.string().optional(),
  providedInhouse: z.string().optional(),
  includeInTotal: z.string().optional(),
  comment: z.string().optional(),
});

export async function addJoMaterial(
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = materialSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const qty = parseInt(parsed.data.quantity || "1") || 1;
  const price = parseFloat(parsed.data.price || "0");
  const discount = parseFloat(parsed.data.discount || "0");
  const totalPrice = qty * price;
  const finalPrice = totalPrice - discount;

  const userId = await requireUserId();
  await db.insert(joMaterials).values({
    joId,
    partId: parsed.data.partId || null,
    price: parsed.data.price || null,
    quantity: qty,
    totalPrice: totalPrice.toFixed(2),
    discount: parsed.data.discount || null,
    finalPrice: finalPrice.toFixed(2),
    statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
    providedInhouse: parsed.data.providedInhouse === "true",
    includeInTotal: parsed.data.includeInTotal !== "false",
    comment: parsed.data.comment || null,
    date: new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function updateJoMaterial(
  id: string,
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = materialSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const qty = parseInt(parsed.data.quantity || "1") || 1;
  const price = parseFloat(parsed.data.price || "0");
  const discount = parseFloat(parsed.data.discount || "0");
  const totalPrice = qty * price;
  const finalPrice = totalPrice - discount;

  const userId = await requireUserId();
  await db
    .update(joMaterials)
    .set({
      partId: parsed.data.partId || null,
      price: parsed.data.price || null,
      quantity: qty,
      totalPrice: totalPrice.toFixed(2),
      discount: parsed.data.discount || null,
      finalPrice: finalPrice.toFixed(2),
      statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
      providedInhouse: parsed.data.providedInhouse === "true",
      includeInTotal: parsed.data.includeInTotal !== "false",
      comment: parsed.data.comment || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(joMaterials.id, id));

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoMaterial(id: string, joId: string): Promise<JoDetailFormState> {
  await db.delete(joMaterials).where(eq(joMaterials.id, id));
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Labors ───
const laborSchema = z.object({
  laborTypeId: z.string().min(1, "Labor type is required"),
  price: z.string().optional(),
  discount: z.string().optional(),
  statusId: z.string().optional(),
  targetDate: z.string().optional(),
  comment: z.string().optional(),
});

export async function addJoLabor(
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = laborSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const price = parseFloat(parsed.data.price || "0");
  const discount = parseFloat(parsed.data.discount || "0");
  const totalPrice = price - discount;

  const userId = await requireUserId();
  await db.insert(joLabors).values({
    joId,
    laborTypeId: parsed.data.laborTypeId || null,
    price: parsed.data.price || null,
    discount: parsed.data.discount || null,
    totalPrice: totalPrice.toFixed(2),
    statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
    targetDate: parsed.data.targetDate || null,
    comment: parsed.data.comment || null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function updateJoLabor(
  id: string,
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = laborSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const price = parseFloat(parsed.data.price || "0");
  const discount = parseFloat(parsed.data.discount || "0");
  const totalPrice = price - discount;

  const userId = await requireUserId();
  await db
    .update(joLabors)
    .set({
      laborTypeId: parsed.data.laborTypeId || null,
      price: parsed.data.price || null,
      discount: parsed.data.discount || null,
      totalPrice: totalPrice.toFixed(2),
      statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
      targetDate: parsed.data.targetDate || null,
      comment: parsed.data.comment || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(joLabors.id, id));

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoLabor(id: string, joId: string): Promise<JoDetailFormState> {
  await db.delete(joLabors).where(eq(joLabors.id, id));
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Payments ───
const paymentSchema = z.object({
  orNumber: z.string().optional(),
  siNumber: z.string().optional(),
  amountPaid: z.string().min(1, "Amount is required"),
  datePaid: z.string().optional(),
  cashierId: z.string().optional(),
  comment: z.string().optional(),
});

export async function addJoPayment(
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db.insert(joPayments).values({
    joId,
    orNumber: parsed.data.orNumber || null,
    siNumber: parsed.data.siNumber || null,
    amountPaid: parsed.data.amountPaid,
    datePaid: parsed.data.datePaid || null,
    cashierId: parsed.data.cashierId || null,
    comment: parsed.data.comment || null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function updateJoPayment(
  id: string,
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db
    .update(joPayments)
    .set({
      orNumber: parsed.data.orNumber || null,
      siNumber: parsed.data.siNumber || null,
      amountPaid: parsed.data.amountPaid,
      datePaid: parsed.data.datePaid || null,
      cashierId: parsed.data.cashierId || null,
      comment: parsed.data.comment || null,
      updatedBy: userId,
    })
    .where(eq(joPayments.id, id));

  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoPayment(id: string, joId: string): Promise<JoDetailFormState> {
  await db.delete(joPayments).where(eq(joPayments.id, id));
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Photos ───
export async function addJoPhoto(
  joId: string,
  photoUrl: string,
  comment: string | null
): Promise<JoDetailFormState> {
  if (!photoUrl) return { error: "Photo URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(joPhotos).values({
      joId,
      photoUrl,
      comment: comment?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add photo") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoPhoto(
  id: string,
  joId: string,
  photoUrl: string
): Promise<JoDetailFormState> {
  try {
    await db.delete(joPhotos).where(eq(joPhotos.id, id));
    await deleteMediaByUrl([photoUrl]).catch(() => {});
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete photo") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Comments ───
const joCommentSchema = z.object({
  commentFrom: z.string().optional(),
  comment: z.string().min(1, "Comment is required"),
});

export async function addJoComment(
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const parsed = joCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const userId = await requireUserId();
    await db.insert(joComments).values({
      joId,
      commentFrom: parsed.data.commentFrom?.trim() || null,
      comment: parsed.data.comment.trim(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add comment") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoComment(id: string, joId: string): Promise<JoDetailFormState> {
  await db.delete(joComments).where(eq(joComments.id, id));
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Material Photos ───
export async function addJoMaterialPhoto(
  joMaterialId: string,
  joId: string,
  photoUrl: string,
  comment: string | null
): Promise<JoDetailFormState> {
  if (!photoUrl) return { error: "Photo URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(joMaterialPhotos).values({
      joMaterialId,
      photoUrl,
      comment: comment?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add photo") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoMaterialPhoto(
  id: string,
  joId: string,
  photoUrl: string
): Promise<JoDetailFormState> {
  try {
    await db.delete(joMaterialPhotos).where(eq(joMaterialPhotos.id, id));
    await deleteMediaByUrl([photoUrl]).catch(() => {});
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete photo") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

// ─── JO Material Comments ───
const joMaterialCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
});

export async function addJoMaterialComment(
  joMaterialId: string,
  joId: string,
  _prev: JoDetailFormState,
  formData: FormData
): Promise<JoDetailFormState> {
  const parsed = joMaterialCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const userId = await requireUserId();
    await db.insert(joMaterialComments).values({
      joMaterialId,
      comment: parsed.data.comment.trim(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add comment") };
  }
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}

export async function deleteJoMaterialComment(id: string, joId: string): Promise<JoDetailFormState> {
  await db.delete(joMaterialComments).where(eq(joMaterialComments.id, id));
  revalidatePath(`/dashboard/job-orders/${joId}`);
  return { success: true };
}
