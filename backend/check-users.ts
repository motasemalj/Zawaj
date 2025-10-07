import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, role: true, mother_for: true, display_name: true } });
  console.log('Total users:', users.length);
  console.log('\nBy role:');
  const males = users.filter(u => u.role === 'male');
  const females = users.filter(u => u.role === 'female');
  const mothersForSons = users.filter(u => u.role === 'mother' && u.mother_for === 'son');
  const mothersForDaughters = users.filter(u => u.role === 'mother' && u.mother_for === 'daughter');
  console.log(`  Males: ${males.length}`);
  console.log(`  Females: ${females.length}`);
  console.log(`  Mothers (for sons): ${mothersForSons.length}`);
  console.log(`  Mothers (for daughters): ${mothersForDaughters.length}`);
  
  console.log('\nSample users:');
  users.slice(0, 10).forEach(u => {
    console.log(`  - ${u.display_name} (${u.role}${u.mother_for ? ` - ${u.mother_for}` : ''})`);
  });
}

main().finally(() => prisma.$disconnect());
