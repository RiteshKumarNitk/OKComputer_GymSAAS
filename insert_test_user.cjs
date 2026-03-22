const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = '+11234567890'; // Standard test phone number
  const email = 'testuser@example.com';

  const user = await prisma.userProfile.upsert({
    where: { email: email },
    update: { phone: phone },
    create: {
      email: email,
      phone: phone,
      fullName: 'Test User',
      role: 'member',
      isActive: true,
    },
  });

  console.log('✅ Test user created or updated:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
