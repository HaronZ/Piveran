import { db } from "@/lib/db";
import { cashiers, joPayments } from "@/lib/db/schema/garage";
import { eq, sql, asc } from "drizzle-orm";

export type CashierRow = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  contactNumber: string | null;
  paymentsCount: number;
  createdAt: string | null;
};

export async function getCashiers(): Promise<CashierRow[]> {
  const rows = await db
    .select({
      id: cashiers.id,
      firstName: cashiers.firstName,
      middleName: cashiers.middleName,
      lastName: cashiers.lastName,
      contactNumber: cashiers.contactNumber,
      paymentsCount: sql<number>`coalesce(count(distinct ${joPayments.id}), 0)`.as("payments_count"),
      createdAt: sql<string>`${cashiers.createdAt}`.as("created_at"),
    })
    .from(cashiers)
    .leftJoin(joPayments, eq(joPayments.cashierId, cashiers.id))
    .groupBy(cashiers.id)
    .orderBy(asc(cashiers.firstName));

  return rows.map((r) => ({
    ...r,
    paymentsCount: Number(r.paymentsCount),
  }));
}

export type CashierSelectorRow = { id: string; name: string };

export async function getCashiersForSelector(): Promise<CashierSelectorRow[]> {
  const rows = await db
    .select({
      id: cashiers.id,
      name: sql<string>`concat_ws(' ', ${cashiers.firstName}, ${cashiers.lastName})`.as("name"),
    })
    .from(cashiers)
    .orderBy(asc(cashiers.firstName));
  return rows;
}
