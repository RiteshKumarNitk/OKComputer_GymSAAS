import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const client = new Client({
    connectionString,
  });
  await client.connect();

  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("True Tables:", res.rows.map(r => r.table_name));
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
