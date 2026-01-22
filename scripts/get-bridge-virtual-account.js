const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID and virtual account ID from command line arguments
const customerId = process.argv[2];
const virtualAccountId = process.argv[3];

if (!customerId || !virtualAccountId) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node get-bridge-virtual-account.js <customerID> <virtualAccountID>');
  console.error('Example: node get-bridge-virtual-account.js 67050ef2-f4ea-4069-90d8-86885f7e6580 1f9065cb-88cb-4482-aa31-bdd796ef598b');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/customers/${customerId}/virtual_accounts/${virtualAccountId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Fetching virtual account ${virtualAccountId} for customer ${customerId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Virtual account details:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error fetching virtual account:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
