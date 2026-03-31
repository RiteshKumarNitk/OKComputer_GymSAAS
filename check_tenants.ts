import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const client = new Client({
    connectionString,
  });
  await client.connect();

  try {
    const res = await client.query('SELECT id, name, slug FROM "Tenant"');
    console.log("Tenants found:", res.rowCount);
    console.log("Tenant Data:", JSON.stringify(res.rows, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
