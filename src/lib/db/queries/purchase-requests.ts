import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface PrStatusOption {
  id: number;
  status: string;
}

export interface PrLineStatusOption {
  id: number;
  status: string;
}

export interface PurchaseRequestRow {
  id: string;
  prNumber: string;
  date: string | null;
  statusId: number | null;
  statusName: string | null;
  label: string | null;
  comment: string | null;
  lineCount: number;
  totalAmount: number;
  createdAt: string | null;
}

export interface PrLineRow {
  id: string;
  prId: string;
  partId: string | null;
  partName: string | null;
  partNumber: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  targetPrice: number | null;
  totalTargetPrice: number | null;
  projectedProfit: number | null;
  statusId: number | null;
  statusName: string | null;
  comment: string | null;
  link: string | null;
  supplierId: string | null;
  supplierName: string | null;
}

export interface PurchaseRequestDetail extends PurchaseRequestRow {
  lines: PrLineRow[];
}

export async function getPurchaseRequests(): Promise<PurchaseRequestRow[]> {
  const rows = await db.execute(sql`
    SELECT
      pr.id,
      pr.pr_number AS "prNumber",
      pr.date,
      pr.status_id AS "statusId",
      ps.status AS "statusName",
      pr.label,
      pr.comment,
      COALESCE(lines.cnt, 0) AS "lineCount",
      COALESCE(lines.total, 0) AS "totalAmount",
      pr.created_at AS "createdAt"
    FROM purchase_requests pr
    LEFT JOIN pr_statuses ps ON ps.id = pr.status_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS cnt,
        COALESCE(SUM(pl.total_price::numeric), 0)::float AS total
      FROM pr_lines pl
      WHERE pl.pr_id = pr.id
    ) lines ON true
    ORDER BY pr.created_at DESC
  `);

  type Raw = {
    id: string;
    prNumber: string;
    date: unknown;
    statusId: unknown;
    statusName: string | null;
    label: string | null;
    comment: string | null;
    lineCount: unknown;
    totalAmount: unknown;
    createdAt: unknown;
  };
  return (rows as unknown as Raw[]).map((r) => ({
    id: r.id,
    prNumber: r.prNumber,
    date: r.date ? String(r.date) : null,
    statusId: r.statusId ? Number(r.statusId) : null,
    statusName: r.statusName || null,
    label: r.label || null,
    comment: r.comment || null,
    lineCount: Number(r.lineCount),
    totalAmount: Number(r.totalAmount),
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}

export async function getPurchaseRequestById(
  id: string
): Promise<PurchaseRequestDetail | null> {
  // Fetch header
  const headerRows = await db.execute(sql`
    SELECT
      pr.id,
      pr.pr_number AS "prNumber",
      pr.date,
      pr.status_id AS "statusId",
      ps.status AS "statusName",
      pr.label,
      pr.comment,
      pr.created_at AS "createdAt"
    FROM purchase_requests pr
    LEFT JOIN pr_statuses ps ON ps.id = pr.status_id
    WHERE pr.id = ${id}
    LIMIT 1
  `);

  type HeaderRaw = {
    id: string;
    prNumber: string;
    date: unknown;
    statusId: unknown;
    statusName: string | null;
    label: string | null;
    comment: string | null;
    createdAt: unknown;
  };
  const header = (headerRows as unknown as HeaderRaw[])[0];
  if (!header) return null;

  // Fetch lines
  const lineRows = await db.execute(sql`
    SELECT
      pl.id,
      pl.pr_id AS "prId",
      pl.part_id AS "partId",
      p.name AS "partName",
      p.part_number AS "partNumber",
      pl.quantity,
      pl.unit_price AS "unitPrice",
      pl.total_price AS "totalPrice",
      pl.target_price AS "targetPrice",
      pl.total_target_price AS "totalTargetPrice",
      pl.projected_profit AS "projectedProfit",
      pl.status_id AS "statusId",
      pls.status AS "statusName",
      pl.comment,
      pl.link,
      pl.supplier_id AS "supplierId",
      v.name AS "supplierName"
    FROM pr_lines pl
    LEFT JOIN parts p ON p.id = pl.part_id
    LEFT JOIN pr_line_statuses pls ON pls.id = pl.status_id
    LEFT JOIN vendors v ON v.id = pl.supplier_id
    WHERE pl.pr_id = ${id}
    ORDER BY pl.created_at ASC
  `);

  type LineRaw = {
    id: string;
    prId: string;
    partId: string | null;
    partName: string | null;
    partNumber: string | null;
    quantity: unknown;
    unitPrice: unknown;
    totalPrice: unknown;
    targetPrice: unknown;
    totalTargetPrice: unknown;
    projectedProfit: unknown;
    statusId: unknown;
    statusName: string | null;
    comment: string | null;
    link: string | null;
    supplierId: string | null;
    supplierName: string | null;
  };
  const lines: PrLineRow[] = (lineRows as unknown as LineRaw[]).map((r) => ({
    id: r.id,
    prId: r.prId,
    partId: r.partId || null,
    partName: r.partName || null,
    partNumber: r.partNumber || null,
    quantity: r.quantity != null ? Number(r.quantity) : null,
    unitPrice: r.unitPrice != null ? Number(r.unitPrice) : null,
    totalPrice: r.totalPrice != null ? Number(r.totalPrice) : null,
    targetPrice: r.targetPrice != null ? Number(r.targetPrice) : null,
    totalTargetPrice: r.totalTargetPrice != null ? Number(r.totalTargetPrice) : null,
    projectedProfit: r.projectedProfit != null ? Number(r.projectedProfit) : null,
    statusId: r.statusId != null ? Number(r.statusId) : null,
    statusName: r.statusName || null,
    comment: r.comment || null,
    link: r.link || null,
    supplierId: r.supplierId || null,
    supplierName: r.supplierName || null,
  }));

  const totalAmount = lines.reduce((sum, l) => sum + (l.totalPrice ?? 0), 0);

  return {
    id: header.id,
    prNumber: header.prNumber,
    date: header.date ? String(header.date) : null,
    statusId: header.statusId ? Number(header.statusId) : null,
    statusName: header.statusName || null,
    label: header.label || null,
    comment: header.comment || null,
    lineCount: lines.length,
    totalAmount,
    createdAt: header.createdAt ? String(header.createdAt) : null,
    lines,
  };
}

export async function getPrStatuses(): Promise<PrStatusOption[]> {
  const rows = await db.execute(sql`
    SELECT id, status FROM pr_statuses ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; status: string }[]).map((r) => ({
    id: Number(r.id),
    status: r.status,
  }));
}

export async function getPrLineStatuses(): Promise<PrLineStatusOption[]> {
  const rows = await db.execute(sql`
    SELECT id, status FROM pr_line_statuses ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; status: string }[]).map((r) => ({
    id: Number(r.id),
    status: r.status,
  }));
}

export async function getNextPrNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  const rows = await db.execute(sql`
    SELECT pr_number AS "prNumber"
    FROM purchase_requests
    WHERE pr_number LIKE ${prefix + "%"}
    ORDER BY pr_number DESC
    LIMIT 1
  `);

  const last = (rows as unknown as { prNumber: string }[])[0];
  if (!last) return `${prefix}0001`;

  const lastNum = parseInt(last.prNumber.replace(prefix, ""), 10);
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

/** Simple part options for the line item selector */
export interface PartOption {
  id: string;
  name: string;
  partNumber: string | null;
}

export async function getPartsForSelector(): Promise<PartOption[]> {
  const rows = await db.execute(sql`
    SELECT id, name, part_number AS "partNumber"
    FROM parts
    ORDER BY name ASC
  `);
  return (rows as unknown as { id: string; name: string; partNumber: string | null }[]).map((r) => ({
    id: r.id,
    name: r.name,
    partNumber: r.partNumber || null,
  }));
}

/** Simple vendor options for the supplier selector */
export interface VendorOption {
  id: string;
  name: string;
}

export async function getVendorsForSelector(): Promise<VendorOption[]> {
  const rows = await db.execute(sql`
    SELECT id, name FROM vendors ORDER BY name ASC
  `);
  return (rows as unknown as { id: string; name: string }[]).map((r) => ({
    id: r.id,
    name: r.name,
  }));
}
