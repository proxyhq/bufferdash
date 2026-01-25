#!/usr/bin/env node

/**
 * Script to create a US bank external account for a Bridge customer
 *
 * Usage:
 * node create-us-external-account.js <customerID>
 *
 * Example:
 * node create-us-external-account.js c0d069c7-f3d1-4da7-8215-4473a61518fc
 *
 * This creates a test account with sample data. Modify the requestBody for real accounts.
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
  console.log('Usage: node create-us-external-account.js <customerID>');
  process.exit(1);
}

const idempotencyKey = `ea-us-${customerId}-${Date.now()}`;

// Sample US bank account data - modify for real usage
const requestBody = {
  currency: 'usd',
  account_type: 'us',
  bank_name: 'Lead Bank',
  account_name: 'Checking Account',
  first_name: 'Test',
  last_name: 'User',
  account_owner_type: 'individual',
  account_owner_name: 'Test User',
  account: {
    routing_number: '101019644', // Lead Bank routing number
    account_number: '215268129123', // Sample account number
    checking_or_savings: 'checking',
  },
  address: {
    street_line_1: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94105',
    country: 'USA',
  },
};

async function createExternalAccount() {
  try {
    console.log(`Creating US bank account for customer: ${customerId}`);
    console.log(`Using idempotency key: ${idempotencyKey}`);
    console.log('Request body:');
    console.log(JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${BRIDGE_API_URL}/customers/${customerId}/external_accounts`,
      requestBody,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Api-Key': BRIDGE_API_KEY,
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    console.log('Response status:', response.status);
    console.log('External account created:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error creating external account:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

createExternalAccount();
