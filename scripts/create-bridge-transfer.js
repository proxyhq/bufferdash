#!/usr/bin/env node

/**
 * Script to create a transfer using Bridge API
 *
 * Usage:
 * node create-bridge-transfer.js <amount> <customer_id> <source_wallet_id> <destination_address> [source_currency] [dest_currency] [dest_rail] [developer_fee]
 *
 * Example:
 * node create-bridge-transfer.js 10.00 c0d069c7-f3d1-4da7-8215-4473a61518fc 6bdc262c-57d6-4a1e-a312-e617b8aabe5d GdrJXy6H5xCRqf7zdu3JbGbB2wNL15xoHRuhgahDRPGD usdb usdc solana 0.5
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

// Get parameters from command line arguments
const amount = process.argv[2];
const customerId = process.argv[3];
const sourceWalletId = process.argv[4];
const destinationAddress = process.argv[5];
const sourceCurrency = process.argv[6] || 'usdc';
const destCurrency = process.argv[7] || 'usdc';
const destRail = process.argv[8] || 'solana';

// Validate required parameters
if (!amount || !customerId || !sourceWalletId || !destinationAddress) {
  console.error('Error: Missing required parameters');
  console.error(
    'Usage: node create-bridge-transfer.js <amount> <customer_id> <source_wallet_id> <destination_address> [source_currency] [dest_currency] [dest_rail] [developer_fee]'
  );
  process.exit(1);
}

// Generate a client reference ID
const clientReferenceId = `transfer-${Date.now()}`;

// Generate an idempotency key to prevent duplicate transfers
const idempotencyKey = `transfer-${customerId}-${sourceWalletId}-${Date.now()}`;

// Get optional developer fee from command line arguments
const developerFee = process.argv[10] || null;

// Prepare request body
const requestBody = {
  client_reference_id: clientReferenceId,
  amount,
  on_behalf_of: customerId,
  source: {
    currency: sourceCurrency,
    payment_rail: 'bridge_wallet',
    bridge_wallet_id: sourceWalletId,
  },
  destination: {
    currency: destCurrency,
    payment_rail: destRail,
    to_address: destinationAddress,
  },
};

// Add developer fee if provided
if (developerFee) {
  requestBody.developer_fee = developerFee;
}

const options = {
  method: 'POST',
  url: `${BRIDGE_API_URL}/transfers`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': idempotencyKey,
  },
  data: requestBody,
};

console.log(`Creating transfer from wallet ${sourceWalletId} to address ${destinationAddress}`);
console.log(`Amount: ${amount} ${sourceCurrency} -> ${destCurrency} (${destRail})`);
if (developerFee) {
  console.log(`Developer fee: ${developerFee}`);
}
console.log(`Using idempotency key: ${idempotencyKey}`);
console.log('Request body:');
console.log(JSON.stringify(requestBody, null, 2));

axios
  .request(options)
  .then((res) => {
    console.log('Response status:', res.status);
    console.log('Transfer created:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch((error) => {
    console.error('Error creating transfer:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
  });
