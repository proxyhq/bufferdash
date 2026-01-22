#!/usr/bin/env node

/**
 * Script to manually trigger liquidation drain sync
 * 
 * Usage:
 * node trigger-drain-sync.js [hours]
 * 
 * Examples:
 * node trigger-drain-sync.js        # Sync last 6 hours (default)
 * node trigger-drain-sync.js 24     # Sync last 24 hours
 */

const { ConvexHttpClient } = require('convex/browser');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

// Validate environment
if (!CONVEX_URL) {
  console.error('❌ Error: EXPO_PUBLIC_CONVEX_URL not found in environment variables');
  process.exit(1);
}

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

// Parse command line arguments
const hoursBack = parseInt(process.argv[2]) || 6; // Default: last 6 hours

console.log(`🚀 Triggering liquidation drain sync`);
console.log(`📅 Time range: Last ${hoursBack} hours`);
console.log('');

async function triggerSync() {
  try {
    console.log('⏳ Running sync...');
    
    const result = await convex.action('syncLiquidationDrains:syncLiquidationDrainsManual', {
      hoursBack
    });

    console.log('');
    console.log('📊 Sync Results:');
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  📝 Message: ${result.message}`);
    console.log(`  🔄 Synced: ${result.syncedCount} drains`);
    console.log(`  ❌ Errors: ${result.errorCount || 0}`);
    console.log(`  📊 Total checked: ${result.totalChecked}`);
    
    if (result.missingFound !== undefined) {
      console.log(`  🔍 Missing found: ${result.missingFound}`);
    }

    if (result.success) {
      console.log('');
      console.log('🎉 Sync completed successfully!');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Sync failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('💥 Error triggering sync:', error.message);
    process.exit(1);
  }
}

// Run the sync
triggerSync(); 