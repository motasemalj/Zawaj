import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking mother users...\n');
  
  const motherUsers = await prisma.user.findMany({
    where: { role: 'mother' }
  });
  
  console.log(`Found ${motherUsers.length} mother users:\n`);
  
  for (const user of motherUsers) {
    console.log(`User: ${user.display_name}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Mother For: ${user.mother_for}`);
    console.log(`  Ward Name: ${user.ward_display_name || 'N/A'}`);
    
    if (!user.mother_for) {
      console.log(`  ⚠️  WARNING: mother_for is NULL!`);
      
      // Try to infer from ward data or default to 'son'
      let inferredMotherFor = 'son'; // default
      
      if (user.ward_display_name) {
        // Could add logic to infer from name, but for now default to 'son'
        console.log(`  → Will set to: ${inferredMotherFor} (inferred)`);
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: { mother_for: inferredMotherFor }
      });
      
      console.log(`  ✅ Fixed!`);
    } else {
      console.log(`  ✅ OK`);
    }
    console.log('');
  }
  
  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


