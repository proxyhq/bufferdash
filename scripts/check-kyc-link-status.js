#!/usr/bin/env node

/**
 * Script to check the status of a Bridge KYC link
 * 
 * Usage:
 * node check-kyc-link-status.js <kyc_link_id>
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

// Get the Bridge API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY environment variable is not set');
  process.exit(1);
}

// Get the KYC link ID from command line arguments
const kycLinkId = process.argv[2];

if (!kycLinkId) {
  console.error('Error: KYC link ID is required');
  console.error('Usage: node check-kyc-link-status.js <kyc_link_id>');
  process.exit(1);
}

async function checkKycLinkStatus(kycLinkId) {
  try {
    console.log(`Checking status of KYC link: ${kycLinkId}`);
    
    const response = await fetch(`${BRIDGE_API_URL}/kyc_links/${kycLinkId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': BRIDGE_API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error: ${response.status} - ${response.statusText}`);
      console.error('Error details:', JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    console.log('KYC Link Status:');
    console.log(JSON.stringify(data, null, 2));
    
    // Print a summary of the most important fields
    console.log('\nSummary:');
    console.log(`- ID: ${data.id}`);
    console.log(`- KYC Status: ${data.kyc_status}`);
    console.log(`- TOS Status: ${data.tos_status}`);
    console.log(`- Customer ID: ${data.customer_id}`);
    console.log(`- Email: ${data.email}`);
    console.log(`- Created At: ${data.created_at}`);
    
    if (data.kyc_status === 'completed') {
      console.log('\nKYC process has been completed successfully!');
    } else if (data.kyc_status === 'pending') {
      console.log('\nKYC process is still pending. User needs to complete verification.');
    } else if (data.kyc_status === 'rejected') {
      console.log('\nKYC process was rejected. User may need to try again.');
    } else if (data.kyc_status === 'not_started') {
      console.log('\nKYC process has not been started yet.');
    }
    
  } catch (error) {
    console.error('Error checking KYC link status:', error.message);
    process.exit(1);
  }
}

// Run the function
checkKycLinkStatus(kycLinkId);
