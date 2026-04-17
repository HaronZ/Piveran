"use server";

import { db } from "@/lib/db";
import { roles, userRoles, roleViews } from "@/lib/db/schema/security";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";

export type SecurityFormState = { success?: boolean; error?: string };

// ─── ROLES ───
const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

export async function createRole(
  _prev: SecurityFormState,
  formData: FormData
): Promise<SecurityFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Get views from form (checkboxes send "on" or are absent)
  const views = getViewsFromForm(formData);

  const newRole = await db
    .insert(roles)
    .values({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning({ id: roles.id });

  // Insert role_views
  if (views.length > 0 && newRole[0]) {
    const userId = await requireUserId();
    await db.insert(roleViews).values(
      views.map((v) => ({ roleId: newRole[0].id, viewName: v, createdBy: userId, updatedBy: userId }))
    );
  }

  revalidatePath("/dashboard/security");
  return { success: true };
}

export async function updateRole(
  id: number,
  _prev: SecurityFormState,
  formData: FormData
): Promise<SecurityFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const views = getViewsFromForm(formData);

  await db
    .update(roles)
    .set({
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .where(eq(roles.id, id));

  // Replace role_views: delete all, then re-insert
  await db.delete(roleViews).where(eq(roleViews.roleId, id));
  if (views.length > 0) {
    const userId = await requireUserId();
    await db.insert(roleViews).values(
      views.map((v) => ({ roleId: id, viewName: v, createdBy: userId, updatedBy: userId }))
    );
  }

  revalidatePath("/dashboard/security");
  return { success: true };
}

export async function deleteRole(id: number): Promise<SecurityFormState> {
  await db.delete(roles).where(eq(roles.id, id));
  revalidatePath("/dashboard/security");
  return { success: true };
}

// ─── USER ROLES ───
export async function assignRole(
  userId: string,
  roleId: number
): Promise<SecurityFormState> {
  // Check if already assigned
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
    .limit(1);

  if (existing.length > 0) return { error: "Role already assigned" };

  const actingUserId = await requireUserId();
  await db.insert(userRoles).values({ userId, roleId, createdBy: actingUserId, updatedBy: actingUserId });
  revalidatePath("/dashboard/security");
  return { success: true };
}

export async function removeRole(
  userId: string,
  roleId: number
): Promise<SecurityFormState> {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  revalidatePath("/dashboard/security");
  return { success: true };
}

// ─── Helper: extract checked views from FormData ───
function getViewsFromForm(formData: FormData): string[] {
  const views: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("view_") && value === "on") {
      views.push(key.replace("view_", ""));
    }
  }
  return views;
}
