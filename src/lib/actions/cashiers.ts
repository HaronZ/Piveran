"use server";

import { db } from "@/lib/db";
import { cashiers } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  contactNumber: z.string().optional(),
});

export type CashierFormState = { success?: boolean; error?: string };

export async function createCashier(
  _prev: CashierFormState,
  formData: FormData
): Promise<CashierFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db.insert(cashiers).values({
    firstName: parsed.data.firstName,
    middleName: parsed.data.middleName || null,
    lastName: parsed.data.lastName || null,
    contactNumber: parsed.data.contactNumber || null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath("/dashboard/cashiers");
  revalidatePath("/dashboard/job-orders");
  return { success: true };
}

export async function updateCashier(
  id: string,
  _prev: CashierFormState,
  formData: FormData
): Promise<CashierFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db
    .update(cashiers)
    .set({
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName || null,
      lastName: parsed.data.lastName || null,
      contactNumber: parsed.data.contactNumber || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(cashiers.id, id));

  revalidatePath("/dashboard/cashiers");
  revalidatePath("/dashboard/job-orders");
  return { success: true };
}

export async function deleteCashier(id: string): Promise<CashierFormState> {
  await db.delete(cashiers).where(eq(cashiers.id, id));
  revalidatePath("/dashboard/cashiers");
  return { success: true };
}
