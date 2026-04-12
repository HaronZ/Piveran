import { db } from "@/lib/db";
import {
  // Vendor lookups
  paymentTypes,
  units,
  inventoryActions,
  auditStatuses,
  prStatuses,
  prLineStatuses,
  salesTypes,
  // Garage lookups
  cashActions,
  expenseTypes,
  opexTypes,
  joStatuses,
  joMaterialStatuses,
  joLaborStatuses,
  // Security
  roles,
} from "@/lib/db/schema";

/**
 * Seeds all lookup/reference tables with data from the Excel workbooks.
 * Run this once after pushing the schema to Supabase.
 */
export async function seedLookupData() {
  console.log("🌱 Seeding lookup tables...\n");

  // ── Roles (Security_Users.xlsx → Roles sheet) ──
  await db
    .insert(roles)
    .values([
      { name: "Store Manager", description: "All dashboards and all views" },
      { name: "Admin", description: null },
      { name: "Corporator", description: "All Dashboards" },
      { name: "Purchaser", description: "No access to dashboards specially to profits and cash. Access to create PR" },
      { name: "Cashier", description: "No access to dashboards specially to profits and cash" },
      { name: "Sales Agent", description: "Limited access to parts only" },
      { name: "Security Admin", description: "Access to Security views" },
      { name: "Inventory Manager", description: "Access to inventory/audit" },
      { name: "Price Manager", description: "Access to updating prices" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Roles seeded");

  // ── Payment Types (Vendor.xlsx → Add_stock_payment_type) ──
  await db
    .insert(paymentTypes)
    .values([
      { type: "Cash" },
      { type: "Payable" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Payment Types seeded");

  // ── Units (Vendor.xlsx → Units) ──
  await db
    .insert(units)
    .values([
      { name: "Pcs" },
      { name: "Set" },
      { name: "Can" },
      { name: "ft" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Units seeded");

  // ── Inventory Actions (Vendor.xlsx → Inventory_Action) ──
  await db
    .insert(inventoryActions)
    .values([
      { name: "Add stock", addMinus: 1 },
      { name: "Sale", addMinus: -1 },
      { name: "Damage", addMinus: -1 },
      { name: "Lost", addMinus: -1 },
      { name: "Manual Add", addMinus: 1 },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Inventory Actions seeded");

  // ── Audit Statuses (Vendor.xlsx → Parts_audit_status) ──
  await db
    .insert(auditStatuses)
    .values([
      { status: "Good" },
      { status: "Missing Item" },
      { status: "Excess Item" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Audit Statuses seeded");

  // ── Sales Types (Vendor.xlsx → Sales_type) ──
  await db
    .insert(salesTypes)
    .values([
      { type: "Cash" },
      { type: "Collectible" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Sales Types seeded");

  // ── PR Statuses (Vendor.xlsx → PR_Status) ──
  await db
    .insert(prStatuses)
    .values([
      { status: "New" },
      { status: "Canvas On-going" },
      { status: "Purchase On-going" },
      { status: "Purchase Completed" },
      { status: "Waiting Delivery" },
      { status: "Partial Delivered" },
      { status: "All Delivered" },
      { status: "Canceled" },
      { status: "Pending Payment" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ PR Statuses seeded");

  // ── PR Line Statuses (Vendor.xlsx → PR_lines_Status) ──
  await db
    .insert(prLineStatuses)
    .values([
      { status: "New" },
      { status: "Canvas On-going" },
      { status: "For Purchase" },
      { status: "Purchased" },
      { status: "Waiting Delivery" },
      { status: "Delivered" },
      { status: "Returned" },
      { status: "Not Delivered" },
      { status: "Canceled" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ PR Line Statuses seeded");

  // ── Cash Actions (Vendor.xlsx → Cash_action) ──
  await db
    .insert(cashActions)
    .values([
      { action: "Cash-in" },
      { action: "Cash-out" },
      { action: "Expense" },
      { action: "Loan Payable" },
      { action: "Loan to others" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Cash Actions seeded");

  // ── Expense Types (Vendor.xlsx → Expense_Type) ──
  await db
    .insert(expenseTypes)
    .values([
      { name: "COGS", description: "Direct costs related to producing or purchasing goods sold by a business." },
      { name: "Operating Expense", description: "These are the day-to-day costs of running a business." },
      { name: "Non-operating Expense", description: "Expenses that are not directly tied to core business operations." },
      { name: "Taxes and Regulatory Fees", description: null },
      { name: "Extra Ordinary Expense", description: "One-time expenses such as lawsuits, natural disasters, or restructuring costs." },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Expense Types seeded");

  // ── Operating Expense Types (Vendor.xlsx → Operating_Expense_type) ──
  await db
    .insert(opexTypes)
    .values([
      { name: "SSS, PHIC, PAGIBIG", description: null },
      { name: "Taxes and Licenses", description: null },
      { name: "Utilities", description: null },
      { name: "Professional Fees", description: null },
      { name: "Repairs and Maintenance", description: null },
      { name: "Supplies used", description: null },
      { name: "Rental", description: null },
      { name: "Transportation and Travel", description: null },
      { name: "Amortization", description: null },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Operating Expense Types seeded");

  // ── Job Order Statuses (Garage_Customers.xlsx → Job_orders_status) ──
  await db
    .insert(joStatuses)
    .values([
      { status: "New" },
      { status: "Work in progress" },
      { status: "Waiting Parts" },
      { status: "Waiting Labor" },
      { status: "Waiting others" },
      { status: "Waiting Payment" },
      { status: "Completed" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ Job Order Statuses seeded");

  // ── JO Material Statuses (Garage_Customers.xlsx → Job_order_materials_status) ──
  await db
    .insert(joMaterialStatuses)
    .values([
      { status: "For Purchase" },
      { status: "Waiting Mechanic" },
      { status: "Waiting Others" },
      { status: "Installed/Applied" },
      { status: "Pending Payment" },
      { status: "Partially Paid" },
      { status: "Fully Paid" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ JO Material Statuses seeded");

  // ── JO Labor Statuses (Garage_Customers.xlsx → Job_order_labor_status) ──
  await db
    .insert(joLaborStatuses)
    .values([
      { status: "New" },
      { status: "Work in progress" },
      { status: "Waiting Parts" },
      { status: "Waiting Mechanic" },
      { status: "Waiting others" },
      { status: "Completed" },
    ])
    .onConflictDoNothing();
  console.log("  ✅ JO Labor Statuses seeded");

  console.log("\n🎉 All lookup tables seeded successfully!");
}
