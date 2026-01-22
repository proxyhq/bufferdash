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

if (args.length < 9) {
  console.error('Usage: node configure-fee-external-account.js <bankName> <accountOwnerName> <accountNumber> <routingNumber> <streetLine1> <city> <state> <postalCode> <country> [checkingOrSavings]');
  console.error('Example: node configure-fee-external-account.js "Bank Name" "Account Owner" "1234567890" "121000248" "123 Main St" "San Francisco" "CA" "94105" "USA" checking');
  process.exit(1);
}

const bankName = args[0];
const accountOwnerName = args[1];
const accountNumber = args[2];
const routingNumber = args[3];
const streetLine1 = args[4];
const city = args[5];
const state = args[6];
const postalCode = args[7];
const country = args[8];
const checkingOrSavings = args[9] || 'checking';

// Generate an idempotency key
const idempotencyKey = `fee-external-account-${Date.now()}`;

const requestBody = {
  currency: "usd",
  bank_name: bankName,
  account_owner_name: accountOwnerName,
  account_type: "us",
  account: {
    account_number: accountNumber,
    routing_number: routingNumber,
    checking_or_savings: checkingOrSavings
  },
  address: {
    street_line_1: streetLine1,
    city: city,
    state: state,
    postal_code: postalCode,
    country: country
  }
};

const options = {
  method: 'POST',
  url: `${BRIDGE_API_URL}/developer/fee_external_account`,
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': idempotencyKey,
  },
  data: requestBody
};

console.log('Configuring fee external account...');
console.log('Bank Name:', bankName);
console.log('Account Owner:', accountOwnerName);
console.log('Account Number:', accountNumber);
console.log('Routing Number:', routingNumber);
console.log('Address:', `${streetLine1}, ${city}, ${state} ${postalCode}, ${country}`);
console.log('Account Type:', checkingOrSavings);
console.log('Request body:', JSON.stringify(requestBody, null, 2));

axios
  .request(options)
  .then((response) => {
    console.log('Response status:', response.status);
    console.log('Fee External Account created:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error('Error configuring fee external account:');
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
