import pg from "pg";
import fs from "fs";

const { Client } = pg;

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    const membersRes = await client.query('SELECT "id", "tenantId", "userId", "fullName", "phone" FROM "Member" WHERE "phone" IN (\'8946887702\', \'8949491687\')');
    const usersRes = await client.query('SELECT "id", "tenantId", "fullName", "phone", "email" FROM "UserProfile" WHERE "phone" IN (\'8946887702\', \'8949491687\')');

    const output = {
       members: membersRes.rows,
       users: usersRes.rows
    };

    fs.writeFileSync("output_members.json", JSON.stringify(output, null, 2));
    console.log("Written output_members.json successfully!");

  } catch (err: any) {
    console.error("Database Interaction Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
