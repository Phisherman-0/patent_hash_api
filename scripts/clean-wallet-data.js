import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { walletConnections, users } from '../dist/shared/schema.js';
import { eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/patent_hash';
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const db = drizzle(pool);

async function cleanWalletData() {
  console.log('🧹 Starting wallet data cleanup...');
  
  try {
    // 1. Remove all wallet connections from walletConnections table
    console.log('📋 Checking existing wallet connections...');
    const existingConnections = await db.select().from(walletConnections);
    console.log(`Found ${existingConnections.length} wallet connections`);
    
    if (existingConnections.length > 0) {
      console.log('🗑️  Removing all wallet connections...');
      const deletedConnections = await db.delete(walletConnections);
      console.log(`✅ Deleted ${deletedConnections.rowCount || existingConnections.length} wallet connections`);
    }
    
    // 2. Clean wallet data from user settings
    console.log('🔍 Checking user settings for wallet data...');
    const usersWithSettings = await db.select().from(users);
    
    let cleanedUsers = 0;
    for (const user of usersWithSettings) {
      if (user.settings) {
        let settings = user.settings;
        let needsUpdate = false;
        
        // Remove old walletConfig (legacy)
        if (settings.walletConfig) {
          delete settings.walletConfig;
          needsUpdate = true;
          console.log(`  - Removed walletConfig from user ${user.email}`);
        }
        
        // Remove hashPackWallet data
        if (settings.hashPackWallet) {
          delete settings.hashPackWallet;
          needsUpdate = true;
          console.log(`  - Removed hashPackWallet from user ${user.email}`);
        }
        
        // Remove any other wallet-related settings
        const walletKeys = Object.keys(settings).filter(key => 
          key.toLowerCase().includes('wallet') || 
          key.toLowerCase().includes('hashpack') ||
          key.toLowerCase().includes('hedera')
        );
        
        walletKeys.forEach(key => {
          delete settings[key];
          needsUpdate = true;
          console.log(`  - Removed ${key} from user ${user.email}`);
        });
        
        if (needsUpdate) {
          await db.update(users)
            .set({ settings, updatedAt: new Date() })
            .where(eq(users.id, user.id));
          cleanedUsers++;
        }
      }
    }
    
    console.log(`✅ Cleaned wallet data from ${cleanedUsers} user settings`);
    
    // 3. Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  - Wallet connections removed: ${existingConnections.length}`);
    console.log(`  - User settings cleaned: ${cleanedUsers}`);
    console.log('  - Database is now clean of mock wallet data');
    
    console.log('\n✨ Wallet data cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
cleanWalletData()
  .then(() => {
    console.log('🎉 Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });

export { cleanWalletData };
