import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface CarRow {
  id: string;
  make: string | null;
  model: string | null;
  year: string | null;
  color: string | null;
  plateNumber: string | null;
  ownerName: string | null;
  ownerId: string | null;
  createdAt: string | null;
}

export async function getCars(): Promise<CarRow[]> {
  const rows = await db.execute(sql`
    SELECT
      ca.id,
      ca.make,
      ca.model,
      ca.year,
      ca.color,
      ca.plate_number AS "plateNumber",
      CONCAT_WS(' ', cu.first_name, cu.last_name) AS "ownerName",
      cu.id AS "ownerId",
      ca.created_at AS "createdAt"
    FROM cars ca
    LEFT JOIN customers cu ON cu.id = ca.primary_owner_id
    ORDER BY ca.make ASC, ca.model ASC
  `);

  return (rows as unknown as any[]).map((r: any) => ({
    id: r.id,
    make: r.make,
    model: r.model,
    year: r.year,
    color: r.color,
    plateNumber: r.plateNumber,
    ownerName: r.ownerName || null,
    ownerId: r.ownerId || null,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}

export async function getCarsByCustomerId(customerId: string): Promise<CarRow[]> {
  const rows = await db.execute(sql`
    SELECT
      ca.id,
      ca.make,
      ca.model,
      ca.year,
      ca.color,
      ca.plate_number AS "plateNumber",
      ca.created_at AS "createdAt"
    FROM cars ca
    WHERE ca.primary_owner_id = ${customerId}
    ORDER BY ca.make ASC, ca.model ASC
  `);

  return (rows as unknown as any[]).map((r: any) => ({
    id: r.id,
    make: r.make,
    model: r.model,
    year: r.year,
    color: r.color,
    plateNumber: r.plateNumber,
    ownerName: null,
    ownerId: customerId,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}
