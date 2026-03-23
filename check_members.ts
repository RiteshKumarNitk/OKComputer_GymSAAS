import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log("--- Member Table ---");
    const membersRes = await client.query('SELECT "id", "tenantId", "userId", "fullName", "phone", "memberCode" FROM "Member" WHERE "phone" IN (\'8946887702\', \'8949491687\')');
    console.log(membersRes.rows);

    console.log("\n--- UserProfile Table ---");
    const usersRes = await client.query('SELECT "id", "tenantId", "fullName", "phone", "email", "role" FROM "UserProfile" WHERE "phone" IN (\'8946887702\', \'8949491687\')');
    console.log(usersRes.rows);

  } catch (err: any) {
    console.error("Database Interaction Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
