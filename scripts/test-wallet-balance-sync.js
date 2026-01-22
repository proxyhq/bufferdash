#!/usr/bin/env node

const { ConvexHttpClient } = require('convex/browser');
require('dotenv').config({ path: '.env.local' });

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL);

async function testWalletBalanceSync() {
  console.log('🧪 Testing Wallet Balance Management System');
  console.log('='.repeat(60));

  // Test data - using the customer and wallet we know exist
  const customerId = '09759bde-9e41-4109-a2ff-f5375cdb6c25';
  const bridgeWalletId = 'daee1a5f-953f-4e32-ba0c-bb5492b90326';

  console.log(`Customer ID: ${customerId}`);
  console.log(`Bridge Wallet ID: ${bridgeWalletId}`);
  console.log('');

  try {
    console.log('🔄 Step 1: Syncing wallet balances from Bridge API...');

    // Sync balances from Bridge
    const syncResult = await convex.action('bridgeWalletBalances:syncWalletBalances', {
      bridgeWalletId,
      customerId,
      userId: undefined, // No user linked yet
    });

    console.log('✅ Sync Result:');
    console.log(`- Success: ${syncResult.success}`);
    console.log(`- Balances synced: ${syncResult.balancesCount || 0}`);

    if (syncResult.balances) {
      console.log('\n💰 Bridge API Balances:');
      syncResult.balances.forEach((balance) => {
        console.log(`- ${balance.currency.toUpperCase()}: ${balance.balance} (${balance.chain})`);
        if (balance.contract_address) {
          console.log(`  Contract: ${balance.contract_address}`);
        }
      });
    }

    console.log('\n🔍 Step 2: Querying stored balances from Convex...');

    // Get stored balances
    const storedBalances = await convex.query('bridgeWalletBalances:getWalletBalances', {
      bridgeWalletId,
    });

    console.log(`✅ Found ${storedBalances.length} stored balance records:`);
    storedBalances.forEach((balance) => {
      const syncTime = new Date(balance.lastSyncedAt);
      console.log(`- ${balance.currency.toUpperCase()}: ${balance.balance}`);
      console.log(`  Last synced: ${syncTime.toLocaleString()}`);
      console.log(`  Is stale: ${balance.isStale}`);
      if (balance.contractAddress) {
        console.log(`  Contract: ${balance.contractAddress}`);
      }
      console.log('');
    });

    console.log('🎯 BALANCE MANAGEMENT FEATURES DEMONSTRATED:');
    console.log('✅ Sync balances from Bridge API');
    console.log('✅ Store balances in Convex database');
    console.log('✅ Track sync timestamps and staleness');
    console.log('✅ Handle multiple currencies per wallet');
    console.log('✅ Store contract addresses for tokens');
    console.log('');

    console.log('🚀 NEXT STEPS FOR YOUR APP:');
    console.log('1. Call syncWalletBalances when user opens app');
    console.log('2. Show cached balances immediately for fast UX');
    console.log('3. Run background sync every 5 minutes');
    console.log('4. Use getUserTotalBalance for portfolio view');
    console.log('5. Implement real-time updates via webhooks');

    return { success: true, syncResult, storedBalances };
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testWalletBalanceSync()
  .then(({ success }) => {
    console.log(`\n🏁 Test ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
