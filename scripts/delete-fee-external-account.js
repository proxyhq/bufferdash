#!/usr/bin/env node

/**
 * Script to delete a fee external account
 * 
 * Usage:
 * node delete-fee-external-account.js <customerID> <externalAccountID>
 * 
 * Example:
 * node delete-fee-external-account.js 33b19774-7c60-42af-93f2-1b95f0ecd2a3 75de6a46-e240-4b98-8e17-bbaa1352ef56
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID and external account ID from command line arguments
const customerId = process.argv[2];
const externalAccountId = process.argv[3];

if (!customerId || !externalAccountId) {
  console.error('Error: Please provide both customer ID and external account ID as arguments');
  console.error('Usage: node delete-fee-external-account.js <customerID> <externalAccountID>');
  process.exit(1);
}

const options = {
  method: 'DELETE',
  url: `${BRIDGE_API_URL}/customers/${customerId}/external_accounts/${externalAccountId}`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
  },
};

console.log(`Deleting fee external account ${externalAccountId} for customer ${customerId}...`);

axios
  .request(options)
  .then((response) => {
    console.log('Response status:', response.status);
    console.log('Fee External Account deleted:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error('Error deleting fee external account:');
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
