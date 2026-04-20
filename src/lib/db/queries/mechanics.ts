import { db } from "@/lib/db";
import { mechanics, joLaborMechanics, mechanicSkills, skills } from "@/lib/db/schema/garage";
import { eq, sql, asc, inArray } from "drizzle-orm";

export type MechanicSkillBadge = { id: string; skill: string };

export type MechanicRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickName: string | null;
  primaryContact: string | null;
  jobsCount: number;
  createdAt: string | null;
  skills: MechanicSkillBadge[];
};

export async function getMechanics(): Promise<MechanicRow[]> {
  const rows = await db
    .select({
      id: mechanics.id,
      firstName: mechanics.firstName,
      lastName: mechanics.lastName,
      nickName: mechanics.nickName,
      primaryContact: mechanics.primaryContact,
      jobsCount: sql<number>`coalesce(count(distinct ${joLaborMechanics.id}), 0)`.as("jobs_count"),
      createdAt: sql<string>`${mechanics.createdAt}`.as("created_at"),
    })
    .from(mechanics)
    .leftJoin(joLaborMechanics, eq(joLaborMechanics.mechanicId, mechanics.id))
    .groupBy(mechanics.id)
    .orderBy(asc(mechanics.firstName));

  const mechanicIds = rows.map((r) => r.id);
  let skillRows: { mechanicId: string; id: string; skill: string }[] = [];
  if (mechanicIds.length > 0) {
    skillRows = await db
      .select({
        mechanicId: mechanicSkills.mechanicId,
        id: skills.id,
        skill: skills.skill,
      })
      .from(mechanicSkills)
      .innerJoin(skills, eq(mechanicSkills.skillId, skills.id))
      .where(inArray(mechanicSkills.mechanicId, mechanicIds))
      .orderBy(asc(skills.skill));
  }

  const skillsByMechanic = new Map<string, MechanicSkillBadge[]>();
  for (const s of skillRows) {
    const list = skillsByMechanic.get(s.mechanicId) ?? [];
    list.push({ id: s.id, skill: s.skill });
    skillsByMechanic.set(s.mechanicId, list);
  }

  return rows.map((r) => ({
    ...r,
    jobsCount: Number(r.jobsCount),
    skills: skillsByMechanic.get(r.id) ?? [],
  }));
}

export type MechanicSelectorRow = { id: string; name: string };

export async function getMechanicsForSelector(): Promise<MechanicSelectorRow[]> {
  const rows = await db
    .select({
      id: mechanics.id,
      firstName: mechanics.firstName,
      lastName: mechanics.lastName,
      nickName: mechanics.nickName,
    })
    .from(mechanics)
    .orderBy(asc(mechanics.firstName));

  return rows.map((r) => ({
    id: r.id,
    name: [r.firstName, r.lastName].filter(Boolean).join(" ") + (r.nickName ? ` (${r.nickName})` : ""),
  }));
}
