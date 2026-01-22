#!/usr/bin/env node

/**
 * Script to get total balances of all Bridge Wallets
 *
 * Usage:
 * node get-bridge-wallet-total-balances.js
 *
 * This script fetches the total balances across all Bridge wallets,
 * grouped by currency and chain.
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

// Make API request
async function getTotalBalances() {
  try {
    console.log('Fetching total balances of all Bridge Wallets...\n');
    
    const response = await axios.get(`${BRIDGE_API_URL}/wallets/total_balances`, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const balances = response.data;

    if (!Array.isArray(balances) || balances.length === 0) {
      console.log('No balances found.');
      return;
    }

    console.log(`Found ${balances.length} currency/chain combinations:\n`);
    
    // Calculate total USD value (if applicable)
    let totalUsdValue = 0;
    
    // Display balances in a formatted table
    console.log('Total Balances:');
    console.log('─'.repeat(80));
    console.log(
      'Currency'.padEnd(12) +
      'Chain'.padEnd(12) +
      'Balance'.padEnd(20) +
      'Contract Address'
    );
    console.log('─'.repeat(80));

    balances.forEach((balance) => {
      const currency = (balance.currency || '').padEnd(12);
      const chain = (balance.chain || '').padEnd(12);
      const balanceAmount = (balance.balance || '0').padEnd(20);
      const contractAddress = balance.contract_address || 'N/A';
      
      console.log(`${currency}${chain}${balanceAmount}${contractAddress}`);
      
      // Try to accumulate USD value (assuming all balances are in USD equivalent)
      const balanceValue = parseFloat(balance.balance || 0);
      if (!isNaN(balanceValue)) {
        totalUsdValue += balanceValue;
      }
    });

    console.log('─'.repeat(80));
    console.log(`\nTotal USD Value (sum of all balances): $${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    // Also output raw JSON for programmatic use
    console.log('\nRaw JSON Response:');
    console.log(JSON.stringify(balances, null, 2));
  } catch (error) {
    console.error('Error fetching total balances:');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Execute the function
getTotalBalances();

