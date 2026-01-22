#!/usr/bin/env node

/**
 * Script to get a liquidation address from Bridge API
 * 
 * Usage:
 * node get-bridge-liquidation-address.js <customerID> <liquidationAddressId>
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_MASTER_CUSTOMER_ID = process.env.BRIDGE_MASTER_CUSTOMER_ID;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

// Get command line arguments
const customerId = process.argv[2];
const liquidationAddressId = process.argv[3];

if (!customerId || !liquidationAddressId) {
  console.error('Error: Customer ID and Liquidation Address ID are required');
  console.error('Usage: node get-bridge-liquidation-address.js <customerID> <liquidationAddressId>');
  process.exit(1);
}

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY environment variable is not set');
  process.exit(1);
}

// No longer need to check for BRIDGE_MASTER_CUSTOMER_ID as we're using the provided customer ID

/**
 * Get a liquidation address from Bridge API
 */
async function getLiquidationAddress(customerId, liquidationAddressId) {
  try {
    console.log(`Getting liquidation address with ID: ${liquidationAddressId}`);
    
    const response = await axios({
      method: 'GET',
      url: `${BRIDGE_API_URL}/customers/${customerId}/liquidation_addresses/${liquidationAddressId}`,
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error getting liquidation address:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Main execution
(async () => {
  try {
    const liquidationAddress = await getLiquidationAddress(customerId, liquidationAddressId);
    console.log('Liquidation Address Details:');
    console.log(JSON.stringify(liquidationAddress, null, 2));
  } catch (error) {
    process.exit(1);
  }
})();
