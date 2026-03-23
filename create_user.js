const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_jFdM6Kc0koXn@ep-sweet-surf-a1sapxz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log("Connecting with Prisma JS...");
  await prisma.$connect();

  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
     console.log("Creating default tenant...");
     tenant = await prisma.tenant.create({
       data: { name: "Default Gym", slug: "default-gym", status: "active" }
     });
  }
  
  console.log(`Using Tenant ID: ${tenant.id}`);

  const user = await prisma.userProfile.upsert({
    where: { email: "testmember@example.com" },
    update: { phone: "8949491687" },
    create: {
       email: "testmember@example.com",
       fullName: "Test Gym Member",
       phone: "8949491687",
       role: "member",
       tenantId: tenant.id
    }
  });

  await prisma.member.upsert({
    where: { 
       tenantId_memberCode: { tenantId: tenant.id, memberCode: "8949491687" } 
    },
    update: { phone: "8949491687", userId: user.id },
    create: {
       tenantId: tenant.id,
       memberCode: "8949491687",
       fullName: "Test Gym Member",
       phone: "8949491687",
       status: "active",
       userId: user.id
    }
  });

  console.log("Success: Member linked to UserProfile!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
