import { db } from "@/lib/db";
import { cashLog, cashActions, expenseTypes, opexTypes } from "@/lib/db/schema/garage";
import { eq, sql, desc } from "drizzle-orm";

export type CashLogRow = {
  id: string;
  datetime: string;
  date: string;
  yearMonth: string | null;
  actionId: number;
  actionName: string;
  amount: string;
  comment: string | null;
  expenseTypeId: number | null;
  expenseTypeName: string | null;
  opexTypeId: number | null;
  opexTypeName: string | null;
  createdAt: string | null;
};

export async function getCashLog(): Promise<CashLogRow[]> {
  const rows = await db
    .select({
      id: cashLog.id,
      datetime: sql<string>`${cashLog.datetime}`.as("dt"),
      date: cashLog.date,
      yearMonth: cashLog.yearMonth,
      actionId: cashLog.actionId,
      actionName: cashActions.action,
      amount: cashLog.amount,
      comment: cashLog.comment,
      expenseTypeId: cashLog.expenseTypeId,
      expenseTypeName: expenseTypes.name,
      opexTypeId: cashLog.opexTypeId,
      opexTypeName: opexTypes.name,
      createdAt: sql<string>`${cashLog.createdAt}`.as("created_at"),
    })
    .from(cashLog)
    .innerJoin(cashActions, eq(cashLog.actionId, cashActions.id))
    .leftJoin(expenseTypes, eq(cashLog.expenseTypeId, expenseTypes.id))
    .leftJoin(opexTypes, eq(cashLog.opexTypeId, opexTypes.id))
    .orderBy(desc(cashLog.datetime));

  return rows;
}

export type CashActionRow = { id: number; action: string };
export type ExpenseTypeRow = { id: number; name: string; description: string | null };
export type OpexTypeRow = { id: number; name: string; description: string | null };

export async function getCashActions(): Promise<CashActionRow[]> {
  return db.select().from(cashActions);
}

export async function getExpenseTypes(): Promise<ExpenseTypeRow[]> {
  return db.select().from(expenseTypes);
}

export async function getOpexTypes(): Promise<OpexTypeRow[]> {
  return db.select().from(opexTypes);
}

// Income summary — aggregated from cash_log
export type IncomeSummaryRow = {
  yearMonth: string;
  totalCashIn: number;
  totalCashOut: number;
  netCash: number;
  txCount: number;
};

export async function getIncomeSummary(): Promise<IncomeSummaryRow[]> {
  const rows = await db
    .select({
      yearMonth: cashLog.yearMonth,
      actionName: cashActions.action,
      total: sql<string>`sum(${cashLog.amount})`.as("total"),
      txCount: sql<number>`count(*)`.as("tx_count"),
    })
    .from(cashLog)
    .innerJoin(cashActions, eq(cashLog.actionId, cashActions.id))
    .groupBy(cashLog.yearMonth, cashActions.action)
    .orderBy(desc(cashLog.yearMonth));

  // Pivot to yearMonth -> { in, out }
  const map = new Map<string, { cashIn: number; cashOut: number; txCount: number }>();
  for (const r of rows) {
    const ym = r.yearMonth || "Unknown";
    if (!map.has(ym)) map.set(ym, { cashIn: 0, cashOut: 0, txCount: 0 });
    const entry = map.get(ym)!;
    const amt = parseFloat(r.total || "0");
    const action = (r.actionName || "").toLowerCase();
    if (action.includes("in") || action.includes("revenue") || action.includes("income")) {
      entry.cashIn += amt;
    } else {
      entry.cashOut += amt;
    }
    entry.txCount += Number(r.txCount);
  }

  return Array.from(map.entries()).map(([yearMonth, data]) => ({
    yearMonth,
    totalCashIn: data.cashIn,
    totalCashOut: data.cashOut,
    netCash: data.cashIn - data.cashOut,
    txCount: data.txCount,
  }));
}
