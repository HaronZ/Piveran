import postgres from "postgres";
const sql = postgres("postgresql://postgres.kumgolykeplwcbvbwgry:Haronzie123!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres", { max: 1, idle_timeout: 30 });

console.log("🗑️  Truncating ALL data tables in one command...");
try {
  await sql.unsafe(`
    TRUNCATE TABLE 
      jo_labor_comments, jo_material_comments, jo_labor_mechanics, jo_labor_photos, jo_material_photos,
      jo_labors, jo_materials, jo_comments, jo_photos, jo_payments, job_orders,
      checklist_videos, checklist_photos, labor_type_checklists, labor_prices,
      pr_line_photos, pr_line_comments, pr_lines_suppliers, pr_lines, pr_comments, purchase_requests,
      parts_audit, inventory_log, inventory_value, parts_suppliers, parts_prices, parts_photos,
      customer_addresses, customer_contacts, car_photos, cars, customers, cashiers, mechanics, mechanic_contacts,
      vendor_contacts, parts, cabinet_codes, brands, vendors,
      user_roles, role_views, role_tables, users,
      cash_log, quality_checklists, labor_types
    CASCADE
  `);
  console.log("✅ All tables cleared!");
} catch (e) {
  console.error("❌ Error:", e.message);
}
await sql.end();
