import { db } from "@/lib/db";
import { sql, eq, desc, asc } from "drizzle-orm";
import {
  parts,
  brands,
  cabinetCodes,
  partsPhotos,
  partsSuppliers,
  vendors,
} from "@/lib/db/schema/vendor";

export type PartPhotoRow = {
  id: string;
  partId: string;
  photoUrl: string;
  notes: string | null;
  date: string | null;
};

export async function getPartPhotos(partId: string): Promise<PartPhotoRow[]> {
  return db
    .select({
      id: partsPhotos.id,
      partId: partsPhotos.partId,
      photoUrl: partsPhotos.photoUrl,
      notes: partsPhotos.notes,
      date: sql<string>`${partsPhotos.date}`.as("pp_date"),
    })
    .from(partsPhotos)
    .where(eq(partsPhotos.partId, partId))
    .orderBy(desc(partsPhotos.date));
}

export interface PartRow {
  id: string;
  name: string;
  brandId: string | null;
  brandName: string | null;
  partNumber: string | null;
  partCode: string | null;
  description: string | null;
  cabinetCodeId: string | null;
  cabinetCode: string | null;
  criticalCount: number;
  includeCritical: boolean;
  currentStock: number;
  latestPrice: number | null;
  createdAt: string | null;
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface CabinetCodeOption {
  id: string;
  code: string;
}

export async function getParts(): Promise<PartRow[]> {
  const rows = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.brand_id        AS "brandId",
      b.name            AS "brandName",
      p.part_number      AS "partNumber",
      p.part_code        AS "partCode",
      p.description,
      p.cabinet_code_id  AS "cabinetCodeId",
      cc.code            AS "cabinetCode",
      COALESCE(p.critical_count, 0)   AS "criticalCount",
      COALESCE(p.include_critical, false) AS "includeCritical",
      COALESCE(stock.current_stock, 0) AS "currentStock",
      latest_price.price AS "latestPrice",
      p.created_at       AS "createdAt"
    FROM parts p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN cabinet_codes cc ON cc.id = p.cabinet_code_id
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(
        CASE WHEN il.action_id IN (1,5) THEN il.quantity ELSE -il.quantity END
      ), 0) AS current_stock
      FROM inventory_log il
      WHERE il.part_id = p.id
    ) stock ON true
    LEFT JOIN LATERAL (
      SELECT pp.price
      FROM parts_prices pp
      WHERE pp.part_id = p.id
      ORDER BY pp.date DESC NULLS LAST
      LIMIT 1
    ) latest_price ON true
    ORDER BY p.name ASC
  `);

  type Raw = Omit<PartRow, "criticalCount" | "includeCritical" | "currentStock" | "latestPrice" | "createdAt"> & {
    criticalCount: unknown;
    includeCritical: unknown;
    currentStock: unknown;
    latestPrice: unknown;
    createdAt: unknown;
  };
  return (rows as unknown as Raw[]).map((r) => ({
    id: r.id,
    name: r.name,
    brandId: r.brandId,
    brandName: r.brandName,
    partNumber: r.partNumber,
    partCode: r.partCode,
    description: r.description,
    cabinetCodeId: r.cabinetCodeId,
    cabinetCode: r.cabinetCode,
    criticalCount: Number(r.criticalCount),
    includeCritical: Boolean(r.includeCritical),
    currentStock: Number(r.currentStock),
    latestPrice: r.latestPrice ? Number(r.latestPrice) : null,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}

export async function getBrandsForFilter(): Promise<BrandOption[]> {
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands)
    .orderBy(brands.name);
  return rows;
}

export type PartSupplierRow = {
  id: string;
  partId: string;
  vendorId: string;
  vendorName: string;
  price: string | null;
  comment: string | null;
  link: string | null;
  lastUpdate: string | null;
};

export async function getPartSuppliers(partId: string): Promise<PartSupplierRow[]> {
  const rows = await db
    .select({
      id: partsSuppliers.id,
      partId: partsSuppliers.partId,
      vendorId: partsSuppliers.vendorId,
      vendorName: vendors.name,
      price: partsSuppliers.price,
      comment: partsSuppliers.comment,
      link: partsSuppliers.link,
      lastUpdate: sql<string>`${partsSuppliers.lastUpdate}`.as("last_update"),
    })
    .from(partsSuppliers)
    .innerJoin(vendors, eq(partsSuppliers.vendorId, vendors.id))
    .where(eq(partsSuppliers.partId, partId))
    .orderBy(asc(partsSuppliers.price));
  return rows.map((r) => ({ ...r, vendorName: r.vendorName ?? "" }));
}

export type VendorOption = { id: string; name: string };
export async function getVendorsForSelector(): Promise<VendorOption[]> {
  return db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors)
    .orderBy(vendors.name);
}

export async function getCabinetCodes(): Promise<CabinetCodeOption[]> {
  const rows = await db
    .select({ id: cabinetCodes.id, code: cabinetCodes.code })
    .from(cabinetCodes)
    .orderBy(cabinetCodes.code);
  return rows;
}
