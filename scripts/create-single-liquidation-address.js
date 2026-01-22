const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get required arguments from command line
const customerId = process.argv[2];
const bridgeWalletId = process.argv[3];
const chain = process.argv[4];
const currency = process.argv[5];

// Validate required arguments
if (!customerId || !bridgeWalletId || !chain || !currency) {
  console.error('Usage: node create-single-liquidation-address.js <customerId> <walletId> <chain> <currency>');
  process.exit(1);
}

// Always use solana for destination_payment_rail and usdb for destination_currency
const destinationPaymentRail = 'solana';
const destinationCurrency = 'usdb';

// Function to create a liquidation address
async function createLiquidationAddress() {
  // Generate idempotency key to prevent duplicate requests
  const idempotencyKey = `liquidation-address-${customerId}-${chain}-${currency}-${Date.now()}`;
  
  console.log(`Creating liquidation address for customer: ${customerId}`);
  console.log(`Chain: ${chain}, Currency: ${currency}`);
  console.log(`Bridge Wallet ID: ${bridgeWalletId}`);
  console.log(`Destination Payment Rail: ${destinationPaymentRail}`);
  console.log(`Destination Currency: ${destinationCurrency}`);
  
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.bridge.xyz/v0/customers/${customerId}/liquidation_addresses`,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Api-Key': BRIDGE_API_KEY,
        'Idempotency-Key': idempotencyKey
      },
      data: {
        chain: chain,
        currency: currency,
        bridge_wallet_id: bridgeWalletId,
        destination_payment_rail: destinationPaymentRail,
        destination_currency: destinationCurrency
      }
    });
    
    console.log('\nSUCCESS! Liquidation address created:');
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('\nERROR creating liquidation address:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Error data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      return {
        success: false,
        status: error.response.status,
        error: error.response.data
      };
    } else {
      console.error(error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Execute the function
createLiquidationAddress()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
