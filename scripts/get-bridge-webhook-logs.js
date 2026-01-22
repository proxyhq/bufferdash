#!/usr/bin/env node

/**
 * Script to view logs for a Bridge webhook
 *
 * Usage:
 * node get-bridge-webhook-logs.js [webhook_id]
 *
 * If webhook_id is not provided, it will use the BRIDGE_WEBHOOK_ID from .env.local
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

// Get webhook ID from command line arguments or environment variables
const webhookId = process.argv[2] || process.env.BRIDGE_WEBHOOK_ID;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

if (!webhookId) {
  console.error('Error: No webhook ID provided');
  console.error('Usage: node get-bridge-webhook-logs.js [webhook_id]');
  console.error('Or set BRIDGE_WEBHOOK_ID in your .env.local file');
  process.exit(1);
}

console.log(`Fetching logs for webhook ID: ${webhookId}`);

const options = {
  method: 'GET',
  url: `${BRIDGE_API_URL}/webhooks/${webhookId}/logs`,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY,
  },
};

axios
  .request(options)
  .then((res) => {
    console.log('Response status:', res.status);
    console.log('\nRaw response data:');
    console.log(JSON.stringify(res.data, null, 2));

    // Display the raw data without any processing
    if (res.data && res.data.data && res.data.data.length > 0) {
      console.log(`\nFound ${res.data.data.length} log entries with raw payloads:`);

      // Get the most recent log entry
      const latestLog = res.data.data[0];

      // Try to fetch the full event details if available
      if (latestLog.event_id) {
        console.log(`\nFetching full event details for event ID: ${latestLog.event_id}`);

        const eventOptions = {
          method: 'GET',
          url: `${BRIDGE_API_URL}/webhook_events/${latestLog.event_id}`,
          headers: {
            accept: 'application/json',
            'Api-Key': BRIDGE_API_KEY,
          },
        };

        return axios.request(eventOptions);
      }
    } else {
      console.log('\nNo logs found for this webhook.');
      return Promise.resolve(null);
    }
  })
  .then((eventRes) => {
    if (eventRes && eventRes.data) {
      console.log('\nFull event payload:');
      console.log(JSON.stringify(eventRes.data, null, 2));
    }
  })
  .catch((err) => {
    console.error('Error fetching webhook logs:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
