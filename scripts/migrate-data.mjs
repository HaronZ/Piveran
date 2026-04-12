/**
 * Data Migration Script — Excel Data → Supabase PostgreSQL
 * 
 * Reads the 3 data files and inserts records into the correct tables.
 * Handles: ID mapping (Excel numeric/hex → UUID), FK references, 
 * computed columns (year_month, year_quarter, year), and empty rows.
 * 
 * Usage: node scripts/migrate-data.mjs
 */

import postgres from "postgres";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(PROJECT_ROOT, "..");

// ── Database Connection ──
const DATABASE_URL = "postgresql://postgres.kumgolykeplwcbvbwgry:Haronzie123!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL, { max: 5, idle_timeout: 30 });

// ── ID Mapping: Old Excel IDs → New UUIDs ──
const idMap = new Map();

function getUUID(table, oldId) {
  if (!oldId || oldId.trim() === "") return null;
  const key = `${table}:${oldId.trim()}`;
  if (idMap.has(key)) return idMap.get(key);
  const newId = randomUUID();
  idMap.set(key, newId);
  return newId;
}

function lookupUUID(table, oldId) {
  if (!oldId || oldId.trim() === "") return null;
  const key = `${table}:${oldId.trim()}`;
  return idMap.get(key) || null;
}

// ── Parser: Read pipe-delimited data files ──
function parseDataFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const sheets = {};
  let currentSheet = null;
  let headers = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const sheetMatch = trimmed.match(/^=== SHEET: (.+?) \| Rows: (\d+) \| Cols: (\d+) ===/);
    if (sheetMatch) {
      currentSheet = sheetMatch[1].trim();
      headers = null;
      sheets[currentSheet] = [];
      continue;
    }
    if (!currentSheet) continue;
    if (trimmed === "" || trimmed.startsWith("FILE:") || trimmed.startsWith("SHEETS:")) continue;

    const cells = line.split(" | ").map(c => c.trim());
    if (!headers) { headers = cells; continue; }
    if (cells.every(c => c === "" || c === undefined)) continue;

    const row = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = cells[i] !== undefined ? cells[i] : "";
    }
    sheets[currentSheet].push(row);
  }
  return sheets;
}

// ── Utilities ──
function computeTimeParts(dateStr) {
  if (!dateStr || dateStr.startsWith("=")) return { yearMonth: null, yearQuarter: null, year: null };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { yearMonth: null, yearQuarter: null, year: null };
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const q = Math.ceil(m / 3);
    return { yearMonth: `${y}${String(m).padStart(2, "0")}`, yearQuarter: `${y}Q${q}`, year: String(y) };
  } catch { return { yearMonth: null, yearQuarter: null, year: null }; }
}

