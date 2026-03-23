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
    let tenantRes = await client.query('SELECT "id" FROM "tenant" LIMIT 1').catch(() => null);
    if (!tenantRes) {
      tenantRes = await client.query('SELECT "id" FROM "Tenant" LIMIT 1').catch(() => null);
    }
    
    let tenantId;
    if (!tenantRes || tenantRes.rows.length === 0) {
      console.log("No Tenant found! Attempting to create one...");
      tenantId = "default-tenant-uuid";
      await client.query(`
        INSERT INTO "Tenant" ("id", "name", "slug", "status", "updatedAt")
        VALUES ($1, 'Default Gym', 'default-gym', 'active', NOW())
        ON CONFLICT ("id") DO NOTHING;
      `, [tenantId]).catch(() => null);
    } else {
      tenantId = tenantRes.rows[0].id;
    }

    console.log(`Using Tenant ID: ${tenantId}`);

    const insertMember = async (tableName: string) => {
      const query = `
        INSERT INTO "${tableName}" ("id", "tenantId", "memberCode", "fullName", "phone", "status", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          $1,
          '8949491687',
          'Test Gym Member',
          '8949491687',
          'active',
          NOW()
        )
        ON CONFLICT ("tenantId", "memberCode") 
        DO UPDATE SET "phone" = '8949491687'
        RETURNING *;
      `;
      try {
         const res = await client.query(query, [tenantId]);
         console.log(`Table ${tableName} upserted successfully.`);
      } catch (err: any) {
         console.log(`Table ${tableName} insertion skipped: ${err.message}`);
      }
    };

    await insertMember("Member");
    await insertMember("member");

    console.log("Member insertions complete!");
  } catch (err: any) {
    console.error("Database Interaction Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
