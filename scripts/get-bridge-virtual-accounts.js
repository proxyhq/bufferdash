const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID from command line arguments
const customerId = process.argv[2];

if (!customerId) {
  console.error('Error: Missing required argument');
  console.error('Usage: node get-bridge-virtual-accounts.js <customerID>');
  console.error('Example: node get-bridge-virtual-accounts.js c0d069c7-f3d1-4da7-8215-4473a61518fc');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/customers/${customerId}/virtual_accounts`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Fetching virtual accounts for customer ID: ${customerId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Total virtual accounts:', res.data.count);
    console.log('Virtual accounts:');
    console.log(JSON.stringify(res.data.data, null, 2));
  })
  .catch(err => {
    console.error('Error fetching virtual accounts:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
