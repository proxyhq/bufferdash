const axios = require('axios');
require('dotenv').config({ path: '.env.local' });
const { v4: uuidv4 } = require('uuid');

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get transfer ID from command line arguments
const transferId = process.argv[2];

if (!transferId) {
  console.error('Error: Please provide a transfer ID as an argument');
  console.error('Usage: node delete-bridge-transfer.js <transferID>');
  process.exit(1);
}

const options = {
  method: 'DELETE',
  url: `https://api.bridge.xyz/v0/transfers/${transferId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Deleting transfer with ID: ${transferId}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Transfer deleted successfully:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error deleting transfer:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
