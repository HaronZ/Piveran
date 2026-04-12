import XLSX from "xlsx";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const S = XLSX.readFile(resolve(__dirname, "..", "..", "Security_Users.xlsx"), { cellDates: true });
const roles = XLSX.utils.sheet_to_json(S.Sheets["Roles"], { defval: null, raw: false });
console.log("Column headers:", Object.keys(roles[0]));
console.log("\nALL ROLES:");
roles.forEach(r => {
  const vals = Object.entries(r).map(([k,v]) => k + "=" + v);
  console.log("  " + vals.join(" | "));
});
