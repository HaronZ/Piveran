import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export interface StockLogRow {
  id: string;
  date: string;
  partId: string;
  partName: string;
  partNumber: string | null;
  actionId: number;
  actionName: string;
  addMinus: number; // 1 = add, -1 = subtract
  quantity: number;
  unitId: number | null;
  unitName: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  vendorId: string | null;
  vendorName: string | null;
  salesTypeId: number | null;
  salesTypeName: string | null;
  paymentTypeId: number | null;
  paymentTypeName: string | null;
  payableDueDate: string | null;
  comments: string | null;
  addStockLink: string | null;
  createdAt: string | null;
}

export interface ActionOption {
  id: number;
  name: string;
  addMinus: number;
}

export interface UnitOption {
  id: number;
  name: string;
}

export interface SalesTypeOption {
  id: number;
  type: string;
}

export interface PaymentTypeOption {
  id: number;
  type: string;
}

export async function getStockLogs(): Promise<StockLogRow[]> {
  const rows = await db.execute(sql`
    SELECT
      il.id,
      il.date,
      il.part_id AS "partId",
      p.name AS "partName",
      p.part_number AS "partNumber",
      il.action_id AS "actionId",
      ia.name AS "actionName",
      ia.add_minus AS "addMinus",
      il.quantity,
      il.unit_id AS "unitId",
      u.name AS "unitName",
      il.unit_price AS "unitPrice",
      il.total_price AS "totalPrice",
      il.vendor_id AS "vendorId",
      v.name AS "vendorName",
      il.sales_type_id AS "salesTypeId",
      st.type AS "salesTypeName",
      il.payment_type_id AS "paymentTypeId",
      pt.type AS "paymentTypeName",
      il.payable_due_date AS "payableDueDate",
      il.comments,
      il.add_stock_link AS "addStockLink",
      il.created_at AS "createdAt"
    FROM inventory_log il
    JOIN parts p ON p.id = il.part_id
    JOIN inventory_actions ia ON ia.id = il.action_id
    LEFT JOIN units u ON u.id = il.unit_id
    LEFT JOIN vendors v ON v.id = il.vendor_id
    LEFT JOIN sales_types st ON st.id = il.sales_type_id
    LEFT JOIN payment_types pt ON pt.id = il.payment_type_id
    ORDER BY il.date DESC, il.created_at DESC
  `);

  type Raw = {
    id: string;
    date: unknown;
    partId: string;
    partName: string;
    partNumber: string | null;
    actionId: unknown;
    actionName: string;
    addMinus: unknown;
    quantity: unknown;
    unitId: unknown;
    unitName: string | null;
    unitPrice: unknown;
    totalPrice: unknown;
    vendorId: string | null;
    vendorName: string | null;
    salesTypeId: unknown;
    salesTypeName: string | null;
    paymentTypeId: unknown;
    paymentTypeName: string | null;
    payableDueDate: string | null;
    comments: string | null;
    addStockLink: string | null;
    createdAt: unknown;
  };
  return (rows as unknown as Raw[]).map((r) => ({
    id: r.id,
    date: String(r.date),
    partId: r.partId,
    partName: r.partName,
    partNumber: r.partNumber || null,
    actionId: Number(r.actionId),
    actionName: r.actionName,
    addMinus: Number(r.addMinus),
    quantity: Number(r.quantity),
    unitId: r.unitId != null ? Number(r.unitId) : null,
    unitName: r.unitName || null,
    unitPrice: r.unitPrice != null ? Number(r.unitPrice) : null,
    totalPrice: r.totalPrice != null ? Number(r.totalPrice) : null,
    vendorId: r.vendorId || null,
    vendorName: r.vendorName || null,
    salesTypeId: r.salesTypeId != null ? Number(r.salesTypeId) : null,
    salesTypeName: r.salesTypeName || null,
    paymentTypeId: r.paymentTypeId != null ? Number(r.paymentTypeId) : null,
    paymentTypeName: r.paymentTypeName || null,
    payableDueDate: r.payableDueDate || null,
    comments: r.comments || null,
    addStockLink: r.addStockLink || null,
    createdAt: r.createdAt ? String(r.createdAt) : null,
  }));
}

export async function getInventoryActions(): Promise<ActionOption[]> {
  const rows = await db.execute(sql`
    SELECT id, name, add_minus AS "addMinus" FROM inventory_actions ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; name: string; addMinus: unknown }[]).map((r) => ({
    id: Number(r.id),
    name: r.name,
    addMinus: Number(r.addMinus),
  }));
}

export async function getUnits(): Promise<UnitOption[]> {
  const rows = await db.execute(sql`
    SELECT id, name FROM units ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; name: string }[]).map((r) => ({
    id: Number(r.id),
    name: r.name,
  }));
}

export async function getSalesTypes(): Promise<SalesTypeOption[]> {
  const rows = await db.execute(sql`
    SELECT id, type FROM sales_types ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; type: string }[]).map((r) => ({
    id: Number(r.id),
    type: r.type,
  }));
}

export async function getPaymentTypes(): Promise<PaymentTypeOption[]> {
  const rows = await db.execute(sql`
    SELECT id, type FROM payment_types ORDER BY id ASC
  `);
  return (rows as unknown as { id: unknown; type: string }[]).map((r) => ({
    id: Number(r.id),
    type: r.type,
  }));
}
