"use server";

import { db } from "@/lib/db";
import { laborTypes, laborPrices } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ServiceFormState = { success?: boolean; error?: string };

const laborTypeSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  defaultPrice: z.string().optional(),
});

export async function createLaborType(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = laborTypeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const newType = await db
    .insert(laborTypes)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
      defaultPrice: parsed.data.defaultPrice || null,
    })
    .returning({ id: laborTypes.id });

  // If a default price was set, also create a price history entry
  if (parsed.data.defaultPrice && newType[0]) {
    await db.insert(laborPrices).values({
      laborTypeId: newType[0].id,
      price: parsed.data.defaultPrice,
    });
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateLaborType(
  id: string,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = laborTypeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Get current default price to check if it changed
  const current = await db
    .select({ defaultPrice: laborTypes.defaultPrice })
    .from(laborTypes)
    .where(eq(laborTypes.id, id))
    .limit(1);

  const oldPrice = current[0]?.defaultPrice;
  const newPrice = parsed.data.defaultPrice || null;

  await db
    .update(laborTypes)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
      defaultPrice: newPrice,
      updatedAt: new Date(),
    })
    .where(eq(laborTypes.id, id));

  // If price changed, add a price history entry
  if (newPrice && newPrice !== oldPrice) {
    await db.insert(laborPrices).values({
      laborTypeId: id,
      price: newPrice,
    });
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteLaborType(id: string): Promise<ServiceFormState> {
  await db.delete(laborTypes).where(eq(laborTypes.id, id));
  revalidatePath("/dashboard/services");
  return { success: true };
}
