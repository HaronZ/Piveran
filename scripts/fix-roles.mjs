import XLSX from "xlsx";
import postgres from "postgres";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const S = XLSX.readFile(resolve(__dirname, "..", "..", "Security_Users.xlsx"), { cellDates: true });
const sql = postgres("postgresql://postgres.kumgolykeplwcbvbwgry:Haronzie123!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres", { max: 1, idle_timeout: 20 });

const roles = XLSX.utils.sheet_to_json(S.Sheets["Roles"], { defval: null, raw: false });
const users = XLSX.utils.sheet_to_json(S.Sheets["Users"], { defval: null, raw: false });
const userRoles = XLSX.utils.sheet_to_json(S.Sheets["User_roles"], { defval: null, raw: false });

// 1. Add roles 10 & 11
console.log("Adding missing roles from Excel...");
for (const r of roles) {
  const id = Math.floor(parseFloat(r["ID"]));
  if (id >= 10) {
    const name = r["Role"];
    const desc = r["Description"] || null;
    console.log("  Role " + id + ": " + name + " — " + desc);
    await sql`INSERT INTO roles (id, name, description) OVERRIDING SYSTEM VALUE VALUES (${id}, ${name}, ${desc}) ON CONFLICT (id) DO NOTHING`;
  }
}
console.log("  ✅ Roles added\n");

// 2. Re-insert the 5 failed user_roles
console.log("Re-inserting failed user_roles...");
const dbUsers = await sql`SELECT id, email FROM users`;
let fixed = 0;
for (const ur of userRoles) {
  const roleId = Math.floor(parseFloat(ur["Role"]));
  if (roleId < 10) continue;
  const excelUserId = String(ur["User"]).trim();
  const excelUser = users.find(u => String(u["ID"]).trim() === excelUserId);
  if (!excelUser) { console.log("  ⚠️ User not found: " + excelUserId); continue; }
  const email = (excelUser["Email"] || "").trim();
  const dbUser = dbUsers.find(u => u.email === email);
  if (!dbUser) { console.log("  ⚠️ DB user not found for: " + email); continue; }
  const id = crypto.randomUUID();
  await sql`INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (${id}, ${dbUser.id}, ${roleId}, ${ur["Created_date"] ? new Date(ur["Created_date"]).toISOString() : null}) ON CONFLICT DO NOTHING`;
  console.log("  ✅ " + excelUser["First Name"] + " (" + email + ") → Role " + roleId);
  fixed++;
}
console.log("\n🎉 Fixed " + fixed + " user_roles!");

// Verify
const [{count: rc}] = await sql`SELECT count(*) FROM user_roles`;
console.log("Total user_roles now: " + rc);
await sql.end();
