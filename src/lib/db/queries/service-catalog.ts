import { db } from "@/lib/db";
import { laborTypes, laborPrices, joLabors } from "@/lib/db/schema/garage";
import { eq, sql, asc, desc } from "drizzle-orm";

// ─── Labor Types (with usage count & latest price) ───
export type LaborTypeFullRow = {
  id: string;
  name: string;
  description: string | null;
  defaultPrice: string | null;
  usageCount: number;
  createdAt: string | null;
};

export async function getLaborTypesWithStats(): Promise<LaborTypeFullRow[]> {
  const rows = await db
    .select({
      id: laborTypes.id,
      name: laborTypes.name,
      description: laborTypes.description,
      defaultPrice: laborTypes.defaultPrice,
      usageCount: sql<number>`coalesce(count(distinct ${joLabors.id}), 0)`.as("usage_count"),
      createdAt: sql<string>`${laborTypes.createdAt}`.as("created_at"),
    })
    .from(laborTypes)
    .leftJoin(joLabors, eq(joLabors.laborTypeId, laborTypes.id))
    .groupBy(laborTypes.id)
    .orderBy(asc(laborTypes.name));

  return rows.map((r) => ({
    ...r,
    usageCount: Number(r.usageCount),
  }));
}

// ─── Price History for a specific Labor Type ───
export type LaborPriceRow = {
  id: string;
  laborTypeId: string;
  price: string;
  createdAt: string | null;
};

export async function getLaborPriceHistory(laborTypeId: string): Promise<LaborPriceRow[]> {
  return db
    .select({
      id: laborPrices.id,
      laborTypeId: laborPrices.laborTypeId,
      price: laborPrices.price,
      createdAt: sql<string>`${laborPrices.createdAt}`.as("created_at"),
    })
    .from(laborPrices)
    .where(eq(laborPrices.laborTypeId, laborTypeId))
    .orderBy(desc(laborPrices.createdAt));
}
