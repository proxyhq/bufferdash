#!/usr/bin/env node

/**
 * Script to list upcoming events for a Bridge webhook
 * 
 * Usage:
 * node list-bridge-webhook-events.js [webhook_id]
 * 
 * If webhook_id is not provided, it will use the BRIDGE_WEBHOOK_ID from .env.local
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

// Get webhook ID from command line arguments or environment variables
let webhookId = process.argv[2] || process.env.BRIDGE_WEBHOOK_ID;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

if (!webhookId) {
  console.error('Error: No webhook ID provided');
  console.error('Usage: node list-bridge-webhook-events.js [webhook_id]');
  console.error('Or set BRIDGE_WEBHOOK_ID in your .env.local file');
  process.exit(1);
}

console.log(`Fetching upcoming events for webhook ID: ${webhookId}`);

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/webhooks/${webhookId}/events`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    
    if (res.data && res.data.length > 0) {
      console.log(`Found ${res.data.length} upcoming events:`);
      res.data.forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(JSON.stringify(event, null, 2));
      });
    } else {
      console.log('No upcoming events found for this webhook.');
    }
  })
  .catch(err => {
    console.error('Error fetching webhook events:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
