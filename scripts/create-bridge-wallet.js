const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key and master customer ID from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_MASTER_CUSTOMER_ID = process.env.BRIDGE_MASTER_CUSTOMER_ID;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

if (!BRIDGE_MASTER_CUSTOMER_ID) {
  console.error('Error: BRIDGE_MASTER_CUSTOMER_ID not found in environment variables');
  process.exit(1);
}

// Get chain from command line arguments or use default
const chain = process.argv[2] || 'solana'; // Default to 'solana' if not specified

// Use the master customer ID from .env.local
const customerId = BRIDGE_MASTER_CUSTOMER_ID;

console.log(`Using master customer ID: ${customerId}`);

// Generate an idempotency key to prevent duplicate wallet creation
const idempotencyKey = `wallet-${customerId}-${chain}-${Date.now()}`;

const options = {
  method: 'POST',
  url: `${BRIDGE_API_URL}/customers/${customerId}/wallets`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': idempotencyKey,
  },
  data: { chain },
};

console.log(`Creating ${chain} wallet for master customer ID: ${customerId}`);
console.log(`Using idempotency key: ${idempotencyKey}`);

axios
  .request(options)
  .then((res) => {
    console.log('Response status:', res.status);
    console.log('New wallet created:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch((err) => {
    console.error('Error creating wallet:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
