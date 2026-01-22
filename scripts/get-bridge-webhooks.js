const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: 'https://api.bridge.xyz/v0/webhooks',
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log('Fetching webhook endpoints from Bridge API...');

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Total webhooks:', res.data.length);
    console.log('Webhook endpoints:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error fetching webhook endpoints:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
