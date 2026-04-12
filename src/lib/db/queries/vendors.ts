import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface VendorRow {
  id: string;
  name: string;
  address: string | null;
  contactNumber: string | null;
  link: string | null;
  comments: string | null;
  contactCount: number;
  partsSuppliedCount: number;
  createdAt: string | null;
}

export interface VendorContactRow {
  id: string;
  number: string;
  label: string | null;
}

export async function getVendors(): Promise<VendorRow[]> {
  const rows = await db.execute(sql`
    SELECT
      v.id,
      v.name,
      v.address,
      v.contact_number AS "contactNumber",
      v.link,
      v.comments,
      COALESCE(contacts.cnt, 0) AS "contactCount",
      COALESCE(supplied.cnt, 0) AS "partsSuppliedCount",
      v.created_at AS "createdAt"
    FROM vendors v
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt
      FROM vendor_contacts vc
      WHERE vc.vendor_id = v.id
    ) contacts ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT ps.part_id)::int AS cnt
      FROM parts_suppliers ps
      WHERE ps.vendor_id = v.id
    ) supplied ON true
    ORDER BY v.name ASC
  `);

  return (rows as unknown as any[]).map((r: any) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    contactNumber: r.contactNumber,
    link: r.link,
    comments: r.comments,
    contactCount: Number(r.contactCount),
    partsSuppliedCount: Number(r.partsSuppliedCount),
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}
