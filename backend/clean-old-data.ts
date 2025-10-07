import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning old interaction data...\n');
  
  const deletedSwipes = await prisma.swipe.deleteMany();
  console.log(`✅ Deleted ${deletedSwipes.count} old swipes`);
  
  const deletedSeen = await prisma.discoverySeen.deleteMany();
  console.log(`✅ Deleted ${deletedSeen.count} old discoverySeen records`);
  
  const deletedMatches = await prisma.match.deleteMany();
  console.log(`✅ Deleted ${deletedMatches.count} old matches`);
  
  const deletedMessages = await prisma.message.deleteMany();
  console.log(`✅ Deleted ${deletedMessages.count} old messages\n`);
  
  console.log('✅ All old interaction data cleaned!');
  console.log('�� Users can now see fresh profiles without exclusions\n');
}

main().finally(() => prisma.$disconnect());
