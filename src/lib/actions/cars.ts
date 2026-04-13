"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { cars } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const carSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  plateNumber: z.string().optional(),
  primaryOwnerId: z.string().optional(),
});

export type CarFormState = {
  error?: string;
  success?: boolean;
};

export async function createCar(
  _prev: CarFormState,
  formData: FormData
): Promise<CarFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = carSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  if (!data.make && !data.plateNumber) {
    return { error: "At least a make or plate number is required" };
  }

  try {
    await db.insert(cars).values({
      make: data.make || null,
      model: data.model || null,
      year: data.year || null,
      color: data.color || null,
      plateNumber: data.plateNumber || null,
      primaryOwnerId: data.primaryOwnerId || null,
    });
  } catch (e: any) {
    return { error: e.message || "Failed to add car" };
  }

  revalidatePath("/dashboard/cars");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCar(
  id: string,
  _prev: CarFormState,
  formData: FormData
): Promise<CarFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = carSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    await db
      .update(cars)
      .set({
        make: data.make || null,
        model: data.model || null,
        year: data.year || null,
        color: data.color || null,
        plateNumber: data.plateNumber || null,
        primaryOwnerId: data.primaryOwnerId || null,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to update car" };
  }

  revalidatePath("/dashboard/cars");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCar(id: string): Promise<CarFormState> {
  try {
    await db.delete(cars).where(eq(cars.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to delete car" };
  }

  revalidatePath("/dashboard/cars");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}
