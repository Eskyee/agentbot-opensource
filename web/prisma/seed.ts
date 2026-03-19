import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Optionally seed demo user
  await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      password: '$2b$10$demoHashedPassword', // Replace with bcrypt hash
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });