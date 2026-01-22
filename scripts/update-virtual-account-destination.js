const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Environment
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: node update-virtual-account-destination.js <customerID> <virtualAccountID> <destinationAddress> [developerFeePercent]');
  console.error('Example: node update-virtual-account-destination.js cust_123 va_456 Ab2iFGYAGXMQiC9ZHNt1eCXiT87VVgu44Zz3qooXANGk 1.5');
  process.exit(1);
}

const customerID = args[0];
const virtualAccountID = args[1];
const destinationAddress = args[2];
const developerFeePercent = args[3]; // Optional

// Build request body
const requestBody = {
  destination: {
    currency: "usdc",
    payment_rail: "solana",
    address: destinationAddress
  }
};

// Add developer fee if provided
if (developerFeePercent !== undefined) {
  const feePercent = parseFloat(developerFeePercent);
  if (isNaN(feePercent) || feePercent < 0 || feePercent >= 100) {
    console.error('Error: developerFeePercent must be a number between 0 and 100 (exclusive)');
    process.exit(1);
  }
  requestBody.developer_fee_percent = developerFeePercent;
}

const options = {
  method: 'PUT',
  url: `${BRIDGE_API_URL}/customers/${customerID}/virtual_accounts/${virtualAccountID}`,
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
  },
  data: requestBody
};

console.log(`Updating Virtual Account ${virtualAccountID}...`);
console.log(`Customer ID: ${customerID}`);
console.log(`New destination address: ${destinationAddress}`);
if (developerFeePercent !== undefined) {
  console.log(`New developer fee: ${developerFeePercent}%`);
}
console.log('Request body:', JSON.stringify(requestBody, null, 2));

axios
  .request(options)
  .then((response) => {
    console.log('Response status:', response.status);
    console.log('Updated Virtual Account:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error('Error updating virtual account:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  });
