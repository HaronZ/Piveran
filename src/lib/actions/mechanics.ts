"use server";

import { db } from "@/lib/db";
import { mechanics, mechanicSkills } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  nickName: z.string().optional(),
  primaryContact: z.string().optional(),
});

export type MechanicFormState = { success?: boolean; error?: string };

function getSkillIdsFromForm(formData: FormData): string[] {
  const ids: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("skill_") && value === "on") {
      ids.push(key.replace("skill_", ""));
    }
  }
  return ids;
}

export async function createMechanic(
  _prev: MechanicFormState,
  formData: FormData
): Promise<MechanicFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  const inserted = await db
    .insert(mechanics)
    .values({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      nickName: parsed.data.nickName || null,
      primaryContact: parsed.data.primaryContact || null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning({ id: mechanics.id });

  const newId = inserted[0]?.id;
  const skillIds = getSkillIdsFromForm(formData);
  if (newId && skillIds.length > 0) {
    await db.insert(mechanicSkills).values(
      skillIds.map((skillId) => ({ mechanicId: newId, skillId, createdBy: userId }))
    );
  }

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

  const userId = await requireUserId();
  await db
    .update(mechanics)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      nickName: parsed.data.nickName || null,
      primaryContact: parsed.data.primaryContact || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(mechanics.id, id));

  const skillIds = getSkillIdsFromForm(formData);
  await db.delete(mechanicSkills).where(eq(mechanicSkills.mechanicId, id));
  if (skillIds.length > 0) {
    await db.insert(mechanicSkills).values(
      skillIds.map((skillId) => ({ mechanicId: id, skillId, createdBy: userId }))
    );
  }

  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function deleteMechanic(id: string): Promise<MechanicFormState> {
  await db.delete(mechanics).where(eq(mechanics.id, id));
  revalidatePath("/dashboard/mechanics");
  return { success: true };
}
