const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get webhook ID from command line arguments
const webhookId = process.argv[2];

if (!webhookId) {
  console.error('Error: Please provide a webhook ID as an argument');
  console.error('Usage: node enable-bridge-webhook.js <webhookID>');
  process.exit(1);
}

const options = {
  method: 'PUT',
  url: `https://api.bridge.xyz/v0/webhooks/${webhookId}`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY
  },
  data: {
    status: 'active'
  }
};

console.log(`Enabling webhook with ID: ${webhookId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Webhook updated:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error enabling webhook:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
