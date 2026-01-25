#!/usr/bin/env node

/**
 * Script to get external accounts for a Bridge customer
 *
 * Usage:
 * node get-customer-external-accounts.js <customerID>
 *
 * Example:
 * node get-customer-external-accounts.js c0d069c7-f3d1-4da7-8215-4473a61518fc
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

const customerId = process.argv[2];

if (!customerId) {
  console.error('Error: Customer ID is required');
  console.log('Usage: node get-customer-external-accounts.js <customerID>');
  process.exit(1);
}

async function getExternalAccounts() {
  try {
    console.log(`Fetching external accounts for customer: ${customerId}`);

    const response = await axios.get(
      `${BRIDGE_API_URL}/customers/${customerId}/external_accounts`,
      {
        headers: {
          Accept: 'application/json',
          'Api-Key': BRIDGE_API_KEY,
        },
      }
    );

    console.log('Response status:', response.status);
    console.log('External accounts:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching external accounts:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

getExternalAccounts();
