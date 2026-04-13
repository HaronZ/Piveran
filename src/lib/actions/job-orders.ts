"use server";

import { db } from "@/lib/db";
import { jobOrders } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  joNumber: z.string().min(1, "JO Number is required"),
  customerId: z.string().optional(),
  carId: z.string().optional(),
  statusId: z.string().optional(),
  checkinDate: z.string().optional(),
  checkoutDate: z.string().optional(),
  discount: z.string().optional(),
  comment: z.string().optional(),
});

export type JoFormState = { success?: boolean; error?: string };

export async function createJobOrder(
  _prev: JoFormState,
  formData: FormData
): Promise<JoFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(jobOrders).values({
    joNumber: parsed.data.joNumber,
    customerId: parsed.data.customerId || null,
    carId: parsed.data.carId || null,
    statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
    checkinDate: parsed.data.checkinDate ? new Date(parsed.data.checkinDate) : null,
    checkoutDate: parsed.data.checkoutDate ? new Date(parsed.data.checkoutDate) : null,
    discount: parsed.data.discount || null,
    comment: parsed.data.comment || null,
  });

  revalidatePath("/dashboard/job-orders");
  return { success: true };
}

export async function updateJobOrder(
  id: string,
  _prev: JoFormState,
  formData: FormData
): Promise<JoFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(jobOrders)
    .set({
      joNumber: parsed.data.joNumber,
      customerId: parsed.data.customerId || null,
      carId: parsed.data.carId || null,
      statusId: parsed.data.statusId ? parseInt(parsed.data.statusId) : null,
      checkinDate: parsed.data.checkinDate ? new Date(parsed.data.checkinDate) : null,
      checkoutDate: parsed.data.checkoutDate ? new Date(parsed.data.checkoutDate) : null,
      discount: parsed.data.discount || null,
      comment: parsed.data.comment || null,
      updatedAt: new Date(),
    })
    .where(eq(jobOrders.id, id));

  revalidatePath("/dashboard/job-orders");
  return { success: true };
}

export async function deleteJobOrder(id: string): Promise<JoFormState> {
  await db.delete(jobOrders).where(eq(jobOrders.id, id));
  revalidatePath("/dashboard/job-orders");
  return { success: true };
}
