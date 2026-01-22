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
  console.error('Error: Customer ID and Virtual Account ID are required');
  console.log('Usage: node get-virtual-account-activity.js <customerId> <virtualAccountId>');
  process.exit(1);
}

// Build URL
const url = `${BRIDGE_API_URL}/customers/${customerId}/virtual_accounts/${virtualAccountId}/history`;

// Make API request
async function getVirtualAccountActivity() {
  try {
    console.log(`Fetching activity history for virtual account: ${virtualAccountId}`);
    console.log(`Customer ID: ${customerId}`);
    
    const response = await axios.get(url, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Print the virtual account activity details
    console.log('\nVirtual Account Activity History:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error fetching virtual account activity:');
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
getVirtualAccountActivity();
