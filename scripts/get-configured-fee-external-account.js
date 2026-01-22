const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Environment
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/developer/fee_external_account`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
  },
};

console.log('Fetching configured fee External Account...');

axios
  .request(options)
  .then((response) => {
    console.log('Response status:', response.status);
    console.log('Configured fee External Account:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error('Error fetching configured fee External Account:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  });


