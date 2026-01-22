const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID and wallet ID from command line arguments
const customerId = process.argv[2];
const walletId = process.argv[3];

if (!customerId || !walletId) {
  console.error('Error: Please provide both customer ID and wallet ID as arguments');
  console.error('Usage: node get-bridge-wallet.js <customerID> <walletID>');
  process.exit(1);
}

console.log(`Fetching wallet ${walletId} for customer ID: ${customerId}`);

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/customers/${customerId}/wallets/${walletId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
  },
};

axios
  .request(options)
  .then((response) => {
    console.log('Response status:', response.status);
    console.log('Wallet details:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error('Error fetching wallet:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  });
