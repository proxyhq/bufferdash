const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get webhook URL from command line arguments or use default
const webhookUrl = process.argv[2] || 'https://aweqnasofldabdhpcsvo.supabase.co/functions/v1/bridge-webhook';

// Get event categories from command line arguments (comma-separated) or use default
const eventCategoriesArg = process.argv[3] || 'customer,external_account,kyc_link,liquidation_address,liquidation_address.drain,transfer,virtual_account,virtual_account.activity';
const eventCategories = eventCategoriesArg.split(',');

const options = {
  method: 'POST',
  url: 'https://api.bridge.xyz/v0/webhooks',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': `webhook-${Date.now()}` // Use timestamp for idempotency key
  },
  data: {
    url: webhookUrl,
    event_epoch: 'webhook_creation',
    event_categories: eventCategories
  }
};

console.log(`Creating webhook endpoint at URL: ${webhookUrl}`);
console.log(`Event categories: ${eventCategories.join(', ')}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Webhook created:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error creating webhook:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
