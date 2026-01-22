const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get transfer ID from command line argument
const transferId = process.argv[2];

if (!transferId) {
  console.error('Error: Transfer ID is required');
  console.log('Usage: node get-bridge-transfer.js <transferId>');
  process.exit(1);
}

// Build URL
const url = `${BRIDGE_API_URL}/transfers/${transferId}`;

// Make API request
async function getTransfer() {
  try {
    console.log(`Fetching transfer with ID: ${transferId}`);
    
    const response = await axios.get(url, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Print the transfer details
    console.log('\nTransfer Details:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error fetching transfer:');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Execute the function
getTransfer();
