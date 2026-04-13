"use server";

import { db } from "@/lib/db";
import { mechanics } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  nickName: z.string().optional(),
  primaryContact: z.string().optional(),
});

export type MechanicFormState = { success?: boolean; error?: string };

export async function createMechanic(
  _prev: MechanicFormState,
  formData: FormData
): Promise<MechanicFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(mechanics).values({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName || null,
    nickName: parsed.data.nickName || null,
    primaryContact: parsed.data.primaryContact || null,
  });

  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function updateMechanic(
  id: string,
  _prev: MechanicFormState,
  formData: FormData
): Promise<MechanicFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(mechanics)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      nickName: parsed.data.nickName || null,
      primaryContact: parsed.data.primaryContact || null,
      updatedAt: new Date(),
    })
    .where(eq(mechanics.id, id));

  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function deleteMechanic(id: string): Promise<MechanicFormState> {
  await db.delete(mechanics).where(eq(mechanics.id, id));
  revalidatePath("/dashboard/mechanics");
  return { success: true };
}
