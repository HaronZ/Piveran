/**
 * FULL Data Migration — Excel (.xlsx) → Supabase PostgreSQL
 * 
 * Reads the 3 Excel workbooks directly and inserts ALL records.
 * Reuses the same table mapping logic from the sample migration.
 * 
 * Usage: node scripts/migrate-full.mjs
 */

import postgres from "postgres";
import XLSX from "xlsx";
import { randomUUID } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(PROJECT_ROOT, "..");

const DATABASE_URL = "postgresql://postgres.kumgolykeplwcbvbwgry:Haronzie123!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL, { max: 5, idle_timeout: 30 });

// ── ID Mapping ──
const idMap = new Map();
function getUUID(table, oldId) {
  if (!oldId || String(oldId).trim() === "") return null;
  const key = `${table}:${String(oldId).trim()}`;
  if (idMap.has(key)) return idMap.get(key);
  const newId = randomUUID();
  idMap.set(key, newId);
  return newId;
}
function lookupUUID(table, oldId) {
  if (!oldId || String(oldId).trim() === "") return null;
  return idMap.get(`${table}:${String(oldId).trim()}`) || null;
}

// ── Read Excel workbook → { sheetName: [rows] } ──
function readWorkbook(filename) {
  const path = resolve(DATA_DIR, filename);
  console.log(`  📖 Reading ${filename}...`);
  const wb = XLSX.readFile(path, { cellDates: true });
  const sheets = {};
  for (const name of wb.SheetNames) {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: false });
    sheets[name] = data;
    console.log(`    ${name}: ${data.length} rows`);
  }
  return sheets;
}

