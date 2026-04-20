"use server";

import { db } from "@/lib/db";
import { skills, mechanicSkills } from "@/lib/db/schema/garage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/actions";

const schema = z.object({
  skill: z.string().min(1, "Skill name is required"),
  description: z.string().optional(),
});

export type SkillFormState = { success?: boolean; error?: string };

export async function createSkill(
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db.insert(skills).values({
    skill: parsed.data.skill,
    description: parsed.data.description || null,
    createdBy: userId,
    updatedBy: userId,
  });

  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function updateSkill(
  id: string,
  _prev: SkillFormState,
  formData: FormData
): Promise<SkillFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await requireUserId();
  await db
    .update(skills)
    .set({
      skill: parsed.data.skill,
      description: parsed.data.description || null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(skills.id, id));

  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function deleteSkill(id: string): Promise<SkillFormState> {
  await db.delete(skills).where(eq(skills.id, id));
  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard/mechanics");
  return { success: true };
}

export async function setMechanicSkills(
  mechanicId: string,
  skillIds: string[]
): Promise<SkillFormState> {
  const userId = await requireUserId();
  await db.delete(mechanicSkills).where(eq(mechanicSkills.mechanicId, mechanicId));
  if (skillIds.length > 0) {
    await db.insert(mechanicSkills).values(
      skillIds.map((skillId) => ({ mechanicId, skillId, createdBy: userId }))
    );
  }
  revalidatePath("/dashboard/mechanics");
  revalidatePath("/dashboard/skills");
  return { success: true };
}
