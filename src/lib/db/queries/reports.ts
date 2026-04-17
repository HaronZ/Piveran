import { db } from "@/lib/db";
import {
  parts,
  partsSuppliers,
  inventoryValue,
  inventoryLog,
  partsAudit,
  auditStatuses,
  vendors,
  brands,
  inventoryActions,
} from "@/lib/db/schema/vendor";
import { eq, sql, desc, asc } from "drizzle-orm";

// ═══════════════════════════════════════
//  1. INVENTORY VALUATION
// ═══════════════════════════════════════
export type InventorySnapshotRow = {
  id: string;
  currentValue: string | null;
  date: string | null;
  quarter: string | null;
  year: number | null;
};

export async function getInventorySnapshots(): Promise<InventorySnapshotRow[]> {
  return db
    .select({
      id: inventoryValue.id,
      currentValue: inventoryValue.currentValue,
      date: inventoryValue.date,
      quarter: inventoryValue.quarter,
      year: inventoryValue.year,
    })
    .from(inventoryValue)
    .orderBy(desc(inventoryValue.date));
}

// ═══════════════════════════════════════
//  2. VENDOR PRICING COMPARISON
// ═══════════════════════════════════════
export type VendorPricingRow = {
  id: string;
  partId: string;
  partName: string;
  brandName: string | null;
  vendorId: string;
  vendorName: string;
  price: string | null;
  comment: string | null;
  link: string | null;
  lastUpdate: string | null;
};

export async function getVendorPricing(): Promise<VendorPricingRow[]> {
  const rows = await db
    .select({
      id: partsSuppliers.id,
      partId: partsSuppliers.partId,
      partName: parts.name,
      brandName: brands.name,
      vendorId: partsSuppliers.vendorId,
      vendorName: vendors.name,
      price: partsSuppliers.price,
      comment: partsSuppliers.comment,
      link: partsSuppliers.link,
      lastUpdate: sql<string>`${partsSuppliers.lastUpdate}`.as("last_update"),
    })
    .from(partsSuppliers)
    .innerJoin(parts, eq(partsSuppliers.partId, parts.id))
    .innerJoin(vendors, eq(partsSuppliers.vendorId, vendors.id))
    .leftJoin(brands, eq(parts.brandId, brands.id))
    .orderBy(asc(parts.name), asc(vendors.name));

  return rows;
}

// ═══════════════════════════════════════
//  3. STOCK AUDIT
// ═══════════════════════════════════════
export type StockAuditRow = {
  id: string;
  partName: string;
  auditCount: number;
  currentStock: number | null;
  discrepancy: number | null;
  status: string;
  comment: string | null;
  createdAt: string | null;
};

export async function getStockAudits(): Promise<StockAuditRow[]> {
  const rows = await db
    .select({
      id: partsAudit.id,
      partName: parts.name,
      auditCount: partsAudit.count,
      currentStock: partsAudit.currentStock,
      statusName: auditStatuses.status,
      comment: partsAudit.comment,
      createdAt: sql<string>`${partsAudit.createdAt}`.as("created_at"),
    })
    .from(partsAudit)
    .innerJoin(parts, eq(partsAudit.partId, parts.id))
    .innerJoin(auditStatuses, eq(partsAudit.statusId, auditStatuses.id))
    .orderBy(desc(partsAudit.createdAt));

  return rows.map((r) => ({
    id: r.id,
    partName: r.partName,
    auditCount: r.auditCount,
    currentStock: r.currentStock,
    discrepancy: r.currentStock !== null ? r.auditCount - r.currentStock : null,
    status: r.statusName,
    comment: r.comment,
    createdAt: r.createdAt,
  }));
}

// ═══════════════════════════════════════
//  KPI SUMMARY (for report header)
// ═══════════════════════════════════════
export type ReportKPIs = {
  totalParts: number;
  totalVendorLinks: number;
  totalAudits: number;
  latestValuation: string | null;
};

export async function getReportKPIs(): Promise<ReportKPIs> {
  const [partsCount, supplierLinks, audits, latestVal] = await Promise.all([
    db.select({ v: sql<number>`count(*)` }).from(parts),
    db.select({ v: sql<number>`count(*)` }).from(partsSuppliers),
    db.select({ v: sql<number>`count(*)` }).from(partsAudit),
    db
      .select({ value: inventoryValue.currentValue })
      .from(inventoryValue)
      .orderBy(desc(inventoryValue.date))
      .limit(1),
  ]);

  return {
    totalParts: Number(partsCount[0]?.v ?? 0),
    totalVendorLinks: Number(supplierLinks[0]?.v ?? 0),
    totalAudits: Number(audits[0]?.v ?? 0),
    latestValuation: latestVal[0]?.value ?? null,
  };
}