// ── Utilities ──
function s(val) { return val !== null && val !== undefined && String(val).trim() !== "" ? String(val).trim() : null; }
function n(val) { if (val === null || val === undefined || String(val).trim() === "") return null; const x = parseFloat(val); return isNaN(x) ? null : x; }
function i(val) { const x = n(val); return x !== null ? Math.floor(x) : null; }
function b(val) { if (!val) return false; const v = String(val).trim().toLowerCase(); return v === "true" || v === "y" || v === "yes" || v === "1"; }
function dt(val) {
  if (!val || String(val).trim() === "") return null;
  try {
    const d = val instanceof Date ? val : new Date(String(val).trim());
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch { return null; }
}
function dd(val) {
  if (!val || String(val).trim() === "") return null;
  try {
    const d = val instanceof Date ? val : new Date(String(val).trim());
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  } catch { return null; }
}
function timeParts(val) {
  const d = val instanceof Date ? val : (val ? new Date(String(val)) : null);
  if (!d || isNaN(d.getTime())) return { ym: null, yq: null, y: null };
  const yr = d.getFullYear(), mo = d.getMonth() + 1;
  return { ym: `${yr}${String(mo).padStart(2,"0")}`, yq: `${yr}Q${Math.ceil(mo/3)}`, y: String(yr) };
}

// ── Batch insert helper (inserts rows in chunks to avoid timeout) ──
async function batchInsert(label, rows, insertFn) {
  console.log(`  📦 ${label}: ${rows.length} rows`);
  let ok = 0, skip = 0, err = 0;
  for (let idx = 0; idx < rows.length; idx++) {
    try {
      const result = await insertFn(rows[idx]);
      if (result === false) { skip++; } else { ok++; }
    } catch (e) {
      err++;
      if (err <= 3) console.log(`    ⚠️ Row ${idx}: ${e.message?.substring(0,120)}`);
    }
    if ((ok + skip + err) % 1000 === 0 && ok > 0) console.log(`    ... ${ok} inserted, ${skip} skipped, ${err} errors`);
  }
  console.log(`    ✅ ${ok} inserted, ${skip} skipped${err > 0 ? `, ${err} errors` : ""}`);
  return ok;
}

// ========================================
//  SEED LOOKUP TABLES
// ========================================
async function seedLookups() {
  console.log("══════ Phase 0: Seeding Lookup Tables ══════");
  const inserts = [
    ["roles", [[1,'Store Manager','All dashboards and all views'],[2,'Admin',null],[3,'Corporator','All Dashboards'],[4,'Purchaser','No access to dashboards specially to profits and cash. Access to create PR'],[5,'Cashier','No access to dashboards specially to profits and cash'],[6,'Sales Agent','Limited access to parts only'],[7,'Security Admin','Access to Security views'],[8,'Inventory Manager','Access to inventory/audit'],[9,'Price Manager','Access to updating prices']]],
    ["units", [[1,'Pcs'],[2,'Set'],[3,'Can'],[4,'ft']]],
    ["inventory_actions", [[1,'Add stock',1],[2,'Sale',-1],[3,'Damage',-1],[4,'Lost',-1],[5,'Manual Add',1]]],
    ["payment_types", [[1,'Cash'],[2,'Payable']]],
    ["sales_types", [[1,'Cash'],[2,'Collectible']]],
    ["audit_statuses", [[1,'Good'],[2,'Missing Item'],[3,'Excess Item']]],
    ["cash_actions", [[1,'Cash-in'],[2,'Cash-out'],[3,'Expense'],[4,'Loan Payable'],[5,'Loan to others']]],
    ["expense_types", [[1,'COGS','Direct costs'],[2,'Operating Expense','Day-to-day costs'],[3,'Non-operating Expense','Not directly tied to operations'],[4,'Taxes and Regulatory Fees',null],[5,'Extra Ordinary Expense','One-time expenses']]],
    ["opex_types", [[1,'SSS, PHIC, PAGIBIG'],[2,'Taxes and Licenses'],[3,'Utilities'],[4,'Professional Fees'],[5,'Repairs and Maintenance'],[6,'Supplies used'],[7,'Rental'],[8,'Transportation and Travel'],[9,'Amortization'],[10,'Miscellaneous']]],
    ["pr_statuses", [[1,'New'],[2,'Canvas On-going'],[3,'Purchase On-going'],[4,'Purchase Completed'],[5,'Waiting Delivery'],[6,'Partial Delivered'],[7,'All Delivered'],[8,'Canceled'],[9,'Pending Payment'],[10,'Fully Stocked'],[11,'Completed']]],
    ["pr_line_statuses", [[1,'New'],[2,'Canvas On-going'],[3,'For Purchase'],[4,'Purchased'],[5,'Waiting Delivery'],[6,'Delivered'],[7,'Returned'],[8,'Not Delivered'],[9,'Canceled'],[10,'Partially Delivered'],[11,'Completed'],[12,'Stocked']]],
    ["jo_statuses", [[1,'New'],[2,'Work in progress'],[3,'Waiting Parts'],[4,'Waiting Labor'],[5,'Waiting others'],[6,'Waiting Payment'],[7,'Completed']]],
    ["jo_material_statuses", [[1,'For Purchase'],[2,'Waiting Mechanic'],[3,'Waiting Others'],[4,'Installed/Applied'],[5,'Pending Payment'],[6,'Partially Paid'],[7,'Fully Paid']]],
    ["jo_labor_statuses", [[1,'New'],[2,'Work in progress'],[3,'Waiting Parts'],[4,'Waiting Mechanic'],[5,'Waiting others'],[6,'Completed']]],
  ];

  for (const [table, rows] of inserts) {
    for (const row of rows) {
      if (table === "roles") await sql`INSERT INTO roles (id, name, description) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}, ${row[2]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "units") await sql`INSERT INTO units (id, name) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "inventory_actions") await sql`INSERT INTO inventory_actions (id, name, add_minus) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}, ${row[2]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "payment_types") await sql`INSERT INTO payment_types (id, type) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "sales_types") await sql`INSERT INTO sales_types (id, type) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "audit_statuses") await sql`INSERT INTO audit_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "cash_actions") await sql`INSERT INTO cash_actions (id, action) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "expense_types") await sql`INSERT INTO expense_types (id, name, description) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}, ${row[2]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "opex_types") await sql`INSERT INTO opex_types (id, name) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "pr_statuses") await sql`INSERT INTO pr_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "pr_line_statuses") await sql`INSERT INTO pr_line_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "jo_statuses") await sql`INSERT INTO jo_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "jo_material_statuses") await sql`INSERT INTO jo_material_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
      else if (table === "jo_labor_statuses") await sql`INSERT INTO jo_labor_statuses (id, status) OVERRIDING SYSTEM VALUE VALUES (${row[0]}, ${row[1]}) ON CONFLICT (id) DO NOTHING`;
    }
    console.log(`  ✅ ${table}`);
  }
  console.log("");
}

// ========================================
//  MAIN MIGRATION
// ========================================
async function main() {
  const t0 = Date.now();
  console.log("\n🚀 FULL Data Migration — Excel to Supabase\n");

  const V = readWorkbook("Vendor.xlsx");
  const G = readWorkbook("Garage_Customers.xlsx");
  const S = readWorkbook("Security_Users.xlsx");
  console.log("");

  await seedLookups();

  // ══ Phase 1: Core entities (no FK deps) ══
  console.log("══════ Phase 1: Core Entities ══════");

  await batchInsert("Users", S["Users"] || [], async (r) => {
    const email = s(r["Email"]); if (!email) return false;
    const id = getUUID("users", r["ID"]);
    await sql`INSERT INTO users (id, email, first_name, last_name, nick_name, photo_url, updated_at, created_at)
      VALUES (${id}, ${email}, ${s(r["First Name"])}, ${s(r["Last Name"]) || s(r[" Last Name"])}, ${s(r["Nick Name"])}, ${s(r["Photo"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Brands", V["Brands"] || [], async (r) => {
    const name = s(r["Brand Name"]); if (!name) return false;
    const id = getUUID("brands", r["ID"]);
    await sql`INSERT INTO brands (id, name) VALUES (${id}, ${name}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Cabinet Codes", V["Cabinet_Codes"] || [], async (r) => {
    const code = s(r["Cabinet Code"]); if (!code) return false;
    const id = getUUID("cabinet_codes", r["ID"]);
    await sql`INSERT INTO cabinet_codes (id, code, image_url, description) VALUES (${id}, ${code}, ${s(r["Image"])}, ${s(r["Description"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Vendors", V["Vendor"] || [], async (r) => {
    const name = s(r["Vendor Name"]); if (!name) return false;
    const id = getUUID("vendors", r["ID"]);
    await sql`INSERT INTO vendors (id, name, address, contact_number, link, comments, updated_at, created_at)
      VALUES (${id}, ${name}, ${s(r["Address"])}, ${s(r["Contact Number"])}, ${s(r["Link"])}, ${s(r["Comments"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Cashiers", G["Cashiers"] || [], async (r) => {
    const fn = s(r["First Name"]); if (!fn) return false;
    const id = getUUID("cashiers", r["ID"]);
    await sql`INSERT INTO cashiers (id, first_name, middle_name, last_name, contact_number, updated_at, created_at)
      VALUES (${id}, ${fn}, ${s(r["Middle Name"])}, ${s(r["Last Name"])}, ${s(r["Contact Number"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Mechanics", G["Mechanics"] || [], async (r) => {
    const fn = s(r["First Name"]); if (!fn) return false;
    const id = getUUID("mechanics", r["ID"]);
    await sql`INSERT INTO mechanics (id, first_name, last_name, nick_name, primary_contact, updated_at, created_at)
      VALUES (${id}, ${fn}, ${s(r["Last Name"])}, ${s(r["Nick Name"])}, ${s(r["Primary Contact Number"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Labor Types", G["Labor Types"] || [], async (r) => {
    const name = s(r["Name"]); if (!name) return false;
    const id = getUUID("labor_types", r["ID"]);
    await sql`INSERT INTO labor_types (id, name, description, default_price, updated_at, created_at)
      VALUES (${id}, ${name}, ${s(r["Description"])}, ${n(r["Price"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Quality Checklists", G["Quality Checklist"] || [], async (r) => {
    const name = s(r["Check List Name"]); if (!name) return false;
    const id = getUUID("quality_checklists", r["ID"]);
    await sql`INSERT INTO quality_checklists (id, name, description, updated_at, created_at)
      VALUES (${id}, ${name}, ${s(r["Description"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });
  console.log("");

  // ══ Phase 2: Dependent entities ══
  console.log("══════ Phase 2: Dependent Entities ══════");

  await batchInsert("Role Views", S["Role_views"] || [], async (r) => {
    const view = s(r["View"]); const roleId = i(r["Role"]);
    if (!view || !roleId) return false;
    const id = getUUID("role_views", r["ID"]);
    await sql`INSERT INTO role_views (id, role_id, view_name, created_at) VALUES (${id}, ${roleId}, ${view}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("User Roles", S["User_roles"] || [], async (r) => {
    const userId = lookupUUID("users", r["User"]); const roleId = i(r["Role"]);
    if (!userId || !roleId) return false;
    const id = getUUID("user_roles", r["ID"]);
    await sql`INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (${id}, ${userId}, ${roleId}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Vendor Contacts", V["Vendor_contact_numbers"] || [], async (r) => {
    const num = s(r["Number"]); if (!num) return false;
    const vendorId = lookupUUID("vendors", r["Vendor_ID"]); if (!vendorId) return false;
    const id = getUUID("vendor_contacts", r["ID"]);
    await sql`INSERT INTO vendor_contacts (id, vendor_id, number, label, created_at) VALUES (${id}, ${vendorId}, ${num}, ${s(r["Label"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Parts", V["Parts"] || [], async (r) => {
    const name = s(r["Part Name"]); if (!name) return false;
    const id = getUUID("parts", r["ID"]);
    await sql`INSERT INTO parts (id, name, brand_id, part_number, part_code, description, cabinet_code_id, profile_photo_url, comment, critical_count, include_critical, updated_at, created_at)
      VALUES (${id}, ${name}, ${lookupUUID("brands", r["Brand_ID"])}, ${s(r["Part Number"])}, ${s(r["Part Code"])}, ${s(r["Description"])}, 
              ${lookupUUID("cabinet_codes", r["Cabinet_code_ID"])}, ${s(r["Profile Photo"])}, ${s(r["Comment"])}, ${i(r["Critical_count"])}, 
              ${b(r["Include in Critical Count"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Customers", G["Customers"] || [], async (r) => {
    const fn = s(r["First Name"]); if (!fn) return false;
    const id = getUUID("customers", r["ID"]);
    await sql`INSERT INTO customers (id, first_name, last_name, middle_name, nick_name, suffix, birthday, primary_contact, email, updated_at, created_at)
      VALUES (${id}, ${fn}, ${s(r["Last Name"])}, ${s(r["Middle Name"])}, ${s(r["Nick Name"])}, ${s(r["Suffix"])}, ${dd(r["Birthday"])}, 
              ${s(r["Primary Contact Number"])}, ${s(r["Email"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });
  console.log("");

  // ══ Phase 3: Second-level ══
  console.log("══════ Phase 3: Second-Level Entities ══════");

  await batchInsert("Parts Photos", V["Parts_photos"] || [], async (r) => {
    const photo = s(r["Photo"]); if (!photo) return false;
    const partId = lookupUUID("parts", r["Part_ID"]); if (!partId) return false;
    await sql`INSERT INTO parts_photos (id, part_id, photo_url, notes, date) VALUES (${getUUID("pp", r["ID"])}, ${partId}, ${photo}, ${s(r["Notes"])}, ${dt(r["Date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Parts Prices", V["Parts_price"] || [], async (r) => {
    const price = n(r["Price"]); if (price === null) return false;
    const partId = lookupUUID("parts", r["Part_ID"]); if (!partId) return false;
    await sql`INSERT INTO parts_prices (id, part_id, price, comment, date) VALUES (${getUUID("px", r["ID"])}, ${partId}, ${price}, ${s(r["Comment"])}, ${dt(r["Date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Parts Suppliers", V["Parts_suppliers"] || [], async (r) => {
    const partId = lookupUUID("parts", r["Part_ID"]); const vendorId = lookupUUID("vendors", r["Supplier_ID"]);
    if (!partId || !vendorId) return false;
    await sql`INSERT INTO parts_suppliers (id, part_id, vendor_id, price, comment, link, last_update) 
      VALUES (${getUUID("ps", r["ID"])}, ${partId}, ${vendorId}, ${n(r["Price"])}, ${s(r["Comment"])}, ${s(r["Link"])}, ${dt(r["Last Update"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Inventory Value", V["Inventory_value"] || [], async (r) => {
    await sql`INSERT INTO inventory_value (id, current_value, date, quarter, year, year_quarter)
      VALUES (${getUUID("iv", r["ID"])}, ${n(r["Current Value"])}, ${dd(r["Date"])}, ${s(r["Quarter"])}, ${i(r["Year"])}, ${s(r["Year Quarter"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Customer Addresses", G["address"] || [], async (r) => {
    const custId = lookupUUID("customers", r["Customer"]); if (!custId) return false;
    await sql`INSERT INTO customer_addresses (id, customer_id, street, village, barangay, city, province, zip_code, created_at)
      VALUES (${getUUID("ca", r["ID"])}, ${custId}, ${s(r["Street"])}, ${s(r["Village"])}, ${s(r["Barangay"])}, ${s(r["City"])}, ${s(r["Province"])}, ${s(r["Zip Code"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Cars", G["Cars"] || [], async (r) => {
    const id = getUUID("cars", r["ID"]);
    await sql`INSERT INTO cars (id, make, model, year, color, plate_number, profile_photo_url, primary_owner_id, updated_at, created_at)
      VALUES (${id}, ${s(r["Make"])}, ${s(r["Model"])}, ${s(r["Year"])}, ${s(r["Color"])}, ${s(r["Plate Number"])}, ${s(r["Profile Photo"])}, 
              ${lookupUUID("customers", r["Primary Owner"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Labor Type Checklists", G["Lapor Type Quality Checklist"] || [], async (r) => {
    const ltId = lookupUUID("labor_types", r["Labor Type"]); const clId = lookupUUID("quality_checklists", r["Quality Checklist"]);
    if (!ltId || !clId) return false;
    await sql`INSERT INTO labor_type_checklists (id, labor_type_id, checklist_id, created_at) VALUES (${randomUUID()}, ${ltId}, ${clId}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Checklist Photos", G["Quality Checklist Photos"] || [], async (r) => {
    const photo = s(r["Photo"]); if (!photo) return false;
    const clId = lookupUUID("quality_checklists", r["Quality Checklist"]); if (!clId) return false;
    await sql`INSERT INTO checklist_photos (id, checklist_id, photo_url, comment, created_at) VALUES (${getUUID("cp", r["ID"])}, ${clId}, ${photo}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Checklist Videos", G["Quality Checklist Videos"] || [], async (r) => {
    const vid = s(r["Video"]); if (!vid) return false;
    const clId = lookupUUID("quality_checklists", r["Quality Checklist"]); if (!clId) return false;
    await sql`INSERT INTO checklist_videos (id, checklist_id, video_url, comment, created_at) VALUES (${getUUID("cv", r["ID"])}, ${clId}, ${vid}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Purchase Requests", V["Purchase_requests"] || [], async (r) => {
    const prNum = s(r["Purchase_request_number"]); if (!prNum) return false;
    const id = getUUID("purchase_requests", r["ID"]);
    await sql`INSERT INTO purchase_requests (id, pr_number, date, status_id, label, comment, updated_at, created_at)
      VALUES (${id}, ${prNum}, ${dt(r["Date"])}, ${i(r["Status"])}, ${s(r["Label"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });
  console.log("");

  // ══ Phase 4: High-volume tables ══
  console.log("══════ Phase 4: High-Volume Tables ══════");

  await batchInsert("Inventory Log", V["Inventory_Log"] || [], async (r) => {
    const partId = lookupUUID("parts", r["Part_ID"]); const actionId = i(r["Action_ID"]);
    if (!partId || !actionId) return false;
    const dateVal = dt(r["Date"]); if (!dateVal) return false;
    const { ym, yq, y } = timeParts(r["Date"]);
    const id = getUUID("inv", r["ID"]);
    await sql`INSERT INTO inventory_log (id, date, vendor_id, part_id, action_id, unit_id, quantity, unit_price, total_price, comments,
              last_stock_price, estimate_profit, year_month, year_quarter, year, sales_type_id, payment_type_id, payable_due_date, updated_at, created_at, add_stock_link)
      VALUES (${id}, ${dateVal}, ${lookupUUID("vendors", r["Vendor_ID"])}, ${partId}, ${actionId}, ${i(r["Unit_ID"])}, ${i(r["Quantity"])},
              ${n(r["Unit Price"])}, ${n(r["Total Price"])}, ${s(r["Comments"])}, ${n(r["Last Stock Price"])}, ${n(r["Estimate Profit"])},
              ${ym}, ${yq}, ${y}, ${i(r["Sales_Type"])}, ${i(r["Add_stock_Payment_Type"])}, ${dd(r["Payable_due_date"])},
              ${dt(r["Last_update"])}, ${dt(r["Created_date"])}, ${s(r["Add_stock_link"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Cash Log", V["Cash_Log"] || [], async (r) => {
    const amount = n(r["Amount"]); const actionId = i(r["Action_ID"]);
    if (amount === null || !actionId) return false;
    const datetime = dt(r["Date_time"]); const dateOnly = dd(r["Date"]); if (!datetime || !dateOnly) return false;
    const { ym, yq, y } = timeParts(r["Date"]);
    await sql`INSERT INTO cash_log (id, datetime, date, year_month, year_quarter, year, action_id, amount, comment, expense_type_id, opex_type_id, updated_at, created_at)
      VALUES (${getUUID("cl", r["ID"])}, ${datetime}, ${dateOnly}, ${ym}, ${yq}, ${y}, ${actionId}, ${amount}, ${s(r["Comment"])},
              ${i(r["Expense Type"])}, ${i(r["Operating Expense Type"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("Parts Audit", V["Parts_audit"] || [], async (r) => {
    const partId = lookupUUID("parts", r["Part"]); const statusId = i(r["Status"]);
    if (!partId || !statusId) return false;
    await sql`INSERT INTO parts_audit (id, part_id, count, status_id, current_stock, comment, updated_at, created_at)
      VALUES (${getUUID("pa", r["ID"])}, ${partId}, ${i(r["Count"])}, ${statusId}, ${i(r["Part Current Stock"])}, ${s(r["Comment"])},
              ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("PR Comments", V["PR_comments"] || [], async (r) => {
    const comment = s(r["Comment"]); if (!comment) return false;
    const prId = lookupUUID("purchase_requests", r["PR_ID"]); if (!prId) return false;
    await sql`INSERT INTO pr_comments (id, pr_id, comment, created_at) VALUES (${getUUID("prc", r["ID"])}, ${prId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("PR Lines", V["PR_lines"] || [], async (r) => {
    const prId = lookupUUID("purchase_requests", r["Purchase_request_ID"]); if (!prId) return false;
    const id = getUUID("pr_lines", r["ID"]);
    await sql`INSERT INTO pr_lines (id, pr_id, part_id, quantity, unit_price, total_price, target_price, total_target_price, projected_profit, status_id, comment, link, supplier_id, updated_at, created_at)
      VALUES (${id}, ${prId}, ${lookupUUID("parts", r["Part_ID"])}, ${i(r["Quantity"])}, ${n(r["Unit_price"])}, ${n(r["Total_price"])},
              ${n(r["Target Price"])}, ${n(r["Total Target Price"])}, ${n(r["Projected Profit"])}, ${i(r["Status"])}, ${s(r["Comment"])},
              ${s(r["Link"])}, ${lookupUUID("vendors", r["Supplier_ID"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("PR Line Comments", V["PR_line_comments"] || [], async (r) => {
    const comment = s(r["Comment"]); if (!comment) return false;
    const plId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!plId) return false;
    await sql`INSERT INTO pr_line_comments (id, pr_line_id, comment, created_at) VALUES (${getUUID("plc", r["ID"])}, ${plId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("PR Line Photos", V["PR_Lines_photos"] || [], async (r) => {
    const photo = s(r["Photo"]); if (!photo) return false;
    const plId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!plId) return false;
    await sql`INSERT INTO pr_line_photos (id, pr_line_id, photo_url, comment, created_at) VALUES (${getUUID("plp", r["ID"])}, ${plId}, ${photo}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });
  console.log("");

  // ══ Phase 5: Job Orders & children ══
  console.log("══════ Phase 5: Job Orders & Children ══════");

  await batchInsert("Job Orders", G["Job_Orders"] || [], async (r) => {
    const joNum = s(r["Job Order Number"]); if (!joNum) return false;
    const id = getUUID("job_orders", r["ID"]);
    await sql`INSERT INTO job_orders (id, jo_number, customer_id, car_id, checkin_date, checkout_date, status_id, discount, comment, updated_at, created_at)
      VALUES (${id}, ${joNum}, ${lookupUUID("customers", r["Primary Contact"])}, ${lookupUUID("cars", r["Car"])}, ${dt(r["Check-in Date"])},
              ${dt(r["Check-out Date"])}, ${i(r["Status"])}, ${n(r["Discount"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Payments", G["Job_order_payments"] || [], async (r) => {
    const joId = lookupUUID("job_orders", r["Job Order"]); const amt = n(r["Amount Paid"]);
    if (!joId || amt === null) return false;
    await sql`INSERT INTO jo_payments (id, jo_id, or_number, si_number, amount_paid, date_paid, cashier_id, comment, created_at)
      VALUES (${getUUID("jp", r["ID"])}, ${joId}, ${s(r["OR Number"])}, ${s(r["Sales Invoice Number"])}, ${amt}, ${dd(r["Date Paid"])},
              ${lookupUUID("cashiers", r["Prepaired By"])}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Materials", G["Job_order_materials"] || [], async (r) => {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) return false;
    const id = getUUID("jo_materials", r["ID"]);
    await sql`INSERT INTO jo_materials (id, jo_id, part_id, price, quantity, total_price, discount, final_price, status_id, provided_inhouse, include_in_total, date, year_month, comment, updated_at, created_at)
      VALUES (${id}, ${joId}, ${lookupUUID("parts", r["Material"])}, ${n(r["Price"])}, ${i(r["Quantity"])}, ${n(r["Total Price"])},
              ${n(r["Discount"])}, ${n(r["Final Price"])}, ${i(r["Status"])}, ${b(r["Provided In-house"])}, ${b(r["Include in Total"])},
              ${dt(r["Date"])}, ${s(r["Year_Month"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Labors", G["Job_order_labors"] || [], async (r) => {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) return false;
    const id = getUUID("jo_labors", r["ID"]);
    await sql`INSERT INTO jo_labors (id, jo_id, labor_type_id, price, discount, total_price, status_id, target_date, comment, updated_at, created_at)
      VALUES (${id}, ${joId}, ${lookupUUID("labor_types", r["Labor"])}, ${n(r["Price"])}, ${n(r["Discount"])}, ${n(r["Total Price"])},
              ${i(r["Status"])}, ${dd(r["Target Date"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Comments", G["Job_order_comments"] || [], async (r) => {
    const comment = s(r["Comment"]); if (!comment) return false;
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) return false;
    await sql`INSERT INTO jo_comments (id, jo_id, comment_from, comment, created_at)
      VALUES (${getUUID("jc", r["ID"])}, ${joId}, ${s(r["Comment From"])}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Labor Mechanics", G["Job_order_labor_mechanics"] || [], async (r) => {
    const jlId = lookupUUID("jo_labors", r["Job Order Labor"]); const mId = lookupUUID("mechanics", r["Mechanic"]);
    if (!jlId || !mId) return false;
    await sql`INSERT INTO jo_labor_mechanics (id, jo_labor_id, mechanic_id, comment, created_at)
      VALUES (${getUUID("jlm", r["ID"])}, ${jlId}, ${mId}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Material Comments", G["JO_materials_comments"] || [], async (r) => {
    const comment = s(r["Comment"]); if (!comment) return false;
    const matId = lookupUUID("jo_materials", r["JO Material"]); if (!matId) return false;
    await sql`INSERT INTO jo_material_comments (id, jo_material_id, comment, created_at)
      VALUES (${getUUID("jmc", r["ID"])}, ${matId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });

  await batchInsert("JO Labor Comments", G["JO_labor_comments"] || [], async (r) => {
    const comment = s(r["Comment"]); if (!comment) return false;
    const labId = lookupUUID("jo_labors", r["JO Labor"]); if (!labId) return false;
    await sql`INSERT INTO jo_labor_comments (id, jo_labor_id, comment, created_at)
      VALUES (${getUUID("jlc", r["ID"])}, ${labId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
  });
  console.log("");

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n🎉 FULL Migration complete! Total ID mappings: ${idMap.size} | Time: ${elapsed}s`);
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  sql.end();
  process.exit(1);
});
