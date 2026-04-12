import { db } from "@/lib/db";
import { sql, count, sum, eq, and, gte, lte } from "drizzle-orm";
import {
  parts,
  inventoryValue,
  purchaseRequests,
  vendors,
} from "@/lib/db/schema/vendor";
import {
  customers,
  cars,
  jobOrders,
  joPayments,
} from "@/lib/db/schema/garage";

export interface DashboardData {
  totalParts: number;
  totalCustomers: number;
  totalCars: number;
  activeJOs: number;
  pendingPaymentJOs: number;
  totalVendors: number;
  pendingPRs: number;
  waitingDeliveryPRs: number;
  totalJOs: number;
  completedJOs: number;
  cancelledJOs: number;
  inventoryCurrentValue: number | null;
  inventoryValueDate: string | null;
  totalRevenue: number;
  lowStockParts: { name: string; stock: number; critical: number }[];
  waitingDeliveryPRNames: string[];
  monthlyRevenue: { month: string; revenue: number }[];
  joStatusBreakdown: { status: string; count: number; color: string }[];
  topBrands: { name: string; count: number }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    partsCount,
    customersCount,
    carsCount,
    activeJOsResult,
    pendingPaymentJOsResult,
    completedJOsResult,
    cancelledJOsResult,
    vendorsCount,
    pendingPRsResult,
    waitingDeliveryPRsResult,
    totalJOsResult,
    invValue,
    revenueResult,
    lowStockResult,
    waitingPRNamesResult,
    monthlyRevenueResult,
    topBrandsResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(parts),
    db.select({ value: count() }).from(customers),
    db.select({ value: count() }).from(cars),
    db
      .select({ value: count() })
      .from(jobOrders)
      .where(and(gte(jobOrders.statusId, 1), lte(jobOrders.statusId, 5))),
    db
      .select({ value: count() })
      .from(jobOrders)
      .where(eq(jobOrders.statusId, 6)),
    db
      .select({ value: count() })
      .from(jobOrders)
      .where(eq(jobOrders.statusId, 7)),
    db
      .select({ value: count() })
      .from(jobOrders)
      .where(eq(jobOrders.statusId, 8)),
    db.select({ value: count() }).from(vendors),
    db
      .select({ value: count() })
      .from(purchaseRequests)
      .where(
        and(
          gte(purchaseRequests.statusId, 1),
          lte(purchaseRequests.statusId, 6)
        )
      ),
    db
      .select({ value: count() })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.statusId, 5)),
    db.select({ value: count() }).from(jobOrders),
    db
      .select({
        value: inventoryValue.currentValue,
        date: inventoryValue.date,
      })
      .from(inventoryValue)
      .orderBy(sql`${inventoryValue.date} DESC NULLS LAST`)
      .limit(1),
    db
      .select({ total: sum(joPayments.amountPaid) })
      .from(joPayments),
    db.execute(sql`
      SELECT p.name, 
             COALESCE(SUM(CASE WHEN il.action_id IN (1,5) THEN il.quantity ELSE -il.quantity END), 0) as current_stock,
             COALESCE(p.critical_count, 0) as critical_count
      FROM parts p
      LEFT JOIN inventory_log il ON il.part_id = p.id
      WHERE p.include_critical = true AND p.critical_count > 0
      GROUP BY p.id, p.name, p.critical_count
      HAVING COALESCE(SUM(CASE WHEN il.action_id IN (1,5) THEN il.quantity ELSE -il.quantity END), 0) <= p.critical_count
      ORDER BY current_stock ASC
      LIMIT 10
    `),
    db
      .select({ prNumber: purchaseRequests.prNumber })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.statusId, 5))
      .limit(5),
    // Monthly revenue (last 6 months from JO payments)
    db.execute(sql`
      SELECT TO_CHAR(date_trunc('month', jp.date_paid), 'Mon') as month,
             EXTRACT(MONTH FROM date_trunc('month', jp.date_paid)) as month_num,
             EXTRACT(YEAR FROM date_trunc('month', jp.date_paid)) as year_num,
             COALESCE(SUM(jp.amount_paid), 0) as revenue
      FROM jo_payments jp
      WHERE jp.date_paid IS NOT NULL
      GROUP BY date_trunc('month', jp.date_paid)
      ORDER BY year_num DESC, month_num DESC
      LIMIT 6
    `),
    // Top brands by part count
    db.execute(sql`
      SELECT b.name, COUNT(p.id) as part_count
      FROM brands b
      JOIN parts p ON p.brand_id = b.id
      GROUP BY b.id, b.name
      ORDER BY part_count DESC
      LIMIT 5
    `),
  ]);

  const activeJOs = activeJOsResult[0]?.value ?? 0;
  const pendingPaymentJOs = pendingPaymentJOsResult[0]?.value ?? 0;
  const completedJOs = completedJOsResult[0]?.value ?? 0;
  const cancelledJOs = cancelledJOsResult[0]?.value ?? 0;

  // Build JO status breakdown for pie chart
  const joStatusBreakdown = [
    { status: "Active", count: activeJOs, color: "#f59e0b" },
    { status: "Pending Payment", count: pendingPaymentJOs, color: "#3b82f6" },
    { status: "Completed", count: completedJOs, color: "#22c55e" },
    { status: "Cancelled", count: cancelledJOs, color: "#ef4444" },
  ].filter((s) => s.count > 0);

  // Monthly revenue data (reversed so oldest first for chart)
  const monthlyRevenue = (monthlyRevenueResult as unknown as any[])
    .map((r: any) => ({
      month: r.month,
      revenue: Number(r.revenue),
    }))
    .reverse();

  const topBrands = (topBrandsResult as unknown as any[]).map((r: any) => ({
    name: r.name,
    count: Number(r.part_count),
  }));

  return {
    totalParts: partsCount[0]?.value ?? 0,
    totalCustomers: customersCount[0]?.value ?? 0,
    totalCars: carsCount[0]?.value ?? 0,
    activeJOs,
    pendingPaymentJOs,
    completedJOs,
    cancelledJOs,
    totalVendors: vendorsCount[0]?.value ?? 0,
    pendingPRs: pendingPRsResult[0]?.value ?? 0,
    waitingDeliveryPRs: waitingDeliveryPRsResult[0]?.value ?? 0,
    totalJOs: totalJOsResult[0]?.value ?? 0,
    inventoryCurrentValue: invValue[0]?.value
      ? Number(invValue[0].value)
      : null,
    inventoryValueDate: invValue[0]?.date ?? null,
    totalRevenue: revenueResult[0]?.total
      ? Number(revenueResult[0].total)
      : 0,
    lowStockParts: (lowStockResult as unknown as any[]).map((r: any) => ({
      name: r.name,
      stock: Number(r.current_stock),
      critical: Number(r.critical_count),
    })),
    waitingDeliveryPRNames: waitingPRNamesResult.map((r) => r.prNumber),
    monthlyRevenue,
    joStatusBreakdown,
    topBrands,
  };
}