function safeStr(val) { return val && val.trim() !== "" ? val.trim() : null; }
function safeNum(val) {
  if (!val || val.trim() === "" || val.startsWith("=")) return null;
  const n = parseFloat(val.trim());
  return isNaN(n) ? null : n;
}
function safeInt(val) {
  const n = safeNum(val);
  return n !== null ? Math.floor(n) : null;
}
function safeBool(val) {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v === "true" || v === "y" || v === "yes" || v === "1";
}
function safeDate(val) {
  if (!val || val.trim() === "" || val.startsWith("=")) return null;
  try {
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch { return null; }
}
function safeDateOnly(val) {
  if (!val || val.trim() === "" || val.startsWith("=")) return null;
  try {
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  } catch { return null; }
}

// ========================================
//  PHASE 0: SEED LOOKUP TABLES
// ========================================
async function seedLookupTables() {
  console.log("══════ Phase 0: Seeding Lookup Tables ══════");

  // Roles
  const rolesData = [
    [1,'Store Manager','All dashboards and all views'],
    [2,'Admin',null],
    [3,'Corporator','All Dashboards'],
    [4,'Purchaser','No access to dashboards specially to profits and cash. Access to create PR'],
    [5,'Cashier','No access to dashboards specially to profits and cash'],
    [6,'Sales Agent','Limited access to parts only'],
    [7,'Security Admin','Access to Security views'],
    [8,'Inventory Manager','Access to inventory/audit'],
    [9,'Price Manager','Access to updating prices'],
  ];
  for (const [id, name, desc] of rolesData) {
    await sql`INSERT INTO roles (id, name, description) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}, ${desc}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Roles");

  // Units
  for (const [id, name] of [[1,'Pcs'],[2,'Set'],[3,'Can'],[4,'ft']]) {
    await sql`INSERT INTO units (id, name) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Units");

  // Inventory Actions
  for (const [id, name, am] of [[1,'Add stock',1],[2,'Sale',-1],[3,'Damage',-1],[4,'Lost',-1],[5,'Manual Add',1]]) {
    await sql`INSERT INTO inventory_actions (id, name, add_minus) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}, ${am}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Inventory Actions");

  // Payment Types
  for (const [id, type] of [[1,'Cash'],[2,'Payable']]) {
    await sql`INSERT INTO payment_types (id, type) OVERRIDING SYSTEM VALUE VALUES (${id}, ${type}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Payment Types");

  // Sales Types
  for (const [id, type] of [[1,'Cash'],[2,'Collectible']]) {
    await sql`INSERT INTO sales_types (id, type) OVERRIDING SYSTEM VALUE VALUES (${id}, ${type}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Sales Types");

  // Audit Statuses
  for (const [id, status] of [[1,'Good'],[2,'Missing Item'],[3,'Excess Item']]) {
    await sql`INSERT INTO audit_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Audit Statuses");

  // Cash Actions
  for (const [id, action] of [[1,'Cash-in'],[2,'Cash-out'],[3,'Expense'],[4,'Loan Payable'],[5,'Loan to others']]) {
    await sql`INSERT INTO cash_actions (id, action) OVERRIDING SYSTEM VALUE VALUES (${id}, ${action}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Cash Actions");

  // Expense Types
  const expTypes = [
    [1,'COGS','Direct costs related to producing or purchasing goods sold by a business.'],
    [2,'Operating Expense','These are the day-to-day costs of running a business.'],
    [3,'Non-operating Expense','Expenses that are not directly tied to core business operations.'],
    [4,'Taxes and Regulatory Fees',null],
    [5,'Extra Ordinary Expense','One-time expenses such as lawsuits, natural disasters, or restructuring costs.'],
  ];
  for (const [id, name, desc] of expTypes) {
    await sql`INSERT INTO expense_types (id, name, description) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}, ${desc}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ Expense Types");

  // Operating Expense Types
  const opexData = [[1,'SSS, PHIC, PAGIBIG'],[2,'Taxes and Licenses'],[3,'Utilities'],[4,'Professional Fees'],
    [5,'Repairs and Maintenance'],[6,'Supplies used'],[7,'Rental'],[8,'Transportation and Travel'],[9,'Amortization'],[10,'Miscellaneous']];
  for (const [id, name] of opexData) {
    await sql`INSERT INTO opex_types (id, name) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ OPEX Types");

  // PR Statuses (including extra IDs 10, 11 that appear in data)
  const prSt = [[1,'New'],[2,'Canvas On-going'],[3,'Purchase On-going'],[4,'Purchase Completed'],
    [5,'Waiting Delivery'],[6,'Partial Delivered'],[7,'All Delivered'],[8,'Canceled'],
    [9,'Pending Payment'],[10,'Fully Stocked'],[11,'Completed']];
  for (const [id, status] of prSt) {
    await sql`INSERT INTO pr_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ PR Statuses");

  // PR Line Statuses (including extra IDs 10-15 that appear in data)
  const prLineSt = [[1,'New'],[2,'Canvas On-going'],[3,'For Purchase'],[4,'Purchased'],
    [5,'Waiting Delivery'],[6,'Delivered'],[7,'Returned'],[8,'Not Delivered'],[9,'Canceled'],
    [10,'Partially Delivered'],[11,'Completed'],[12,'Stocked']];
  for (const [id, status] of prLineSt) {
    await sql`INSERT INTO pr_line_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ PR Line Statuses");

  // JO Statuses
  const joSt = [[1,'New'],[2,'Work in progress'],[3,'Waiting Parts'],[4,'Waiting Labor'],
    [5,'Waiting others'],[6,'Waiting Payment'],[7,'Completed']];
  for (const [id, status] of joSt) {
    await sql`INSERT INTO jo_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ JO Statuses");

  // JO Material Statuses
  const joMatSt = [[1,'For Purchase'],[2,'Waiting Mechanic'],[3,'Waiting Others'],
    [4,'Installed/Applied'],[5,'Pending Payment'],[6,'Partially Paid'],[7,'Fully Paid']];
  for (const [id, status] of joMatSt) {
    await sql`INSERT INTO jo_material_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ JO Material Statuses");

  // JO Labor Statuses
  const joLabSt = [[1,'New'],[2,'Work in progress'],[3,'Waiting Parts'],[4,'Waiting Mechanic'],
    [5,'Waiting others'],[6,'Completed']];
  for (const [id, status] of joLabSt) {
    await sql`INSERT INTO jo_labor_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${id}, ${status}) ON CONFLICT (id) DO NOTHING`;
  }
  console.log("  ✅ JO Labor Statuses\n");
}

// ========================================
//  MIGRATION FUNCTIONS
// ========================================

async function migrateBrands(data) {
  const rows = data["Brands"] || [];
  console.log(`  📦 Brands: ${rows.length} rows`);
  for (const r of rows) {
    const name = safeStr(r["Brand Name"]); if (!name) continue;
    const id = getUUID("brands", r["ID"]);
    await sql`INSERT INTO brands (id, name) VALUES (${id}, ${name}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateCabinetCodes(data) {
  const rows = data["Cabinet_Codes"] || [];
  console.log(`  📦 Cabinet Codes: ${rows.length} rows`);
  for (const r of rows) {
    const code = safeStr(r["Cabinet Code"]); if (!code) continue;
    const id = getUUID("cabinet_codes", r["ID"]);
    await sql`INSERT INTO cabinet_codes (id, code, image_url, description) VALUES (${id}, ${code}, ${safeStr(r["Image"])}, ${safeStr(r["Description"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateVendors(data) {
  const rows = data["Vendor"] || [];
  console.log(`  📦 Vendors: ${rows.length} rows`);
  for (const r of rows) {
    const name = safeStr(r["Vendor Name"]); if (!name) continue;
    const id = getUUID("vendors", r["ID"]);
    await sql`INSERT INTO vendors (id, name, address, contact_number, link, comments, updated_at, created_at) 
      VALUES (${id}, ${name}, ${safeStr(r["Address"])}, ${safeStr(r["Contact Number"])}, ${safeStr(r["Link"])}, 
              ${safeStr(r["Comments"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateVendorContacts(data) {
  const rows = data["Vendor_contact_numbers"] || [];
  console.log(`  📦 Vendor Contacts: ${rows.length} rows`);
  for (const r of rows) {
    const number = safeStr(r["Number"]); if (!number) continue;
    const vendorId = lookupUUID("vendors", r["Vendor_ID"]); if (!vendorId) continue;
    const id = getUUID("vendor_contacts", r["ID"]);
    await sql`INSERT INTO vendor_contacts (id, vendor_id, number, label, created_at) VALUES (${id}, ${vendorId}, ${number}, ${safeStr(r["Label"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateParts(data) {
  const rows = data["Parts"] || [];
  console.log(`  📦 Parts: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const name = safeStr(r["Part Name"]); if (!name) continue;
    const id = getUUID("parts", r["ID"]);
    const brandId = lookupUUID("brands", r["Brand_ID"]);
    const cabinetId = lookupUUID("cabinet_codes", r["Cabinet_code_ID"]);
    await sql`INSERT INTO parts (id, name, brand_id, part_number, part_code, description, cabinet_code_id, 
              profile_photo_url, comment, critical_count, include_critical, updated_at, created_at)
      VALUES (${id}, ${name}, ${brandId}, ${safeStr(r["Part Number"])}, ${safeStr(r["Part Code"])}, ${safeStr(r["Description"])}, 
              ${cabinetId}, ${safeStr(r["Profile Photo"])}, ${safeStr(r["Comment"])}, ${safeInt(r["Critical_count"])}, 
              ${safeBool(r["Include in Critical Count"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migratePartsPhotos(data) {
  const rows = data["Parts_photos"] || [];
  console.log(`  📦 Parts Photos: ${rows.length} rows`);
  for (const r of rows) {
    const photo = safeStr(r["Photo"]); if (!photo) continue;
    const partId = lookupUUID("parts", r["Part_ID"]); if (!partId) continue;
    const id = getUUID("parts_photos", r["ID"]);
    await sql`INSERT INTO parts_photos (id, part_id, photo_url, notes, date) VALUES (${id}, ${partId}, ${photo}, ${safeStr(r["Notes"])}, ${safeDate(r["Date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migratePartsPrices(data) {
  const rows = data["Parts_price"] || [];
  console.log(`  📦 Parts Prices: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const price = safeNum(r["Price"]); if (price === null) continue;
    const partId = lookupUUID("parts", r["Part_ID"]); if (!partId) continue;
    const id = getUUID("parts_prices", r["ID"]);
    await sql`INSERT INTO parts_prices (id, part_id, price, comment, date) VALUES (${id}, ${partId}, ${price}, ${safeStr(r["Comment"])}, ${safeDate(r["Date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migratePartsSuppliers(data) {
  const rows = data["Parts_suppliers"] || [];
  console.log(`  📦 Parts Suppliers: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const partId = lookupUUID("parts", r["Part_ID"]);
    const vendorId = lookupUUID("vendors", r["Supplier_ID"]);
    if (!partId || !vendorId) continue;
    const id = getUUID("parts_suppliers", r["ID"]);
    await sql`INSERT INTO parts_suppliers (id, part_id, vendor_id, price, comment, link, last_update) 
      VALUES (${id}, ${partId}, ${vendorId}, ${safeNum(r["Price"])}, ${safeStr(r["Comment"])}, ${safeStr(r["Link"])}, ${safeDate(r["Last Update"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateInventoryLog(data) {
  const rows = data["Inventory_Log"] || [];
  console.log(`  📦 Inventory Log: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const partId = lookupUUID("parts", r["Part_ID"]);
    const actionId = safeInt(r["Action_ID"]);
    if (!partId || !actionId) continue;
    const id = getUUID("inventory_log", r["ID"]);
    const vendorId = lookupUUID("vendors", r["Vendor_ID"]);
    const dateVal = safeDate(r["Date"]); if (!dateVal) continue;
    const { yearMonth, yearQuarter, year } = computeTimeParts(r["Date"]);
    await sql`INSERT INTO inventory_log (id, date, vendor_id, part_id, action_id, unit_id, quantity, unit_price, total_price, comments, 
              last_stock_price, estimate_profit, year_month, year_quarter, year, sales_type_id, payment_type_id, payable_due_date, 
              updated_at, created_at, add_stock_link)
      VALUES (${id}, ${dateVal}, ${vendorId}, ${partId}, ${actionId}, ${safeInt(r["Unit_ID"])}, ${safeInt(r["Quantity"])}, 
              ${safeNum(r["Unit Price"])}, ${safeNum(r["Total Price"])}, ${safeStr(r["Comments"])}, ${safeNum(r["Last Stock Price"])}, 
              ${safeNum(r["Estimate Profit"])}, ${yearMonth}, ${yearQuarter}, ${year}, ${safeInt(r["Sales_Type"])}, 
              ${safeInt(r["Add_stock_Payment_Type"])}, ${safeDateOnly(r["Payable_due_date"])}, ${safeDate(r["Last_update"])}, 
              ${safeDate(r["Created_date"])}, ${safeStr(r["Add_stock_link"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 500 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateInventoryValue(data) {
  const rows = data["Inventory_value"] || [];
  console.log(`  📦 Inventory Value: ${rows.length} rows`);
  for (const r of rows) {
    const id = getUUID("inventory_value", r["ID"]);
    await sql`INSERT INTO inventory_value (id, current_value, date, quarter, year, year_quarter)
      VALUES (${id}, ${safeNum(r["Current Value"])}, ${safeDateOnly(r["Date"])}, ${safeStr(r["Quarter"])}, ${safeInt(r["Year"])}, ${safeStr(r["Year Quarter"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migratePartsAudit(data) {
  const rows = data["Parts_audit"] || [];
  console.log(`  📦 Parts Audit: ${rows.length} rows (please wait...)`);
  let c = 0;
  for (const r of rows) {
    const partId = lookupUUID("parts", r["Part"]);
    const statusId = safeInt(r["Status"]);
    if (!partId || !statusId) continue;
    const id = getUUID("parts_audit", r["ID"]);
    await sql`INSERT INTO parts_audit (id, part_id, count, status_id, current_stock, comment, updated_at, created_at)
      VALUES (${id}, ${partId}, ${safeInt(r["Count"])}, ${statusId}, ${safeInt(r["Part Current Stock"])}, ${safeStr(r["Comment"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 2000 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migratePurchaseRequests(data) {
  const rows = data["Purchase_requests"] || [];
  console.log(`  📦 Purchase Requests: ${rows.length} rows`);
  for (const r of rows) {
    const prNum = safeStr(r["Purchase_request_number"]); if (!prNum) continue;
    const id = getUUID("purchase_requests", r["ID"]);
    await sql`INSERT INTO purchase_requests (id, pr_number, date, status_id, label, comment, updated_at, created_at)
      VALUES (${id}, ${prNum}, ${safeDate(r["Date"])}, ${safeInt(r["Status"])}, ${safeStr(r["Label"])}, ${safeStr(r["Comment"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migratePRComments(data) {
  const rows = data["PR_comments"] || [];
  console.log(`  📦 PR Comments: ${rows.length} rows`);
  for (const r of rows) {
    const comment = safeStr(r["Comment"]); if (!comment) continue;
    const prId = lookupUUID("purchase_requests", r["PR_ID"]); if (!prId) continue;
    const id = getUUID("pr_comments", r["ID"]);
    await sql`INSERT INTO pr_comments (id, pr_id, comment, created_at) VALUES (${id}, ${prId}, ${comment}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migratePRLines(data) {
  const rows = data["PR_lines"] || [];
  console.log(`  📦 PR Lines: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const prId = lookupUUID("purchase_requests", r["Purchase_request_ID"]); if (!prId) continue;
    const id = getUUID("pr_lines", r["ID"]);
    const partId = lookupUUID("parts", r["Part_ID"]);
    const supplierId = lookupUUID("vendors", r["Supplier_ID"]);
    await sql`INSERT INTO pr_lines (id, pr_id, part_id, quantity, unit_price, total_price, target_price, total_target_price,
              projected_profit, status_id, comment, link, supplier_id, updated_at, created_at)
      VALUES (${id}, ${prId}, ${partId}, ${safeInt(r["Quantity"])}, ${safeNum(r["Unit_price"])}, ${safeNum(r["Total_price"])}, 
              ${safeNum(r["Target Price"])}, ${safeNum(r["Total Target Price"])}, ${safeNum(r["Projected Profit"])}, 
              ${safeInt(r["Status"])}, ${safeStr(r["Comment"])}, ${safeStr(r["Link"])}, ${supplierId}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 50 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migratePRLineComments(data) {
  const rows = data["PR_line_comments"] || [];
  console.log(`  📦 PR Line Comments: ${rows.length} rows`);
  for (const r of rows) {
    const comment = safeStr(r["Comment"]); if (!comment) continue;
    const prLineId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!prLineId) continue;
    const id = getUUID("pr_line_comments", r["ID"]);
    await sql`INSERT INTO pr_line_comments (id, pr_line_id, comment, created_at) VALUES (${id}, ${prLineId}, ${comment}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migratePRLinePhotos(data) {
  const rows = data["PR_Lines_photos"] || [];
  console.log(`  📦 PR Line Photos: ${rows.length} rows`);
  for (const r of rows) {
    const photo = safeStr(r["Photo"]); if (!photo) continue;
    const prLineId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!prLineId) continue;
    const id = getUUID("pr_line_photos", r["ID"]);
    await sql`INSERT INTO pr_line_photos (id, pr_line_id, photo_url, comment, created_at) VALUES (${id}, ${prLineId}, ${photo}, ${safeStr(r["Comment"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateCashLog(data) {
  const rows = data["Cash_Log"] || [];
  console.log(`  📦 Cash Log: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const amount = safeNum(r["Amount"]);
    const actionId = safeInt(r["Action_ID"]);
    if (amount === null || !actionId) continue;
    const id = getUUID("cash_log", r["ID"]);
    const datetime = safeDate(r["Date_time"]);
    const dateOnly = safeDateOnly(r["Date"]);
    if (!datetime || !dateOnly) continue;
    const { yearMonth, yearQuarter, year } = computeTimeParts(r["Date"]);
    await sql`INSERT INTO cash_log (id, datetime, date, year_month, year_quarter, year, action_id, amount, comment, expense_type_id, opex_type_id, updated_at, created_at)
      VALUES (${id}, ${datetime}, ${dateOnly}, ${yearMonth}, ${yearQuarter}, ${year}, ${actionId}, ${amount}, ${safeStr(r["Comment"])}, 
              ${safeInt(r["Expense Type"])}, ${safeInt(r["Operating Expense Type"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

// ── SECURITY ──
async function migrateUsers(data) {
  const rows = data["Users"] || [];
  console.log(`  📦 Users: ${rows.length} rows`);
  for (const r of rows) {
    const email = safeStr(r["Email"]); if (!email) continue;
    const id = getUUID("users", r["ID"]);
    // Note: " Last Name" has a leading space in the header
    await sql`INSERT INTO users (id, email, first_name, last_name, nick_name, photo_url, updated_at, created_at)
      VALUES (${id}, ${email}, ${safeStr(r["First Name"])}, ${safeStr(r[" Last Name"]) || safeStr(r["Last Name"])}, 
              ${safeStr(r["Nick Name"])}, ${safeStr(r["Photo"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateRoleViews(data) {
  const rows = data["Role_views"] || [];
  console.log(`  📦 Role Views: ${rows.length} rows`);
  for (const r of rows) {
    const viewName = safeStr(r["View"]); const roleId = safeInt(r["Role"]);
    if (!viewName || !roleId) continue;
    const id = getUUID("role_views", r["ID"]);
    await sql`INSERT INTO role_views (id, role_id, view_name, created_at) VALUES (${id}, ${roleId}, ${viewName}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateUserRoles(data) {
  const rows = data["User_roles"] || [];
  console.log(`  📦 User Roles: ${rows.length} rows`);
  for (const r of rows) {
    const userId = lookupUUID("users", r["User"]);
    const roleId = safeInt(r["Role"]);
    if (!userId || !roleId) continue;
    const id = getUUID("user_roles", r["ID"]);
    await sql`INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (${id}, ${userId}, ${roleId}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

// ── GARAGE ──
async function migrateCustomers(data) {
  const rows = data["Customers"] || [];
  console.log(`  📦 Customers: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const firstName = safeStr(r["First Name"]); if (!firstName) continue;
    const id = getUUID("customers", r["ID"]);
    await sql`INSERT INTO customers (id, first_name, last_name, middle_name, nick_name, suffix, birthday, primary_contact, email, updated_at, created_at)
      VALUES (${id}, ${firstName}, ${safeStr(r["Last Name"])}, ${safeStr(r["Middle Name"])}, ${safeStr(r["Nick Name"])}, 
              ${safeStr(r["Suffix"])}, ${safeDateOnly(r["Birthday"])}, ${safeStr(r["Primary Contact Number"])}, ${safeStr(r["Email"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 50 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateCustomerAddresses(data) {
  const rows = data["address"] || [];
  console.log(`  📦 Customer Addresses: ${rows.length} rows`);
  for (const r of rows) {
    const customerId = lookupUUID("customers", r["Customer"]); if (!customerId) continue;
    const id = getUUID("customer_addresses", r["ID"]);
    await sql`INSERT INTO customer_addresses (id, customer_id, street, village, barangay, city, province, zip_code, created_at)
      VALUES (${id}, ${customerId}, ${safeStr(r["Street"])}, ${safeStr(r["Village"])}, ${safeStr(r["Barangay"])}, 
              ${safeStr(r["City"])}, ${safeStr(r["Province"])}, ${safeStr(r["Zip Code"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateCars(data) {
  const rows = data["Cars"] || [];
  console.log(`  📦 Cars: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const id = getUUID("cars", r["ID"]);
    const ownerId = lookupUUID("customers", r["Primary Owner"]);
    await sql`INSERT INTO cars (id, make, model, year, color, plate_number, profile_photo_url, primary_owner_id, updated_at, created_at)
      VALUES (${id}, ${safeStr(r["Make"])}, ${safeStr(r["Model"])}, ${safeStr(r["Year"])}, ${safeStr(r["Color"])}, 
              ${safeStr(r["Plate Number"])}, ${safeStr(r["Profile Photo"])}, ${ownerId}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateCashiers(data) {
  const rows = data["Cashiers"] || [];
  console.log(`  📦 Cashiers: ${rows.length} rows`);
  for (const r of rows) {
    const firstName = safeStr(r["First Name"]); if (!firstName) continue;
    const id = getUUID("cashiers", r["ID"]);
    await sql`INSERT INTO cashiers (id, first_name, middle_name, last_name, contact_number, updated_at, created_at)
      VALUES (${id}, ${firstName}, ${safeStr(r["Middle Name"])}, ${safeStr(r["Last Name"])}, ${safeStr(r["Contact Number"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateMechanics(data) {
  const rows = data["Mechanics"] || [];
  console.log(`  📦 Mechanics: ${rows.length} rows`);
  for (const r of rows) {
    const firstName = safeStr(r["First Name"]); if (!firstName) continue;
    const id = getUUID("mechanics", r["ID"]);
    await sql`INSERT INTO mechanics (id, first_name, last_name, nick_name, primary_contact, updated_at, created_at)
      VALUES (${id}, ${firstName}, ${safeStr(r["Last Name"])}, ${safeStr(r["Nick Name"])}, ${safeStr(r["Primary Contact Number"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateLaborTypes(data) {
  const rows = data["Labor Types"] || [];
  console.log(`  📦 Labor Types: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const name = safeStr(r["Name"]); if (!name) continue;
    const id = getUUID("labor_types", r["ID"]);
    await sql`INSERT INTO labor_types (id, name, description, default_price, updated_at, created_at)
      VALUES (${id}, ${name}, ${safeStr(r["Description"])}, ${safeNum(r["Price"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateQualityChecklists(data) {
  const rows = data["Quality Checklist"] || [];
  console.log(`  📦 Quality Checklists: ${rows.length} rows`);
  for (const r of rows) {
    const name = safeStr(r["Check List Name"]); if (!name) continue;
    const id = getUUID("quality_checklists", r["ID"]);
    await sql`INSERT INTO quality_checklists (id, name, description, updated_at, created_at)
      VALUES (${id}, ${name}, ${safeStr(r["Description"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateJobOrders(data) {
  const rows = data["Job_Orders"] || [];
  console.log(`  📦 Job Orders: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const joNumber = safeStr(r["Job Order Number"]); if (!joNumber) continue;
    const id = getUUID("job_orders", r["ID"]);
    const customerId = lookupUUID("customers", r["Primary Contact"]);
    const carId = lookupUUID("cars", r["Car"]);
    await sql`INSERT INTO job_orders (id, jo_number, customer_id, car_id, checkin_date, checkout_date, status_id, discount, comment, updated_at, created_at)
      VALUES (${id}, ${joNumber}, ${customerId}, ${carId}, ${safeDate(r["Check-in Date"])}, ${safeDate(r["Check-out Date"])}, 
              ${safeInt(r["Status"])}, ${safeNum(r["Discount"])}, ${safeStr(r["Comment"])}, ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 200 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOPayments(data) {
  const rows = data["Job_order_payments"] || [];
  console.log(`  📦 JO Payments: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const joId = lookupUUID("job_orders", r["Job Order"]);
    const amount = safeNum(r["Amount Paid"]);
    if (!joId || amount === null) continue;
    const id = getUUID("jo_payments", r["ID"]);
    const cashierId = lookupUUID("cashiers", r["Prepaired By"]);
    await sql`INSERT INTO jo_payments (id, jo_id, or_number, si_number, amount_paid, date_paid, cashier_id, comment, created_at)
      VALUES (${id}, ${joId}, ${safeStr(r["OR Number"])}, ${safeStr(r["Sales Invoice Number"])}, ${amount}, 
              ${safeDateOnly(r["Date Paid"])}, ${cashierId}, ${safeStr(r["Comment"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 200 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOMaterials(data) {
  const rows = data["Job_order_materials"] || [];
  console.log(`  📦 JO Materials: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    const id = getUUID("jo_materials", r["ID"]);
    const partId = lookupUUID("parts", r["Material"]);
    await sql`INSERT INTO jo_materials (id, jo_id, part_id, price, quantity, total_price, discount, final_price, status_id, 
              provided_inhouse, include_in_total, date, year_month, comment, updated_at, created_at)
      VALUES (${id}, ${joId}, ${partId}, ${safeNum(r["Price"])}, ${safeInt(r["Quantity"])}, ${safeNum(r["Total Price"])}, 
              ${safeNum(r["Discount"])}, ${safeNum(r["Final Price"])}, ${safeInt(r["Status"])}, ${safeBool(r["Provided In-house"])}, 
              ${safeBool(r["Include in Total"])}, ${safeDate(r["Date"])}, ${safeStr(r["Year_Month"])}, ${safeStr(r["Comment"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 500 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOLabors(data) {
  const rows = data["Job_order_labors"] || [];
  console.log(`  📦 JO Labors: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    const id = getUUID("jo_labors", r["ID"]);
    const laborTypeId = lookupUUID("labor_types", r["Labor"]);
    await sql`INSERT INTO jo_labors (id, jo_id, labor_type_id, price, discount, total_price, status_id, target_date, comment, updated_at, created_at)
      VALUES (${id}, ${joId}, ${laborTypeId}, ${safeNum(r["Price"])}, ${safeNum(r["Discount"])}, ${safeNum(r["Total Price"])}, 
              ${safeInt(r["Status"])}, ${safeDateOnly(r["Target Date"])}, ${safeStr(r["Comment"])}, 
              ${safeDate(r["Last_update"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 200 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOLaborMechanics(data) {
  const rows = data["Job_order_labor_mechanics"] || [];
  console.log(`  📦 JO Labor Mechanics: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const joLaborId = lookupUUID("jo_labors", r["Job Order Labor"]);
    const mechanicId = lookupUUID("mechanics", r["Mechanic"]);
    if (!joLaborId || !mechanicId) continue;
    const id = getUUID("jo_labor_mechanics", r["ID"]);
    await sql`INSERT INTO jo_labor_mechanics (id, jo_labor_id, mechanic_id, comment, created_at)
      VALUES (${id}, ${joLaborId}, ${mechanicId}, ${safeStr(r["Comment"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 500 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOComments(data) {
  const rows = data["Job_order_comments"] || [];
  console.log(`  📦 JO Comments: ${rows.length} rows`);
  for (const r of rows) {
    const comment = safeStr(r["Comment"]); if (!comment) continue;
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    const id = getUUID("jo_comments", r["ID"]);
    await sql`INSERT INTO jo_comments (id, jo_id, comment_from, comment, created_at)
      VALUES (${id}, ${joId}, ${safeStr(r["Comment From"])}, ${comment}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateJOMaterialComments(data) {
  const rows = data["JO_materials_comments"] || [];
  console.log(`  📦 JO Material Comments: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const comment = safeStr(r["Comment"]); if (!comment) continue;
    const matId = lookupUUID("jo_materials", r["JO Material"]); if (!matId) continue;
    const id = getUUID("jo_material_comments", r["ID"]);
    await sql`INSERT INTO jo_material_comments (id, jo_material_id, comment, created_at)
      VALUES (${id}, ${matId}, ${comment}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 200 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateJOLaborComments(data) {
  const rows = data["JO_labor_comments"] || [];
  console.log(`  📦 JO Labor Comments: ${rows.length} rows`);
  let c = 0;
  for (const r of rows) {
    const comment = safeStr(r["Comment"]); if (!comment) continue;
    const laborId = lookupUUID("jo_labors", r["JO Labor"]); if (!laborId) continue;
    const id = getUUID("jo_labor_comments", r["ID"]);
    await sql`INSERT INTO jo_labor_comments (id, jo_labor_id, comment, created_at)
      VALUES (${id}, ${laborId}, ${comment}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
    c++; if (c % 100 === 0) console.log(`    ... ${c} rows`);
  }
  console.log(`    ✅ ${c} total`);
}

async function migrateLaborTypeChecklists(data) {
  const rows = data["Lapor Type Quality Checklist"] || [];
  console.log(`  📦 Labor Type Checklists: ${rows.length} rows`);
  for (const r of rows) {
    const laborTypeId = lookupUUID("labor_types", r["Labor Type"]);
    const checklistId = lookupUUID("quality_checklists", r["Quality Checklist"]);
    if (!laborTypeId || !checklistId) continue;
    const id = randomUUID();
    await sql`INSERT INTO labor_type_checklists (id, labor_type_id, checklist_id, created_at)
      VALUES (${id}, ${laborTypeId}, ${checklistId}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateChecklistPhotos(data) {
  const rows = data["Quality Checklist Photos"] || [];
  console.log(`  📦 Checklist Photos: ${rows.length} rows`);
  for (const r of rows) {
    const photo = safeStr(r["Photo"]); if (!photo) continue;
    const clId = lookupUUID("quality_checklists", r["Quality Checklist"]); if (!clId) continue;
    const id = getUUID("checklist_photos", r["ID"]);
    await sql`INSERT INTO checklist_photos (id, checklist_id, photo_url, comment, created_at)
      VALUES (${id}, ${clId}, ${photo}, ${safeStr(r["Comment"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

async function migrateChecklistVideos(data) {
  const rows = data["Quality Checklist Videos"] || [];
  console.log(`  📦 Checklist Videos: ${rows.length} rows`);
  for (const r of rows) {
    const video = safeStr(r["Video"]); if (!video) continue;
    const clId = lookupUUID("quality_checklists", r["Quality Checklist"]); if (!clId) continue;
    const id = getUUID("checklist_videos", r["ID"]);
    await sql`INSERT INTO checklist_videos (id, checklist_id, video_url, comment, created_at)
      VALUES (${id}, ${clId}, ${video}, ${safeStr(r["Comment"])}, ${safeDate(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  }
}

// ========================================
//  MAIN
// ========================================
async function main() {
  const t0 = Date.now();
  console.log("\n🚀 Starting data migration to Supabase...\n");
  console.log("📂 Reading data files...");

  const vendorData = parseDataFile(resolve(DATA_DIR, "Vendor_data.txt"));
  const garageData = parseDataFile(resolve(DATA_DIR, "Garage_Customers_data.txt"));
  const securityData = parseDataFile(resolve(DATA_DIR, "Security_Users_data.txt"));

  console.log(`  ✅ Vendor: ${Object.keys(vendorData).length} sheets`);
  console.log(`  ✅ Garage: ${Object.keys(garageData).length} sheets`);
  console.log(`  ✅ Security: ${Object.keys(securityData).length} sheets\n`);

  await seedLookupTables();

  console.log("══════ Phase 1: Core Entities ══════");
  await migrateUsers(securityData);
  await migrateBrands(vendorData);
  await migrateCabinetCodes(vendorData);
  await migrateVendors(vendorData);
  await migrateCashiers(garageData);
  await migrateMechanics(garageData);
  await migrateLaborTypes(garageData);
  await migrateQualityChecklists(garageData);
  console.log("");

  console.log("══════ Phase 2: Dependent Entities ══════");
  await migrateRoleViews(securityData);
  await migrateUserRoles(securityData);
  await migrateVendorContacts(vendorData);
  await migrateParts(vendorData);
  await migrateCustomers(garageData);
  console.log("");

  console.log("══════ Phase 3: Second-Level Entities ══════");
  await migratePartsPhotos(vendorData);
  await migratePartsPrices(vendorData);
  await migratePartsSuppliers(vendorData);
  await migrateInventoryValue(vendorData);
  await migrateCustomerAddresses(garageData);
  await migrateCars(garageData);
  await migrateLaborTypeChecklists(garageData);
  await migrateChecklistPhotos(garageData);
  await migrateChecklistVideos(garageData);
  await migratePurchaseRequests(vendorData);
  console.log("");

  console.log("══════ Phase 4: High-Volume Tables ══════");
  await migrateInventoryLog(vendorData);
  await migrateCashLog(vendorData);
  await migratePartsAudit(vendorData);
  await migratePRComments(vendorData);
  await migratePRLines(vendorData);
  await migratePRLineComments(vendorData);
  await migratePRLinePhotos(vendorData);
  console.log("");

  console.log("══════ Phase 5: Job Orders & Children ══════");
  await migrateJobOrders(garageData);
  await migrateJOPayments(garageData);
  await migrateJOMaterials(garageData);
  await migrateJOLabors(garageData);
  await migrateJOComments(garageData);
  await migrateJOLaborMechanics(garageData);
  await migrateJOMaterialComments(garageData);
  await migrateJOLaborComments(garageData);
  console.log("");

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n🎉 Migration complete! Total ID mappings: ${idMap.size} | Time: ${elapsed}s`);
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  sql.end();
  process.exit(1);
});
