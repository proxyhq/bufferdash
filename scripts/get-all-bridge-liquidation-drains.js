const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get optional parameters from command line arguments
const limit = process.argv[2] || 10;
const startingAfter = process.argv[3] || undefined;
const endingBefore = process.argv[4] || undefined;
const updatedAfterMs = process.argv[5] || undefined;
const updatedBeforeMs = process.argv[6] || undefined;

// Build query parameters
const queryParams = new URLSearchParams();
if (limit) queryParams.append('limit', limit);
if (startingAfter) queryParams.append('starting_after', startingAfter);
if (endingBefore) queryParams.append('ending_before', endingBefore);
if (updatedAfterMs) queryParams.append('updated_after_ms', updatedAfterMs);
if (updatedBeforeMs) queryParams.append('updated_before_ms', updatedBeforeMs);

// Build URL
const url = `${BRIDGE_API_URL}/liquidation_addresses/drains${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

// Make API request
async function getLiquidationDrains() {
  try {
    console.log(`Fetching liquidation address drains from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Print the raw response
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nRaw Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Print pagination info if available
    if (response.data && response.data.has_more) {
      console.log('\nHas more results. To get the next page, use:');
      const lastId = response.data.data[response.data.data.length - 1].id;
      console.log(`node get-all-bridge-liquidation-drains.js ${limit} ${lastId}`);
    }
  } catch (error) {
    console.error('Error fetching liquidation address drains:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Print usage information
console.log('Fetching liquidation address drains across all customers');
console.log('Usage: node get-all-bridge-liquidation-drains.js [limit] [startingAfter] [endingBefore] [updatedAfterMs] [updatedBeforeMs]');
console.log('Parameters:');
console.log('  limit: The number of items to return (default: 10, max: 100)');
console.log('  startingAfter: Drain ID to start after (for pagination)');
console.log('  endingBefore: Drain ID to end before (for pagination)');
console.log('  updatedAfterMs: Unix timestamp in ms to filter drains updated after');
console.log('  updatedBeforeMs: Unix timestamp in ms to filter drains updated before');
console.log('');

// Execute the function
getLiquidationDrains();
