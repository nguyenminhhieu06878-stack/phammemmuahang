import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testUsers() {
  console.log('🔍 Checking all users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.active ? '✅' : '❌'}`);
    console.log('');
  });

  // Test login for ke_toan
  console.log('🔐 Testing ke_toan login...\n');
  
  const keToan = await prisma.user.findUnique({
    where: { email: 'ketoan@demo.com' },
  });

  if (!keToan) {
    console.log('❌ User ketoan@demo.com NOT FOUND!');
    return;
  }

  console.log('✅ User found:', keToan.name);
  console.log('   Email:', keToan.email);
  console.log('   Role:', keToan.role);
  console.log('   Active:', keToan.active);

  // Test password
  const testPassword = '123456';
  const isPasswordValid = await bcrypt.compare(testPassword, keToan.password);
  
  console.log(`\n🔑 Password test for "${testPassword}":`, isPasswordValid ? '✅ VALID' : '❌ INVALID');

  if (!isPasswordValid) {
    console.log('\n⚠️  Password mismatch! Resetting password...');
    const newHashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.update({
      where: { email: 'ketoan@demo.com' },
      data: { password: newHashedPassword },
    });
    console.log('✅ Password reset successfully!');
  }
}

testUsers()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
