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
  console.error('Usage: node delete-bridge-webhook.js <webhookID>');
  process.exit(1);
}

const options = {
  method: 'DELETE',
  url: `https://api.bridge.xyz/v0/webhooks/${webhookId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Attempting to delete webhook with ID: ${webhookId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
  })
  .catch(err => {
    console.error('Error deleting webhook:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
