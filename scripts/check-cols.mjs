import postgres from 'postgres';
const sql = postgres('postgresql://postgres.kumgolykeplwcbvbwgry:Haronzie123!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres');

const tables = ['jo_payments', 'brands'];
for (const t of tables) {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${t} ORDER BY ordinal_position`;
  console.log(`\n${t} columns:`);
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
}
await sql.end();
