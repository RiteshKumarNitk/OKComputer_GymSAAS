import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log("Connecting to database with Prisma...");
  await prisma.$connect();

  const members = await prisma.member.findMany({
    where: { userId: null }
  });

  console.log(`Found ${members.length} members missing UserProfile linking.`);

  for (const member of members) {
    if (!member.phone) {
       console.log(`Skipping member ${member.fullName} - has no phone number.`);
       continue;
    }

    const email = member.email || `${member.memberCode.toLowerCase()}@example.com`;
    console.log(`Processing member: ${member.fullName} (${member.phone}) -> ${email}`);

    try {
      const user = await prisma.userProfile.upsert({
         where: { email },
         update: { phone: member.phone },
         create: {
            email,
            fullName: member.fullName,
            phone: member.phone,
            role: "member",
            tenantId: member.tenantId
         }
      });

      await prisma.member.update({
         where: { id: member.id },
         data: { userId: user.id }
      });

      console.log(`   Linked successfully to UserProfile ID: ${user.id}`);
    } catch (err: any) {
      console.error(`   Error processing ${member.fullName}:`, err.message);
    }
  }

  console.log("Database Repair / Sync Complete!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
