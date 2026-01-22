const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get command line arguments
const fullName = process.argv[2];
const email = process.argv[3];
const type = process.argv[4] || 'individual'; // Default to 'individual' if not specified

if (!fullName || !email) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node create-bridge-kyc-link.js <fullName> <email> [type]');
  console.error('Example: node create-bridge-kyc-link.js "John Doe" johndoe@example.com individual');
  process.exit(1);
}

// Generate an idempotency key
const idempotencyKey = `kyc-link-${email}-${uuidv4()}`;

const options = {
  method: 'POST',
  url: `${BRIDGE_API_URL}/kyc_links`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': idempotencyKey
  },
  data: {
    full_name: fullName,
    email: email,
    type: type
  }
};

console.log(`Creating KYC link for ${fullName} (${email}) with type: ${type}`);
console.log(`Using idempotency key: ${idempotencyKey}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('KYC link created:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error creating KYC link:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
