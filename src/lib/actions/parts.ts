"use server";
import { getErrorMessage } from "@/lib/utils/errors";

import { z } from "zod";
import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/actions";

const partSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brandId: z.string().uuid().optional().or(z.literal("")),
  partNumber: z.string().optional(),
  partCode: z.string().optional(),
  description: z.string().optional(),
  cabinetCodeId: z.string().uuid().optional().or(z.literal("")),
  criticalCount: z.coerce.number().int().min(0).default(0),
  includeCritical: z.coerce.boolean().default(false),
  comment: z.string().optional(),
});

export type PartFormState = {
  error?: string;
  success?: boolean;
};

export async function createPart(
  _prev: PartFormState,
  formData: FormData
): Promise<PartFormState> {
  const raw = Object.fromEntries(formData.entries());
  // Handle checkbox — unchecked won't be present
  raw.includeCritical = formData.has("includeCritical") ? "true" : "false";

  const parsed = partSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    const userId = await requireUserId();
    await db.insert(parts).values({
      name: data.name,
      brandId: data.brandId || null,
      partNumber: data.partNumber || null,
      partCode: data.partCode || null,
      description: data.description || null,
      cabinetCodeId: data.cabinetCodeId || null,
      criticalCount: data.criticalCount,
      includeCritical: data.includeCritical,
      comment: data.comment || null,
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create part") };
  }

  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePart(
  id: string,
  _prev: PartFormState,
  formData: FormData
): Promise<PartFormState> {
  const raw = Object.fromEntries(formData.entries());
  raw.includeCritical = formData.has("includeCritical") ? "true" : "false";

  const parsed = partSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    const userId = await requireUserId();
    await db
      .update(parts)
      .set({
        name: data.name,
        brandId: data.brandId || null,
        partNumber: data.partNumber || null,
        partCode: data.partCode || null,
        description: data.description || null,
        cabinetCodeId: data.cabinetCodeId || null,
        criticalCount: data.criticalCount,
        includeCritical: data.includeCritical,
        comment: data.comment || null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(parts.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update part") };
  }

  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePart(id: string): Promise<PartFormState> {
  try {
    await db.delete(parts).where(eq(parts.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete part") };
  }

  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard");
  return { success: true };
}
