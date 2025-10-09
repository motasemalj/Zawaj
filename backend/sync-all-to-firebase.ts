#!/usr/bin/env tsx
/**
 * One-time script to sync all existing users and matches to Firebase
 * Run with: npx tsx sync-all-to-firebase.ts
 */

import { prisma } from './src/prisma';
import { syncUserToFirebase, createFirestoreConversation } from './src/services/firebase-sync';

async function main() {
  console.log('🔄 Starting Firebase sync for all users and matches...\n');
  
  // 1. Sync all users
  console.log('📋 Step 1: Syncing all users to Firebase Auth & Firestore...');
  const users = await prisma.user.findMany({
    include: {
      photos: { orderBy: { ordering: 'asc' } },
    },
  });
  
  let usersSynced = 0;
  for (const user of users) {
    try {
      await syncUserToFirebase({
        id: user.id,
        email: user.email || `${user.id}@zawaj.app`,
        display_name: user.display_name || user.phone || 'User',
        role: user.role || undefined,
        photos: user.photos as any,
      });
      usersSynced++;
      process.stdout.write(`\r  Synced ${usersSynced}/${users.length} users...`);
    } catch (error: any) {
      console.error(`\n  ❌ Failed to sync user ${user.id}:`, error.message);
    }
  }
  console.log(`\n  ✅ Synced ${usersSynced}/${users.length} users\n`);
  
  // 2. Create Firestore conversations for all matches
  console.log('📋 Step 2: Creating Firestore conversations for all matches...');
  const matches = await prisma.match.findMany({
    include: {
      user_a: { include: { photos: { orderBy: { ordering: 'asc' } } } },
      user_b: { include: { photos: { orderBy: { ordering: 'asc' } } } },
    },
  });
  
  let conversationsCreated = 0;
  for (const match of matches) {
    try {
      await createFirestoreConversation(
        match.id,
        {
          id: match.user_a.id,
          email: match.user_a.email || `${match.user_a.id}@zawaj.app`,
          display_name: match.user_a.display_name || match.user_a.phone || 'User',
          role: match.user_a.role || undefined,
          photos: match.user_a.photos as any,
        },
        {
          id: match.user_b.id,
          email: match.user_b.email || `${match.user_b.id}@zawaj.app`,
          display_name: match.user_b.display_name || match.user_b.phone || 'User',
          role: match.user_b.role || undefined,
          photos: match.user_b.photos as any,
        }
      );
      conversationsCreated++;
      process.stdout.write(`\r  Created ${conversationsCreated}/${matches.length} conversations...`);
    } catch (error: any) {
      console.error(`\n  ❌ Failed to create conversation ${match.id}:`, error.message);
    }
  }
  console.log(`\n  ✅ Created ${conversationsCreated}/${matches.length} conversations\n`);
  
  console.log('🎉 Firebase sync complete!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Users synced: ${usersSynced}/${users.length}`);
  console.log(`  - Conversations created: ${conversationsCreated}/${matches.length}`);
  console.log(`\n✅ All existing users can now use Firebase chat!`);
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});

