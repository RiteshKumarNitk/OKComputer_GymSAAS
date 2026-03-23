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
    console.log("Querying members without userProfile link...");
    const membersRes = await client.query('SELECT * FROM "Member" WHERE "userId" IS NULL');
    console.log(`Found ${membersRes.rows.length} members missing UserProfile linking.`);

    for (const member of membersRes.rows) {
      if (!member.phone) {
         console.log(`Skipping member ${member.fullName} - has no phone number.`);
         continue;
      }

      const email = member.email || `${member.memberCode.toLowerCase()}@example.com`;
      console.log(`Processing member: ${member.fullName} (${member.phone}) -> ${email}`);

      try {
        const userQuery = `
          INSERT INTO "UserProfile" ("id", "email", "phone", "fullName", "role", "tenantId", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, 'member', $4, NOW())
          ON CONFLICT ("email") DO UPDATE SET "phone" = $2, "fullName" = $3
          RETURNING *;
        `;
        const userRes = await client.query(userQuery, [email, member.phone, member.fullName, member.tenantId]);
        const userId = userRes.rows[0].id;

        await client.query('UPDATE "Member" SET "userId" = $1, "updatedAt" = NOW() WHERE "id" = $2', [userId, member.id]);
        console.log(`   Linked successfully to UserProfile ID: ${userId}`);

      } catch (err: any) {
        console.log(`   Error processing ${member.fullName}:`, err.message);
      }
    }
    console.log("Database Repair / Sync Complete!");

  } catch (err: any) {
    console.error("Database Interaction Error:", err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
