"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, customerAddresses, customerContacts } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  nickName: z.string().optional(),
  suffix: z.string().optional(),
  birthday: z.string().optional(),
  primaryContact: z.string().optional(),
  email: z.string().optional(),
  // Address fields
  street: z.string().optional(),
  village: z.string().optional(),
  barangay: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
});

export type CustomerFormState = {
  error?: string;
  success?: boolean;
};

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        firstName: data.firstName,
        lastName: data.lastName || null,
        middleName: data.middleName || null,
        nickName: data.nickName || null,
        suffix: data.suffix || null,
        birthday: data.birthday || null,
        primaryContact: data.primaryContact || null,
        email: data.email || null,
      })
      .returning({ id: customers.id });

    // Insert address if any field is filled
    const hasAddress = data.street || data.village || data.barangay || data.city || data.province || data.zipCode;
    if (hasAddress && newCustomer) {
      await db.insert(customerAddresses).values({
        customerId: newCustomer.id,
        street: data.street || null,
        village: data.village || null,
        barangay: data.barangay || null,
        city: data.city || null,
        province: data.province || null,
        zipCode: data.zipCode || null,
      });
    }
  } catch (e: any) {
    return { error: e.message || "Failed to create customer" };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCustomer(
  id: string,
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const data = parsed.data;

  try {
    await db
      .update(customers)
      .set({
        firstName: data.firstName,
        lastName: data.lastName || null,
        middleName: data.middleName || null,
        nickName: data.nickName || null,
        suffix: data.suffix || null,
        birthday: data.birthday || null,
        primaryContact: data.primaryContact || null,
        email: data.email || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    // Upsert address: delete existing + insert new
    const hasAddress = data.street || data.village || data.barangay || data.city || data.province || data.zipCode;
    await db.delete(customerAddresses).where(eq(customerAddresses.customerId, id));
    if (hasAddress) {
      await db.insert(customerAddresses).values({
        customerId: id,
        street: data.street || null,
        village: data.village || null,
        barangay: data.barangay || null,
        city: data.city || null,
        province: data.province || null,
        zipCode: data.zipCode || null,
      });
    }
  } catch (e: any) {
    return { error: e.message || "Failed to update customer" };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCustomer(id: string): Promise<CustomerFormState> {
  try {
    await db.delete(customers).where(eq(customers.id, id));
  } catch (e: any) {
    return { error: e.message || "Failed to delete customer" };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}
