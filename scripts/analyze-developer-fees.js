#!/usr/bin/env node

/**
 * Script to analyze historical developer fees
 * 
 * This script:
 * 1. Fetches all transfers and looks for developer fees
 * 2. Checks virtual accounts for developer_fee_percent settings
 * 3. Calculates total fees accrued
 * 
 * Usage:
 * node analyze-developer-fees.js [limit]
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

const limit = parseInt(process.argv[2]) || 1000; // Get more transfers to find historical fees

async function analyzeDeveloperFees() {
  try {
    console.log('Analyzing developer fees...\n');
    
    // 1. Get transfers (API limit is 100)
    console.log('1. Fetching transfers...');
    const maxLimit = Math.min(limit, 100); // API max is 100
    
    let transfers = [];
    try {
      const transfersResponse = await axios.get(`${BRIDGE_API_URL}/transfers?limit=${maxLimit}`, {
        headers: {
          'Api-Key': BRIDGE_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      let transferData = transfersResponse.data;
      if (!Array.isArray(transferData)) {
        transferData = transferData.data || transferData.results || [];
      }
      transfers = transferData;
    } catch (err) {
      // Try without limit if it fails
      try {
        const transfersResponse = await axios.get(`${BRIDGE_API_URL}/transfers`, {
          headers: {
            'Api-Key': BRIDGE_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        let transferData = transfersResponse.data;
        if (!Array.isArray(transferData)) {
          transferData = transferData.data || transferData.results || [];
        }
        transfers = transferData;
      } catch (err2) {
        console.log(`   Warning: Could not fetch transfers: ${err2.message}`);
      }
    }

    console.log(`   Found ${transfers.length} transfers\n`);

    // Analyze transfers for developer fees
    let totalDeveloperFees = 0;
    let transfersWithFees = [];
    let transfersByDate = {};

    transfers.forEach(transfer => {
      const developerFee = parseFloat(transfer.developer_fee || transfer.receipt?.developer_fee || 0);
      
      if (developerFee > 0) {
        totalDeveloperFees += developerFee;
        transfersWithFees.push({
          id: transfer.id,
          created_at: transfer.created_at,
          amount: transfer.amount,
          developer_fee: developerFee,
          receipt: transfer.receipt
        });

        // Calculate fee percentage
        const amount = parseFloat(transfer.amount || 0);
        const feePercent = amount > 0 ? (developerFee / amount) * 100 : 0;
        
        const date = transfer.created_at ? new Date(transfer.created_at).toISOString().split('T')[0] : 'unknown';
        if (!transfersByDate[date]) {
          transfersByDate[date] = { count: 0, totalFees: 0, feePercentages: [] };
        }
        transfersByDate[date].count++;
        transfersByDate[date].totalFees += developerFee;
        if (feePercent > 0) {
          transfersByDate[date].feePercentages.push(feePercent);
        }
      }
    });

    // 2. Get virtual accounts and check their developer fee settings
    console.log('2. Checking virtual accounts for developer fee settings...\n');
    
    // First, get all customers
    const customersResponse = await axios.get(`${BRIDGE_API_URL}/customers`, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    let customers = customersResponse.data;
    if (!Array.isArray(customers)) {
      customers = customers.data || customers.results || [];
    }

    console.log(`   Found ${customers.length} customers\n`);

    let virtualAccountsWithFees = [];
    let totalVirtualAccountFees = 0;

    // Check virtual accounts for each customer
    for (const customer of customers.slice(0, 50)) { // Limit to first 50 customers to avoid too many API calls
      try {
        const vaResponse = await axios.get(
          `${BRIDGE_API_URL}/customers/${customer.id}/virtual_accounts`,
          {
            headers: {
              'Api-Key': BRIDGE_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        let virtualAccounts = vaResponse.data;
        if (!Array.isArray(virtualAccounts)) {
          virtualAccounts = virtualAccounts.data || virtualAccounts.results || [];
        }

        for (const va of virtualAccounts) {
          if (va.developer_fee_percent && parseFloat(va.developer_fee_percent) > 0) {
            virtualAccountsWithFees.push({
              customer_id: customer.id,
              virtual_account_id: va.id,
              developer_fee_percent: va.developer_fee_percent,
              created_at: va.created_at
            });
          }

          // Get history for this virtual account to find actual fees
          try {
            const historyResponse = await axios.get(
              `${BRIDGE_API_URL}/customers/${customer.id}/virtual_accounts/${va.id}/history?limit=100`,
              {
                headers: {
                  'Api-Key': BRIDGE_API_KEY,
                  'Content-Type': 'application/json'
                }
              }
            );

            let history = historyResponse.data;
            if (history.data && Array.isArray(history.data)) {
              history.data.forEach(event => {
                if (event.developer_fee_amount && parseFloat(event.developer_fee_amount) > 0) {
                  totalVirtualAccountFees += parseFloat(event.developer_fee_amount);
                }
              });
            }
          } catch (err) {
            // Skip if we can't get history
          }
        }
      } catch (err) {
        // Skip if we can't get virtual accounts for this customer
      }
    }

    // Print results
    console.log('='.repeat(80));
    console.log('DEVELOPER FEE ANALYSIS RESULTS');
    console.log('='.repeat(80));
    console.log();

    // Transfer fees
    console.log('TRANSFER FEES:');
    console.log(`  Total transfers analyzed: ${transfers.length}`);
    console.log(`  Transfers with developer fees: ${transfersWithFees.length}`);
    console.log(`  Total developer fees from transfers: $${totalDeveloperFees.toFixed(2)}`);
    console.log();

    if (transfersWithFees.length > 0) {
      console.log('  Transfers with fees (showing first 10):');
      transfersWithFees.slice(0, 10).forEach(t => {
        const amount = parseFloat(t.amount);
        const feePercent = amount > 0 ? (t.developer_fee / amount) * 100 : 0;
        console.log(`    - ${t.id.substring(0, 8)}... | ${t.created_at} | Amount: $${amount} | Fee: $${t.developer_fee.toFixed(2)} (${feePercent.toFixed(2)}%)`);
      });
      console.log();

      // Show fee percentages found
      const feePercentages = transfersWithFees.map(t => {
        const amount = parseFloat(t.amount);
        return amount > 0 ? (t.developer_fee / amount) * 100 : 0;
      }).filter(p => p > 0);
      
      if (feePercentages.length > 0) {
        const avgFeePercent = feePercentages.reduce((a, b) => a + b, 0) / feePercentages.length;
        const minFeePercent = Math.min(...feePercentages);
        const maxFeePercent = Math.max(...feePercentages);
        console.log(`  Fee percentage range: ${minFeePercent.toFixed(2)}% - ${maxFeePercent.toFixed(2)}%`);
        console.log(`  Average fee percentage: ${avgFeePercent.toFixed(2)}%`);
        console.log();
      }
    } else {
      console.log('  ⚠️  No transfers found with developer fees (all show 0.0)');
      console.log('  This suggests fees were recently changed to 0%');
      console.log();
    }

    // Virtual account fees
    console.log('VIRTUAL ACCOUNT FEES:');
    console.log(`  Virtual accounts with fee settings: ${virtualAccountsWithFees.length}`);
    console.log(`  Total developer fees from virtual accounts: $${totalVirtualAccountFees.toFixed(2)}`);
    console.log();

    if (virtualAccountsWithFees.length > 0) {
      console.log('  Virtual accounts with developer fee percentages:');
      virtualAccountsWithFees.forEach(va => {
        console.log(`    - Customer: ${va.customer_id.substring(0, 8)}... | VA: ${va.virtual_account_id.substring(0, 8)}... | Fee: ${va.developer_fee_percent}% | Created: ${va.created_at}`);
      });
      console.log();
    }

    // Summary
    const grandTotal = totalDeveloperFees + totalVirtualAccountFees;
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Total Developer Fees Accrued: $${grandTotal.toFixed(2)}`);
    console.log(`    - From Transfers: $${totalDeveloperFees.toFixed(2)}`);
    console.log(`    - From Virtual Accounts: $${totalVirtualAccountFees.toFixed(2)}`);
    console.log();

    // If no fees found, provide guidance
    if (grandTotal === 0 && transfersWithFees.length === 0) {
      console.log('⚠️  No historical developer fees found.');
      console.log('This could mean:');
      console.log('  1. Fees were always set to 0%');
      console.log('  2. Fees were recently changed to 0% (as you mentioned)');
      console.log('  3. Historical data may not be available through the API');
      console.log();
      console.log('To find the previous fee percentage (you mentioned ~2%):');
      console.log('  - Check Bridge dashboard for historical settings');
      console.log('  - Review older transfer receipts if available');
      console.log('  - Check virtual account configurations that may still have the old percentage');
    }

  } catch (error) {
    console.error('Error analyzing developer fees:');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Execute
analyzeDeveloperFees();

