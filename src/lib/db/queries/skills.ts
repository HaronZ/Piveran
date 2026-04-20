import { db } from "@/lib/db";
import { skills, mechanicSkills } from "@/lib/db/schema/garage";
import { eq, sql, asc } from "drizzle-orm";

export type SkillRow = {
  id: string;
  skill: string;
  description: string | null;
  mechanicsCount: number;
  createdAt: string | null;
};

export async function getSkills(): Promise<SkillRow[]> {
  const rows = await db
    .select({
      id: skills.id,
      skill: skills.skill,
      description: skills.description,
      mechanicsCount: sql<number>`coalesce(count(distinct ${mechanicSkills.id}), 0)`.as("mechanics_count"),
      createdAt: sql<string>`${skills.createdAt}`.as("created_at"),
    })
    .from(skills)
    .leftJoin(mechanicSkills, eq(mechanicSkills.skillId, skills.id))
    .groupBy(skills.id)
    .orderBy(asc(skills.skill));

  return rows.map((r) => ({ ...r, mechanicsCount: Number(r.mechanicsCount) }));
}

export type SkillSelectorRow = { id: string; skill: string };

export async function getSkillsForSelector(): Promise<SkillSelectorRow[]> {
  return db
    .select({ id: skills.id, skill: skills.skill })
    .from(skills)
    .orderBy(asc(skills.skill));
}

export async function getMechanicSkillIds(mechanicId: string): Promise<string[]> {
  const rows = await db
    .select({ skillId: mechanicSkills.skillId })
    .from(mechanicSkills)
    .where(eq(mechanicSkills.mechanicId, mechanicId));
  return rows.map((r) => r.skillId);
}
