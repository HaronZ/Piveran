"use server";

import { db } from "@/lib/db";
import { cashLog } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  actionId: z.string().min(1, "Action is required"),
  amount: z.string().min(1, "Amount is required"),
  comment: z.string().optional(),
  expenseTypeId: z.string().optional(),
  opexTypeId: z.string().optional(),
});

export type CashLogFormState = { success?: boolean; error?: string };

export async function createCashEntry(
  _prev: CashLogFormState,
  formData: FormData
): Promise<CashLogFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dateObj = new Date(parsed.data.date);
  const ym = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  const q = `Q${Math.ceil((dateObj.getMonth() + 1) / 3)}`;

  const userId = await requireUserId();
  await db.insert(cashLog).values({
    datetime: dateObj,
    date: parsed.data.date,
    yearMonth: ym,
    yearQuarter: `${dateObj.getFullYear()}-${q}`,
    year: String(dateObj.getFullYear()),
    actionId: parseInt(parsed.data.actionId),
    amount: parsed.data.amount,
    comment: parsed.data.comment || null,
    expenseTypeId: parsed.data.expenseTypeId ? parseInt(parsed.data.expenseTypeId) : null,
    opexTypeId: parsed.data.opexTypeId ? parseInt(parsed.data.opexTypeId) : null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath("/dashboard/cash-log");
  return { success: true };
}

export async function updateCashEntry(
  id: string,
  _prev: CashLogFormState,
  formData: FormData
): Promise<CashLogFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const dateObj = new Date(parsed.data.date);
  const ym = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  const q = `Q${Math.ceil((dateObj.getMonth() + 1) / 3)}`;

  const userId = await requireUserId();
  await db
    .update(cashLog)
    .set({
      datetime: dateObj,
      date: parsed.data.date,
      yearMonth: ym,
      yearQuarter: `${dateObj.getFullYear()}-${q}`,
      year: String(dateObj.getFullYear()),
      actionId: parseInt(parsed.data.actionId),
      amount: parsed.data.amount,
      comment: parsed.data.comment || null,
      expenseTypeId: parsed.data.expenseTypeId ? parseInt(parsed.data.expenseTypeId) : null,
      opexTypeId: parsed.data.opexTypeId ? parseInt(parsed.data.opexTypeId) : null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(cashLog.id, id));

  revalidatePath("/dashboard/cash-log");
  return { success: true };
}

export async function deleteCashEntry(id: string): Promise<CashLogFormState> {
  await db.delete(cashLog).where(eq(cashLog.id, id));
  revalidatePath("/dashboard/cash-log");
  return { success: true };
}
