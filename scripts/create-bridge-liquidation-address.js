const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customerId, walletId, optional chain & currency from CLI args
const customerId = process.argv[2];
const bridgeWalletId = process.argv[3] || '';
const singleChain = process.argv[4];
const singleCurrency = process.argv[5];

if (!customerId) {
  console.error(
    'Usage: node create-bridge-liquidation-address.js <customerId> [walletId] [chain] [currency]'
  );
  process.exit(1);
}

// Always use solana for destination_payment_rail and usdb for destination_currency
const destinationPaymentRail = 'solana';
const destinationCurrency = 'usdb';

let liquidationConfigs = [
  { chain: 'tron', currency: 'usdt' },
  { chain: 'ethereum', currency: 'usdt' },
  { chain: 'ethereum', currency: 'usdc' },
  { chain: 'arbitrum', currency: 'usdc' },
  { chain: 'solana', currency: 'usdc' },
  { chain: 'base', currency: 'usdc' },
];

// If specific chain/currency passed, override config list
if (singleChain && singleCurrency) {
  liquidationConfigs = [{ chain: singleChain, currency: singleCurrency }];
}

// Function to create a liquidation address
async function createLiquidationAddress(chain, currency) {
  // Generate idempotency key to prevent duplicate requests
  const idempotencyKey = `liquidation-address-${customerId}-${chain}-${currency}-${Date.now()}`;

  const options = {
    method: 'POST',
    url: `https://api.bridge.xyz/v0/customers/${customerId}/liquidation_addresses`,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'Api-Key': BRIDGE_API_KEY,
      'Idempotency-Key': idempotencyKey,
    },
    data: {
      chain,
      currency,
      bridge_wallet_id: bridgeWalletId || undefined,
      destination_payment_rail: destinationPaymentRail,
      destination_currency: destinationCurrency,
    },
  };

  console.log(`\nCreating liquidation address for customer: ${customerId}`);
  console.log(`Chain: ${chain}, Currency: ${currency}`);
  if (bridgeWalletId) console.log(`Bridge Wallet ID: ${bridgeWalletId}`);
  console.log(`Destination Payment Rail: ${destinationPaymentRail}`);
  console.log(`Destination Currency: ${destinationCurrency}`);

  try {
    const res = await axios.request(options);
    console.log('✅ SUCCESS - Response status:', res.status);
    console.log('RAW RESPONSE FROM BRIDGE:');
    console.log(JSON.stringify(res.data, null, 2));
    console.log('\nFULL RESPONSE HEADERS:');
    console.log(res.headers);
    return res.data;
  } catch (err) {
    console.log('❌ ERROR RESPONSE FROM BRIDGE:');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Status Text:', err.response.statusText);
      console.log('\nRAW ERROR DATA (JSON):');
      console.log(JSON.stringify(err.response.data, null, 2));
      console.log('\nERROR RESPONSE HEADERS:');
      console.log(err.response.headers);
      console.log('\nFULL ERROR RESPONSE STRUCTURE:');
      console.log('- Status:', err.response.status);
      console.log('- Data keys:', Object.keys(err.response.data || {}));
      console.log('- Headers keys:', Object.keys(err.response.headers || {}));

      // Check if this is an "already exists" error and extract more details
      if (
        err.response.data &&
        err.response.data.code === 'invalid_parameters' &&
        err.response.data.message &&
        err.response.data.message.includes('already exists')
      ) {
        console.log('\n🔍 DUPLICATE DETECTION:');
        console.log('- Existing liquidation address ID:', err.response.data.id);
        console.log('- Error code:', err.response.data.code);
        console.log('- Full message:', err.response.data.message);

        return {
          id: err.response.data.id || 'unknown',
          chain,
          currency,
          status: 'already_exists',
          full_error_data: err.response.data, // Include full error for analysis
        };
      }
    } else {
      console.error('No response object available:');
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
    }
    return null;
  }
}

// Main execution function
async function createAllLiquidationAddresses() {
  console.log('Creating liquidation addresses for multiple chains and currencies');
  console.log(`Bridge Wallet ID: ${bridgeWalletId || 'Not specified'}`);
  console.log(`Total configurations to process: ${liquidationConfigs.length}`);

  const results = {
    success: [],
    failed: [],
  };

  for (const config of liquidationConfigs) {
    const result = await createLiquidationAddress(config.chain, config.currency);
    if (result) {
      if (result.status === 'already_exists') {
        results.success.push({
          chain: config.chain,
          currency: config.currency,
          address: 'Already exists',
          id: result.id,
          status: 'already_exists',
        });
      } else {
        results.success.push({
          chain: config.chain,
          currency: config.currency,
          address: result.address,
          id: result.id,
        });
      }
    } else {
      results.failed.push({
        chain: config.chain,
        currency: config.currency,
      });
    }

    // Add a small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully created: ${results.success.length} liquidation addresses`);
  console.log(`Failed to create: ${results.failed.length} liquidation addresses`);

  if (results.success.length > 0) {
    console.log('\nSuccessful addresses:');
    results.success.forEach((item) => {
      if (item.status === 'already_exists') {
        console.log(`- ${item.chain}/${item.currency}: Already exists (ID: ${item.id})`);
      } else {
        console.log(`- ${item.chain}/${item.currency}: ${item.address} (ID: ${item.id})`);
      }
    });
  }

  if (results.failed.length > 0) {
    console.log('\nFailed configurations:');
    results.failed.forEach((item) => {
      console.log(`- ${item.chain}/${item.currency}`);
    });
  }
}

// Execute the main function
createAllLiquidationAddresses().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
