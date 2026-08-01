import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const adminEmail = 'admin@taskboard.com';
  const pwd = 'a';
  console.log('Started seeding');
  const existAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existAdmin) {
    const hashedPassword = await bcrypt.hash(pwd, 10);
    await prisma.user.create({
      data: {
        globalRole: 'GLOBAL_ADMIN',
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
      },
    });
    console.log('Created Global Admin.');
  } else {
    console.log('Global admin already exists.');
  }
  console.log('Finished seeding.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
