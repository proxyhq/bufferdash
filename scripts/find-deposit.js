#!/usr/bin/env node

/**
 * Find a deposit/transaction by ID across all virtual accounts
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found');
  process.exit(1);
}

const searchId = process.argv[2];
if (!searchId) {
  console.error('Usage: node find-deposit.js <transaction_id>');
  process.exit(1);
}

async function findDeposit() {
  try {
    console.log(`Searching for transaction/deposit: ${searchId}\n`);
    
    // Get all customers
    const customersRes = await axios.get(`${BRIDGE_API_URL}/customers`, {
      headers: { 'Api-Key': BRIDGE_API_KEY }
    });
    
    let customers = customersRes.data;
    if (!Array.isArray(customers)) {
      customers = customers.data || customers.results || [];
    }
    
    console.log(`Checking ${customers.length} customers...\n`);
    
    // Check each customer's virtual accounts
    for (const customer of customers) {
      try {
        const vaRes = await axios.get(
          `${BRIDGE_API_URL}/customers/${customer.id}/virtual_accounts`,
          { headers: { 'Api-Key': BRIDGE_API_KEY } }
        );
        
        let vas = vaRes.data;
        if (!Array.isArray(vas)) {
          vas = vas.data || vas.results || [];
        }
        
        for (const va of vas) {
          try {
            const historyRes = await axios.get(
              `${BRIDGE_API_URL}/customers/${customer.id}/virtual_accounts/${va.id}/history?limit=100`,
              { headers: { 'Api-Key': BRIDGE_API_KEY } }
            );
            
            const events = historyRes.data?.data || [];
            
            for (const event of events) {
              if (event.id === searchId || 
                  event.deposit_id === searchId ||
                  event.destination_tx_hash === searchId) {
                
                console.log('='.repeat(80));
                console.log('FOUND TRANSACTION!');
                console.log('='.repeat(80));
                console.log(`Customer ID: ${customer.id}`);
                console.log(`Virtual Account ID: ${va.id}`);
                console.log(`Event ID: ${event.id}`);
                console.log(`Type: ${event.type}`);
                console.log(`Amount: ${event.amount} ${event.currency}`);
                console.log(`Created: ${event.created_at}`);
                
                if (event.destination) {
                  console.log(`\nDestination Wallet:`);
                  console.log(`  Address: ${event.destination.address || event.destination.to_address || 'N/A'}`);
                  console.log(`  Payment Rail: ${event.destination.payment_rail || 'N/A'}`);
                  console.log(`  Currency: ${event.destination.currency || 'N/A'}`);
                }
                
                if (event.destination_tx_hash) {
                  console.log(`\nDestination TX Hash: ${event.destination_tx_hash}`);
                }
                
                console.log('\nFull Event Data:');
                console.log(JSON.stringify(event, null, 2));
                return;
              }
            }
          } catch (err) {
            // Skip if can't get history
          }
        }
      } catch (err) {
        // Skip if can't get VAs
      }
    }
    
    console.log('Transaction not found in virtual account history.');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

findDeposit();

