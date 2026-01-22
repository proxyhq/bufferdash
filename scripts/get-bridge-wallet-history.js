#!/usr/bin/env node

/**
 * Script to get transaction history for a Bridge wallet
 * 
 * Usage:
 * node get-bridge-wallet-history.js <wallet_id> [limit]
 * 
 * Example:
 * node get-bridge-wallet-history.js 6bdc262c-57d6-4a1e-a312-e617b8aabe5d 20
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get wallet ID from command line arguments
const walletId = process.argv[2];
const limit = process.argv[3] || 10; // Default to 10 if not specified

// Validate required parameters
if (!walletId) {
  console.error('Error: Missing wallet ID');
  console.error('Usage: node get-bridge-wallet-history.js <wallet_id> [limit]');
  process.exit(1);
}

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/wallets/${walletId}/history`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  },
  params: {
    limit: limit
  }
};

console.log(`Fetching transaction history for wallet ${walletId} (limit: ${limit})`);

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Transaction history:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(error => {
    console.error('Error fetching wallet history:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
  });
