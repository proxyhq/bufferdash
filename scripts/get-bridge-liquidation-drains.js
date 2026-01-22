const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key and master customer ID from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_MASTER_CUSTOMER_ID = process.env.BRIDGE_MASTER_CUSTOMER_ID;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

if (!BRIDGE_MASTER_CUSTOMER_ID) {
  console.error('Error: BRIDGE_MASTER_CUSTOMER_ID not found in environment variables');
  process.exit(1);
}

// Get liquidation address ID from command line arguments
const liquidationAddressId = process.argv[2];

if (!liquidationAddressId) {
  console.error('Error: Liquidation Address ID is required');
  console.error('Usage: node get-bridge-liquidation-drains.js <liquidationAddressId> [limit] [startingAfter] [endingBefore] [updatedAfterMs] [updatedBeforeMs]');
  process.exit(1);
}

// Get optional parameters from command line arguments
const limit = process.argv[3] || 10;
const startingAfter = process.argv[4] || undefined;
const endingBefore = process.argv[5] || undefined;
const updatedAfterMs = process.argv[6] || undefined;
const updatedBeforeMs = process.argv[7] || undefined;

// Build query parameters
const queryParams = new URLSearchParams();
if (limit) queryParams.append('limit', limit);
if (startingAfter) queryParams.append('starting_after', startingAfter);
if (endingBefore) queryParams.append('ending_before', endingBefore);
if (updatedAfterMs) queryParams.append('updated_after_ms', updatedAfterMs);
if (updatedBeforeMs) queryParams.append('updated_before_ms', updatedBeforeMs);

const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

const options = {
  method: 'GET',
  url: `https://api.bridge.xyz/v0/customers/${BRIDGE_MASTER_CUSTOMER_ID}/liquidation_addresses/${liquidationAddressId}/drains${queryString}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Getting drain history for liquidation address: ${liquidationAddressId}`);
console.log(`Customer ID: ${BRIDGE_MASTER_CUSTOMER_ID}`);
if (limit !== 10) console.log(`Limit: ${limit}`);
if (startingAfter) console.log(`Starting after: ${startingAfter}`);
if (endingBefore) console.log(`Ending before: ${endingBefore}`);
if (updatedAfterMs) console.log(`Updated after: ${new Date(parseInt(updatedAfterMs)).toISOString()}`);
if (updatedBeforeMs) console.log(`Updated before: ${new Date(parseInt(updatedBeforeMs)).toISOString()}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Drain history:');
    console.log(JSON.stringify(res.data, null, 2));
    
    // Summary of results
    if (res.data && res.data.data && Array.isArray(res.data.data)) {
      console.log(`\nFound ${res.data.data.length} drain records`);
      
      if (res.data.data.length > 0) {
        console.log('\nSummary of drains:');
        res.data.data.forEach((drain, index) => {
          console.log(`[${index + 1}] Drain ID: ${drain.id}`);
          console.log(`    State: ${drain.state}`);
          console.log(`    Amount: ${drain.amount} ${drain.currency}`);
          console.log(`    Created: ${drain.created_at}`);
          if (drain.destination_tx_hash) {
            console.log(`    Destination TX: ${drain.destination_tx_hash}`);
          }
        });
      }
    }
  })
  .catch(err => {
    console.error('Error getting drain history:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
