import { db } from "@/lib/db";
import { laborPrices } from "@/lib/db/schema/garage";
import { partsPrices } from "@/lib/db/schema/vendor";
import { users } from "@/lib/db/schema/security";
import { eq, desc, sql } from "drizzle-orm";

export type PriceHistoryEntry = {
  id: string;
  price: string;
  date: string | null;
  changedBy: string | null;
  comment: string | null;
};

export async function getLaborPriceHistory(laborTypeId: string): Promise<PriceHistoryEntry[]> {
  const rows = await db
    .select({
      id: laborPrices.id,
      price: laborPrices.price,
      date: sql<string>`${laborPrices.createdAt}`.as("date"),
      changedBy: users.email,
    })
    .from(laborPrices)
    .leftJoin(users, eq(laborPrices.createdBy, users.id))
    .where(eq(laborPrices.laborTypeId, laborTypeId))
    .orderBy(desc(laborPrices.createdAt));

  return rows.map((r) => ({ ...r, comment: null }));
}

export async function getPartPriceHistory(partId: string): Promise<PriceHistoryEntry[]> {
  const rows = await db
    .select({
      id: partsPrices.id,
      price: partsPrices.price,
      date: sql<string>`${partsPrices.date}`.as("date"),
      changedBy: users.email,
      comment: partsPrices.comment,
    })
    .from(partsPrices)
    .leftJoin(users, eq(partsPrices.createdBy, users.id))
    .where(eq(partsPrices.partId, partId))
    .orderBy(desc(partsPrices.date));

  return rows;
}
