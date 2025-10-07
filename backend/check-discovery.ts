import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const swipes = await prisma.swipe.count();
  const matches = await prisma.match.count();
  const discoverySeen = await prisma.discoverySeen.count();
  
  console.log('Database state:');
  console.log(`  Swipes: ${swipes}`);
  console.log(`  Matches: ${matches}`);
  console.log(`  DiscoverySeen: ${discoverySeen}`);
  
  // Check a sample male user's eligible targets
  const sampleMale = await prisma.user.findFirst({ where: { role: 'male' } });
  if (sampleMale) {
    console.log(`\nSample male user: ${sampleMale.display_name}`);
    
    // Count eligible females
    const eligibleFemales = await prisma.user.count({ 
      where: { 
        role: 'female',
        id: { not: sampleMale.id },
        muslim_affirmed: true
      } 
    });
    console.log(`  Eligible females: ${eligibleFemales}`);
  }
  
  // Check a sample female user's eligible targets
  const sampleFemale = await prisma.user.findFirst({ where: { role: 'female' } });
  if (sampleFemale) {
    console.log(`\nSample female user: ${sampleFemale.display_name}`);
    
    // Count eligible males
    const eligibleMales = await prisma.user.count({ 
      where: { 
        role: 'male',
        id: { not: sampleFemale.id },
        muslim_affirmed: true
      } 
    });
    console.log(`  Eligible males: ${eligibleMales}`);
  }
}

main().finally(() => prisma.$disconnect());
