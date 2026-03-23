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
    console.log("Querying Tenant table...");
    const tenantRes = await client.query('SELECT "id" FROM "Tenant" LIMIT 1');
    if (tenantRes.rows.length === 0) {
      console.log("No Tenant found! Creating tenant...");
      await client.query(`INSERT INTO "Tenant" ("id", "name", "slug", "status", "updatedAt") VALUES ('default-tenant', 'Default Gym', 'default-gym', 'active', NOW())`);
    }
    const tenantId = tenantRes.rows.length > 0 ? tenantRes.rows[0].id : "default-tenant";

    console.log(`Using Tenant ID: ${tenantId}`);

    const userId = "test-user-profile-id";
    const userQuery = `
      INSERT INTO "UserProfile" ("id", "email", "phone", "role", "tenantId", "updatedAt")
      VALUES ($1, 'testmember@example.com', '8949491687', 'member', $2, NOW())
      ON CONFLICT ("email") DO UPDATE SET "phone" = '8949491687'
      RETURNING *;
    `;
    
    const userRes = await client.query(userQuery, [userId, tenantId]);
    const finalUserId = userRes.rows[0].id;
    console.log("UserProfile upserted:", finalUserId);

    const memberQuery = `
      INSERT INTO "Member" ("id", "tenantId", "memberCode", "fullName", "phone", "status", "userId", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, '8949491687', 'Test Gym Member', '8949491687', 'active', $2, NOW())
      ON CONFLICT ("tenantId", "memberCode") DO UPDATE SET "phone" = '8949491687', "userId" = $2
      RETURNING *;
    `;
    
    await client.query(memberQuery, [tenantId, finalUserId]);
    console.log("Success: Member and UserProfile linked!");

  } catch (err: any) {
    console.error("Database Interaction Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
