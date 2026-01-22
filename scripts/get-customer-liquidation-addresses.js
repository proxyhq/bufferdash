#!/usr/bin/env node

/**
 * Script to get all liquidation addresses for a Bridge customer
 * 
 * Usage:
 * node get-customer-liquidation-addresses.js <customerID> [limit] [starting_after] [ending_before]
 * 
 * Examples:
 * node get-customer-liquidation-addresses.js 67050ef2-f4ea-4069-90d8-86885f7e6580
 * node get-customer-liquidation-addresses.js 67050ef2-f4ea-4069-90d8-86885f7e6580 20
 * node get-customer-liquidation-addresses.js 67050ef2-f4ea-4069-90d8-86885f7e6580 10 8a0da1a2-499b-49e0-a4be-864b9796f5f6
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get command line arguments
const customerId = process.argv[2];
const limit = process.argv[3] || 10;
const startingAfter = process.argv[4] || null;
const endingBefore = process.argv[5] || null;

if (!customerId) {
  console.error('Error: Missing required customer ID argument');
  console.error('Usage: node get-customer-liquidation-addresses.js <customerID> [limit] [starting_after] [ending_before]');
  process.exit(1);
}

// Build query parameters
const queryParams = new URLSearchParams();
if (limit) queryParams.append('limit', limit);
if (startingAfter) queryParams.append('starting_after', startingAfter);
if (endingBefore) queryParams.append('ending_before', endingBefore);

const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/customers/${customerId}/liquidation_addresses${queryString}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Fetching liquidation addresses for customer ID: ${customerId}`);
if (limit) console.log(`Limit: ${limit}`);
if (startingAfter) console.log(`Starting after: ${startingAfter}`);
if (endingBefore) console.log(`Ending before: ${endingBefore}`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Liquidation addresses:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(error => {
    console.error('Error getting liquidation addresses:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  });
