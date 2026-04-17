"use server";
import { getErrorMessage } from "@/lib/utils/errors";

import { z } from "zod";
import { db } from "@/lib/db";
import { customers, customerAddresses, customerContacts, customerPhotos } from "@/lib/db/schema/garage";
import { deleteMediaByUrl } from "@/lib/supabase/storage-server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/actions";

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
    const userId = await requireUserId();
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
        createdBy: userId,
        updatedBy: userId,
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
        createdBy: userId,
        updatedBy: userId,
      });
    }
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to create customer") };
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
    const userId = await requireUserId();
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
        updatedBy: userId,
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
        createdBy: userId,
        updatedBy: userId,
      });
    }
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to update customer") };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCustomer(id: string): Promise<CustomerFormState> {
  try {
    const photos = await db
      .select({ photoUrl: customerPhotos.photoUrl })
      .from(customerPhotos)
      .where(eq(customerPhotos.customerId, id));

    await db.delete(customers).where(eq(customers.id, id));

    if (photos.length > 0) {
      await deleteMediaByUrl(photos.map((p) => p.photoUrl)).catch(() => {});
    }
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete customer") };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Contact CRUD ───
export async function addContact(
  customerId: string,
  contactNumber: string
): Promise<CustomerFormState> {
  if (!contactNumber.trim()) return { error: "Contact number is required" };
  try {
    const userId = await requireUserId();
    await db.insert(customerContacts).values({
      customerId,
      contactNumber: contactNumber.trim(),
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add contact") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

export async function deleteContact(
  id: string,
  customerId: string
): Promise<CustomerFormState> {
  try {
    await db.delete(customerContacts).where(eq(customerContacts.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete contact") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

// ─── Address CRUD ───
export async function addAddress(
  customerId: string,
  formData: FormData
): Promise<CustomerFormState> {
  const street = formData.get("street") as string || null;
  const village = formData.get("village") as string || null;
  const barangay = formData.get("barangay") as string || null;
  const city = formData.get("city") as string || null;
  const province = formData.get("province") as string || null;
  const zipCode = formData.get("zipCode") as string || null;

  if (!street && !barangay && !city && !province) {
    return { error: "At least one address field is required" };
  }

  try {
    const userId = await requireUserId();
    await db.insert(customerAddresses).values({
      customerId,
      street,
      village,
      barangay,
      city,
      province,
      zipCode,
      createdBy: userId,
      updatedBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add address") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

export async function deleteAddress(
  id: string,
  customerId: string
): Promise<CustomerFormState> {
  try {
    await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete address") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

// ─── Photo CRUD ───
export async function addCustomerPhoto(
  customerId: string,
  photoUrl: string,
  label: string | null
): Promise<CustomerFormState> {
  if (!photoUrl) return { error: "Photo URL is required" };
  try {
    const userId = await requireUserId();
    await db.insert(customerPhotos).values({
      customerId,
      photoUrl,
      label: label?.trim() || null,
      createdBy: userId,
    });
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to add photo") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

export async function deleteCustomerPhoto(
  id: string,
  customerId: string,
  photoUrl: string
): Promise<CustomerFormState> {
  try {
    await db.delete(customerPhotos).where(eq(customerPhotos.id, id));
    await deleteMediaByUrl([photoUrl]).catch(() => {});
  } catch (e) {
    return { error: getErrorMessage(e, "Failed to delete photo") };
  }
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}
