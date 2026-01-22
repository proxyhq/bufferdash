const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID from command line arguments
const customerId = process.argv[2];

if (!customerId) {
  console.error('Error: Please provide a customer ID as an argument');
  console.error('Usage: node get-bridge-customer.js <customerID>');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: `https://api.bridge.xyz/v0/customers/${customerId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Fetching customer with ID: ${customerId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Customer data:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error fetching customer:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
