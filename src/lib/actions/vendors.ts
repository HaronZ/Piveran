"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { vendors, vendorContacts } from "@/lib/db/schema/vendor";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  contactNumber: z.string().optional(),
  link: z.string().optional(),
  comments: z.string().optional(),
});

export type VendorFormState = {
  error?: string;
  success?: boolean;
};

export async function createVendor(
  _prev: VendorFormState,
  formData: FormData
): Promise<VendorFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = vendorSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    await db.insert(vendors).values({
      name: data.name,
      address: data.address || null,
      contactNumber: data.contactNumber || null,
      link: data.link || null,
      comments: data.comments || null,
    });
  } catch (e: any) {
    return { error: e.message || "Failed to create vendor" };
  }

  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateVendor(
  id: string,
  _prev: VendorFormState,
  formData: FormData
): Promise<VendorFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = vendorSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    await db
      .update(vendors)
      .set({
        name: data.name,
        address: data.address || null,
        contactNumber: data.contactNumber || null,
        link: data.link || null,
        comments: data.comments || null,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to update vendor" };
  }

  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteVendor(id: string): Promise<VendorFormState> {
  try {
    await db.delete(vendors).where(eq(vendors.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to delete vendor" };
  }

  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard");
  return { success: true };
}
