import { db } from "@/lib/db";
import { mechanics, mechanicContacts, joLaborMechanics } from "@/lib/db/schema/garage";
import { eq, sql, asc } from "drizzle-orm";

export type MechanicRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickName: string | null;
  primaryContact: string | null;
  jobsCount: number;
  createdAt: string | null;
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

  return rows.map((r) => ({
    ...r,
    jobsCount: Number(r.jobsCount),
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
