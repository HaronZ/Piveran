"use server";

import { db } from "@/lib/db";
import { joMaterials, joLabors, joPayments } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

  await db.insert(joLabors).values({
    joId,
    laborTypeId: parsed.data.laborTypeId || null,
    price: parsed.data.price || null,
    discount: parsed.data.discount || null,
    totalPrice: totalPrice.toFixed(2),
    statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
    targetDate: parsed.data.targetDate || null,
    comment: parsed.data.comment || null,
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

  await db.insert(joPayments).values({
    joId,
    orNumber: parsed.data.orNumber || null,
    siNumber: parsed.data.siNumber || null,
    amountPaid: parsed.data.amountPaid,
    datePaid: parsed.data.datePaid || null,
    cashierId: parsed.data.cashierId || null,
    comment: parsed.data.comment || null,
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

  await db
    .update(joPayments)
    .set({
      orNumber: parsed.data.orNumber || null,
      siNumber: parsed.data.siNumber || null,
      amountPaid: parsed.data.amountPaid,
      datePaid: parsed.data.datePaid || null,
      cashierId: parsed.data.cashierId || null,
      comment: parsed.data.comment || null,
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
