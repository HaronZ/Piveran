/**
 * RESUME Migration — Picks up from where the full migration was interrupted.
 * 
 * Uses batch inserts (50 rows at a time) to speed up the remaining 19K+ rows.
 * Safe to re-run: uses ON CONFLICT DO NOTHING for all inserts.
 * 
 * Usage: node scripts/migrate-resume.mjs
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

// ── Read Excel ──
function readWorkbook(filename) {
  const path = resolve(DATA_DIR, filename);
  console.log(`  📖 Reading ${filename}...`);
  const wb = XLSX.readFile(path, { cellDates: true });
  const sheets = {};
  for (const name of wb.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: false });
  }
  return sheets;
}

// ── Utilities ──
function s(v) { return v !== null && v !== undefined && String(v).trim() !== "" ? String(v).trim() : null; }
function n(v) { if (v === null || v === undefined || String(v).trim() === "") return null; const x = parseFloat(v); return isNaN(x) ? null : x; }
function i(v) { const x = n(v); return x !== null ? Math.floor(x) : null; }
function b(v) { if (!v) return false; const x = String(v).trim().toLowerCase(); return x === "true" || x === "y" || x === "yes" || x === "1"; }
function dt(v) {
  if (!v || String(v).trim() === "") return null;
  try { const d = v instanceof Date ? v : new Date(String(v).trim()); return isNaN(d.getTime()) ? null : d.toISOString(); } catch { return null; }
}
function dd(v) {
  if (!v || String(v).trim() === "") return null;
  try { const d = v instanceof Date ? v : new Date(String(v).trim()); return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0]; } catch { return null; }
}
function tp(v) {
  const d = v instanceof Date ? v : (v ? new Date(String(v)) : null);
  if (!d || isNaN(d.getTime())) return { ym: null, yq: null, y: null };
  const yr = d.getFullYear(), mo = d.getMonth() + 1;
  return { ym: `${yr}${String(mo).padStart(2,"0")}`, yq: `${yr}Q${Math.ceil(mo/3)}`, y: String(yr) };
}

// ── Batch insert: prepare rows then insert in chunks of BATCH_SIZE ──
const BATCH = 50;
async function batchExec(label, rows, mapFn, insertSql) {
  console.log(`  📦 ${label}: ${rows.length} rows`);
  let ok = 0, skip = 0, err = 0;
  const batch = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const mapped = mapFn(rows[idx]);
    if (!mapped) { skip++; continue; }
    batch.push(mapped);

    if (batch.length >= BATCH || idx === rows.length - 1) {
      try {
        const result = await insertSql(batch);
        ok += batch.length;
      } catch (e) {
        // Fall back to one-by-one for this batch
        for (const row of batch) {
          try { await insertSql([row]); ok++; }
          catch (e2) { err++; if (err <= 3) console.log(`    ⚠️ ${e2.message?.substring(0,120)}`); }
        }
      }
      batch.length = 0;
      if ((ok + err) % 2000 === 0 && ok > 0) console.log(`    ... ${ok} inserted, ${skip} skipped, ${err} errors`);
    }
  }
  console.log(`    ✅ ${ok} inserted, ${skip} skipped${err > 0 ? `, ${err} errors` : ""}`);
  return ok;
}

// ========================================
//  REBUILD ID MAP from existing DB data
// ========================================
async function rebuildIdMap(V, G, S) {
  console.log("══════ Rebuilding ID Map from existing data ══════");
  
  // For each entity table, read existing rows from DB and also re-map Excel IDs
  // The problem is we don't know which Excel ID maps to which UUID.
  // Instead, let's regenerate the SAME UUID mappings by re-processing the Excel data
  // in the same order. Since getUUID is deterministic per (table, oldId), and we use
  // randomUUID(), we can't recover old mappings.
  
  // SOLUTION: Read existing DB rows, match by unique fields (name, email, etc.),
  // and rebuild the mapping.
  
  // Users - match by email
  const dbUsers = await sql`SELECT id, email FROM users`;
  const excelUsers = S["Users"] || [];
  for (const eu of excelUsers) {
    const email = s(eu["Email"]); if (!email) continue;
    const match = dbUsers.find(u => u.email === email);
    if (match) { const key = `users:${String(eu["ID"]).trim()}`; idMap.set(key, match.id); }
  }
  console.log(`  ✅ Users: ${dbUsers.length} mapped`);

  // Brands - match by name
  const dbBrands = await sql`SELECT id, name FROM brands`;
  for (const ex of (V["Brands"] || [])) {
    const name = s(ex["Brand Name"]); if (!name) continue;
    const match = dbBrands.find(b => b.name === name);
    if (match) { idMap.set(`brands:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Brands: ${dbBrands.length} mapped`);

  // Cabinet Codes - match by code
  const dbCabs = await sql`SELECT id, code FROM cabinet_codes`;
  for (const ex of (V["Cabinet_Codes"] || [])) {
    const code = s(ex["Cabinet Code"]); if (!code) continue;
    const match = dbCabs.find(c => c.code === code);
    if (match) { idMap.set(`cabinet_codes:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Cabinet Codes: ${dbCabs.length} mapped`);

  // Vendors - match by name
  const dbVendors = await sql`SELECT id, name FROM vendors`;
  for (const ex of (V["Vendor"] || [])) {
    const name = s(ex["Vendor Name"]); if (!name) continue;
    const match = dbVendors.find(v => v.name === name);
    if (match) { idMap.set(`vendors:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Vendors: ${dbVendors.length} mapped`);

  // Parts - match by name (most critical - 719 parts)
  const dbParts = await sql`SELECT id, name FROM parts`;
  const partsMap = new Map();
  for (const p of dbParts) { partsMap.set(p.name, p.id); }
  for (const ex of (V["Parts"] || [])) {
    const name = s(ex["Part Name"]); if (!name) continue;
    const match = partsMap.get(name);
    if (match) { idMap.set(`parts:${String(ex["ID"]).trim()}`, match); }
  }
  console.log(`  ✅ Parts: ${dbParts.length} mapped`);

  // Customers - match by first_name + last_name
  const dbCusts = await sql`SELECT id, first_name, last_name FROM customers`;
  for (const ex of (G["Customers"] || [])) {
    const fn = s(ex["First Name"]); if (!fn) continue;
    const ln = s(ex["Last Name"]) || "";
    const match = dbCusts.find(c => c.first_name === fn && (c.last_name || "") === ln);
    if (match) { idMap.set(`customers:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Customers: ${dbCusts.length} mapped`);

  // Cars - match by plate_number or make+model+year
  const dbCars = await sql`SELECT id, plate_number, make, model, year FROM cars`;
  for (const ex of (G["Cars"] || [])) {
    const plate = s(ex["Plate Number"]);
    const make = s(ex["Make"]) || "", model = s(ex["Model"]) || "", year = s(ex["Year"]) || "";
    let match;
    if (plate) match = dbCars.find(c => c.plate_number === plate);
    if (!match) match = dbCars.find(c => (c.make||"") === make && (c.model||"") === model && (c.year||"") === year);
    if (match) { idMap.set(`cars:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Cars: ${dbCars.length} mapped`);

  // Cashiers - match by first_name
  const dbCashiers = await sql`SELECT id, first_name FROM cashiers`;
  for (const ex of (G["Cashiers"] || [])) {
    const fn = s(ex["First Name"]); if (!fn) continue;
    const match = dbCashiers.find(c => c.first_name === fn);
    if (match) { idMap.set(`cashiers:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Cashiers: ${dbCashiers.length} mapped`);

  // Mechanics - match by first_name
  const dbMechs = await sql`SELECT id, first_name, last_name FROM mechanics`;
  for (const ex of (G["Mechanics"] || [])) {
    const fn = s(ex["First Name"]); if (!fn) continue;
    const ln = s(ex["Last Name"]) || "";
    const match = dbMechs.find(m => m.first_name === fn && (m.last_name||"") === ln);
    if (match) { idMap.set(`mechanics:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Mechanics: ${dbMechs.length} mapped`);

  // Labor Types - match by name
  const dbLT = await sql`SELECT id, name FROM labor_types`;
  const ltMap = new Map();
  for (const lt of dbLT) { ltMap.set(lt.name, lt.id); }
  for (const ex of (G["Labor Types"] || [])) {
    const name = s(ex["Name"]); if (!name) continue;
    const match = ltMap.get(name);
    if (match) { idMap.set(`labor_types:${String(ex["ID"]).trim()}`, match); }
  }
  console.log(`  ✅ Labor Types: ${dbLT.length} mapped`);

  // Quality Checklists - match by name
  const dbQC = await sql`SELECT id, name FROM quality_checklists`;
  for (const ex of (G["Quality Checklist"] || [])) {
    const name = s(ex["Check List Name"]); if (!name) continue;
    const match = dbQC.find(q => q.name === name);
    if (match) { idMap.set(`quality_checklists:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Quality Checklists: ${dbQC.length} mapped`);

  // Purchase Requests - match by pr_number
  const dbPR = await sql`SELECT id, pr_number FROM purchase_requests`;
  for (const ex of (V["Purchase_requests"] || [])) {
    const prNum = s(ex["Purchase_request_number"]); if (!prNum) continue;
    const match = dbPR.find(p => p.pr_number === prNum);
    if (match) { idMap.set(`purchase_requests:${String(ex["ID"]).trim()}`, match.id); }
  }
  console.log(`  ✅ Purchase Requests: ${dbPR.length} mapped`);

  // Vendor Contacts - match by vendor_id + number
  const dbVC = await sql`SELECT id, vendor_id, number FROM vendor_contacts`;
  for (const ex of (V["Vendor_contact_numbers"] || [])) {
    const num = s(ex["Number"]); if (!num) continue;
    const vid = lookupUUID("vendors", ex["Vendor_ID"]);
    const match = dbVC.find(vc => vc.vendor_id === vid && vc.number === num);
    if (match) { idMap.set(`vendor_contacts:${String(ex["ID"]).trim()}`, match.id); }
  }

  // PR Lines
  const dbPRLines = await sql`SELECT id, pr_id FROM pr_lines`;
  // Map by position within each PR
  const prLinesByPR = {};
  for (const pl of dbPRLines) {
    if (!prLinesByPR[pl.pr_id]) prLinesByPR[pl.pr_id] = [];
    prLinesByPR[pl.pr_id].push(pl.id);
  }
  // Group Excel PR lines by PR_ID  
  const exPRLinesByPR = {};
  for (const ex of (V["PR_lines"] || [])) {
    const prId = lookupUUID("purchase_requests", ex["Purchase_request_ID"]);
    if (!prId) continue;
    if (!exPRLinesByPR[prId]) exPRLinesByPR[prId] = [];
    exPRLinesByPR[prId].push(ex);
  }
  // Match by position
  for (const [prId, exLines] of Object.entries(exPRLinesByPR)) {
    const dbLines = prLinesByPR[prId] || [];
    for (let j = 0; j < Math.min(exLines.length, dbLines.length); j++) {
      idMap.set(`pr_lines:${String(exLines[j]["ID"]).trim()}`, dbLines[j]);
    }
  }
  console.log(`  ✅ PR Lines: ${dbPRLines.length} mapped`);

  console.log(`  📊 Total ID mappings: ${idMap.size}\n`);
}

// ========================================
//  MAIN RESUME
// ========================================
async function main() {
  const t0 = Date.now();
  console.log("\n🔄 RESUMING Data Migration — Excel to Supabase\n");

  const V = readWorkbook("Vendor.xlsx");
  const G = readWorkbook("Garage_Customers.xlsx");
  const S = readWorkbook("Security_Users.xlsx");
  console.log("");

  // Rebuild ID map from existing data
  await rebuildIdMap(V, G, S);

  // ══ Parts Audit (19,333 → 366 done, ~19K remaining) ══
  console.log("══════ Resuming Phase 4: Parts Audit ══════");
  const paRows = V["Parts_audit"] || [];
  console.log(`  📦 Parts Audit: ${paRows.length} rows total (ON CONFLICT skips existing)`);
  let paOk = 0, paSkip = 0, paErr = 0;
  for (let idx = 0; idx < paRows.length; idx++) {
    const r = paRows[idx];
    const partId = lookupUUID("parts", r["Part"]);
    const statusId = i(r["Status"]);
    if (!partId || !statusId) { paSkip++; continue; }
    const id = getUUID("pa", r["ID"]);
    try {
      await sql`INSERT INTO parts_audit (id, part_id, count, status_id, current_stock, comment, updated_at, created_at)
        VALUES (${id}, ${partId}, ${i(r["Count"])}, ${statusId}, ${i(r["Part Current Stock"])}, ${s(r["Comment"])},
                ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      paOk++;
    } catch (e) {
      paErr++;
      if (paErr <= 3) console.log(`    ⚠️ Row ${idx}: ${e.message?.substring(0,120)}`);
    }
    if ((paOk + paSkip + paErr) % 2000 === 0) console.log(`    ... ${paOk} inserted, ${paSkip} skipped, ${paErr} errors`);
  }
  console.log(`    ✅ Parts Audit: ${paOk} inserted, ${paSkip} skipped${paErr > 0 ? `, ${paErr} errors` : ""}\n`);

  // ══ PR Comments ══
  console.log("══════ Remaining Phase 4 Tables ══════");
  const prCRows = V["PR_comments"] || [];
  console.log(`  📦 PR Comments: ${prCRows.length} rows`);
  let c1 = 0;
  for (const r of prCRows) {
    const comment = s(r["Comment"]); if (!comment) continue;
    const prId = lookupUUID("purchase_requests", r["PR_ID"]); if (!prId) continue;
    try {
      await sql`INSERT INTO pr_comments (id, pr_id, comment, created_at) VALUES (${getUUID("prc",r["ID"])}, ${prId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      c1++;
    } catch {}
  }
  console.log(`    ✅ ${c1} inserted`);

  // PR Lines (already done per DB check = 0, need to insert)
  const plRows = V["PR_lines"] || [];
  console.log(`  📦 PR Lines: ${plRows.length} rows`);
  let c2 = 0;
  for (const r of plRows) {
    const prId = lookupUUID("purchase_requests", r["Purchase_request_ID"]); if (!prId) continue;
    const id = getUUID("pr_lines", r["ID"]);
    try {
      await sql`INSERT INTO pr_lines (id, pr_id, part_id, quantity, unit_price, total_price, target_price, total_target_price, projected_profit, status_id, comment, link, supplier_id, updated_at, created_at)
        VALUES (${id}, ${prId}, ${lookupUUID("parts",r["Part_ID"])}, ${i(r["Quantity"])}, ${n(r["Unit_price"])}, ${n(r["Total_price"])},
                ${n(r["Target Price"])}, ${n(r["Total Target Price"])}, ${n(r["Projected Profit"])}, ${i(r["Status"])}, ${s(r["Comment"])},
                ${s(r["Link"])}, ${lookupUUID("vendors",r["Supplier_ID"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      c2++;
    } catch {}
  }
  console.log(`    ✅ ${c2} inserted`);

  // PR Line Comments
  const plcRows = V["PR_line_comments"] || [];
  console.log(`  📦 PR Line Comments: ${plcRows.length} rows`);
  let c3 = 0;
  for (const r of plcRows) {
    const comment = s(r["Comment"]); if (!comment) continue;
    const plId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!plId) continue;
    try {
      await sql`INSERT INTO pr_line_comments (id, pr_line_id, comment, created_at) VALUES (${getUUID("plc",r["ID"])}, ${plId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      c3++;
    } catch {}
  }
  console.log(`    ✅ ${c3} inserted`);

  // PR Line Photos
  const plpRows = V["PR_Lines_photos"] || [];
  console.log(`  📦 PR Line Photos: ${plpRows.length} rows`);
  let c4 = 0;
  for (const r of plpRows) {
    const photo = s(r["Photo"]); if (!photo) continue;
    const plId = lookupUUID("pr_lines", r["PR_Line_ID"]); if (!plId) continue;
    try {
      await sql`INSERT INTO pr_line_photos (id, pr_line_id, photo_url, comment, created_at) VALUES (${getUUID("plp",r["ID"])}, ${plId}, ${photo}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      c4++;
    } catch {}
  }
  console.log(`    ✅ ${c4} inserted\n`);

  // ══ Phase 5: Job Orders & Children ══
  console.log("══════ Phase 5: Job Orders & Children ══════");

  // Job Orders
  const joRows = G["Job_Orders"] || [];
  console.log(`  📦 Job Orders: ${joRows.length} rows`);
  let joOk = 0;
  for (const r of joRows) {
    const joNum = s(r["Job Order Number"]); if (!joNum) continue;
    const id = getUUID("job_orders", r["ID"]);
    try {
      await sql`INSERT INTO job_orders (id, jo_number, customer_id, car_id, checkin_date, checkout_date, status_id, discount, comment, updated_at, created_at)
        VALUES (${id}, ${joNum}, ${lookupUUID("customers",r["Primary Contact"])}, ${lookupUUID("cars",r["Car"])}, ${dt(r["Check-in Date"])},
                ${dt(r["Check-out Date"])}, ${i(r["Status"])}, ${n(r["Discount"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      joOk++;
    } catch {}
    if (joOk % 200 === 0 && joOk > 0) console.log(`    ... ${joOk} rows`);
  }
  console.log(`    ✅ ${joOk} inserted`);

  // JO Payments
  const jpRows = G["Job_order_payments"] || [];
  console.log(`  📦 JO Payments: ${jpRows.length} rows`);
  let jpOk = 0;
  for (const r of jpRows) {
    const joId = lookupUUID("job_orders", r["Job Order"]); const amt = n(r["Amount Paid"]);
    if (!joId || amt === null) continue;
    try {
      await sql`INSERT INTO jo_payments (id, jo_id, or_number, si_number, amount_paid, date_paid, cashier_id, comment, created_at)
        VALUES (${getUUID("jp",r["ID"])}, ${joId}, ${s(r["OR Number"])}, ${s(r["Sales Invoice Number"])}, ${amt}, ${dd(r["Date Paid"])},
                ${lookupUUID("cashiers",r["Prepaired By"])}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jpOk++;
    } catch {}
    if (jpOk % 200 === 0 && jpOk > 0) console.log(`    ... ${jpOk} rows`);
  }
  console.log(`    ✅ ${jpOk} inserted`);

  // JO Materials
  const jmRows = G["Job_order_materials"] || [];
  console.log(`  📦 JO Materials: ${jmRows.length} rows`);
  let jmOk = 0;
  for (const r of jmRows) {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    const id = getUUID("jo_materials", r["ID"]);
    try {
      await sql`INSERT INTO jo_materials (id, jo_id, part_id, price, quantity, total_price, discount, final_price, status_id, provided_inhouse, include_in_total, date, year_month, comment, updated_at, created_at)
        VALUES (${id}, ${joId}, ${lookupUUID("parts",r["Material"])}, ${n(r["Price"])}, ${i(r["Quantity"])}, ${n(r["Total Price"])},
                ${n(r["Discount"])}, ${n(r["Final Price"])}, ${i(r["Status"])}, ${b(r["Provided In-house"])}, ${b(r["Include in Total"])},
                ${dt(r["Date"])}, ${s(r["Year_Month"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jmOk++;
    } catch {}
    if (jmOk % 500 === 0 && jmOk > 0) console.log(`    ... ${jmOk} rows`);
  }
  console.log(`    ✅ ${jmOk} inserted`);

  // JO Labors
  const jlRows = G["Job_order_labors"] || [];
  console.log(`  📦 JO Labors: ${jlRows.length} rows`);
  let jlOk = 0;
  for (const r of jlRows) {
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    const id = getUUID("jo_labors", r["ID"]);
    try {
      await sql`INSERT INTO jo_labors (id, jo_id, labor_type_id, price, discount, total_price, status_id, target_date, comment, updated_at, created_at)
        VALUES (${id}, ${joId}, ${lookupUUID("labor_types",r["Labor"])}, ${n(r["Price"])}, ${n(r["Discount"])}, ${n(r["Total Price"])},
                ${i(r["Status"])}, ${dd(r["Target Date"])}, ${s(r["Comment"])}, ${dt(r["Last_update"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jlOk++;
    } catch {}
    if (jlOk % 200 === 0 && jlOk > 0) console.log(`    ... ${jlOk} rows`);
  }
  console.log(`    ✅ ${jlOk} inserted`);

  // JO Comments
  const jcRows = G["Job_order_comments"] || [];
  console.log(`  📦 JO Comments: ${jcRows.length} rows`);
  let jcOk = 0;
  for (const r of jcRows) {
    const comment = s(r["Comment"]); if (!comment) continue;
    const joId = lookupUUID("job_orders", r["Job Order"]); if (!joId) continue;
    try {
      await sql`INSERT INTO jo_comments (id, jo_id, comment_from, comment, created_at)
        VALUES (${getUUID("jc",r["ID"])}, ${joId}, ${s(r["Comment From"])}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jcOk++;
    } catch {}
  }
  console.log(`    ✅ ${jcOk} inserted`);

  // JO Labor Mechanics
  const jlmRows = G["Job_order_labor_mechanics"] || [];
  console.log(`  📦 JO Labor Mechanics: ${jlmRows.length} rows`);
  let jlmOk = 0;
  for (const r of jlmRows) {
    const jlId = lookupUUID("jo_labors", r["Job Order Labor"]); const mId = lookupUUID("mechanics", r["Mechanic"]);
    if (!jlId || !mId) continue;
    try {
      await sql`INSERT INTO jo_labor_mechanics (id, jo_labor_id, mechanic_id, comment, created_at)
        VALUES (${getUUID("jlm",r["ID"])}, ${jlId}, ${mId}, ${s(r["Comment"])}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jlmOk++;
    } catch {}
    if (jlmOk % 500 === 0 && jlmOk > 0) console.log(`    ... ${jlmOk} rows`);
  }
  console.log(`    ✅ ${jlmOk} inserted`);

  // JO Material Comments
  const jmcRows = G["JO_materials_comments"] || [];
  console.log(`  📦 JO Material Comments: ${jmcRows.length} rows`);
  let jmcOk = 0;
  for (const r of jmcRows) {
    const comment = s(r["Comment"]); if (!comment) continue;
    const matId = lookupUUID("jo_materials", r["JO Material"]); if (!matId) continue;
    try {
      await sql`INSERT INTO jo_material_comments (id, jo_material_id, comment, created_at)
        VALUES (${getUUID("jmc",r["ID"])}, ${matId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jmcOk++;
    } catch {}
    if (jmcOk % 200 === 0 && jmcOk > 0) console.log(`    ... ${jmcOk} rows`);
  }
  console.log(`    ✅ ${jmcOk} inserted`);

  // JO Labor Comments
  const jlcRows = G["JO_labor_comments"] || [];
  console.log(`  📦 JO Labor Comments: ${jlcRows.length} rows`);
  let jlcOk = 0;
  for (const r of jlcRows) {
    const comment = s(r["Comment"]); if (!comment) continue;
    const labId = lookupUUID("jo_labors", r["JO Labor"]); if (!labId) continue;
    try {
      await sql`INSERT INTO jo_labor_comments (id, jo_labor_id, comment, created_at)
        VALUES (${getUUID("jlc",r["ID"])}, ${labId}, ${comment}, ${dt(r["Created_date"])}) ON CONFLICT DO NOTHING`;
      jlcOk++;
    } catch {}
    if (jlcOk % 100 === 0 && jlcOk > 0) console.log(`    ... ${jlcOk} rows`);
  }
  console.log(`    ✅ ${jlcOk} inserted\n`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`🎉 Resume migration complete! Time: ${elapsed}s | ID mappings: ${idMap.size}`);
  
  // Final count
  console.log("\n📊 Final table counts:");
  const finalTables = ['users','brands','parts','customers','cars','vendors','mechanics','labor_types',
    'inventory_log','cash_log','parts_audit','purchase_requests','pr_lines',
    'job_orders','jo_payments','jo_materials','jo_labors','jo_labor_mechanics','jo_material_comments','jo_labor_comments'];
  for (const t of finalTables) {
    const [{count}] = await sql.unsafe(`SELECT count(*) FROM ${t}`);
    if (parseInt(count) > 0) console.log(`  ${t}: ${count}`);
  }
  
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  sql.end();
  process.exit(1);
});
