#!/usr/bin/env node

/**
 * Script to send an event to a Bridge webhook
 * 
 * Usage:
 * node send-bridge-webhook-event.js [event_id]
 * or
 * node send-bridge-webhook-event.js [webhook_id] [event_id]
 * 
 * If webhook_id is not provided, it will use the hardcoded default
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

// Parse arguments - can be either [event_id] or [webhook_id] [event_id]
const arg1 = process.argv[2];
const arg2 = process.argv[3];

let webhookId;
let eventId;

if (arg2) {
  // Two arguments: [webhook_id] [event_id]
  webhookId = arg1;
  eventId = arg2;
} else if (arg1) {
  // One argument: [event_id], use default webhook ID
  webhookId = 'wep_t2xjBHHRNUGAdDrb5q5aZ5z';
  eventId = arg1;
} else {
  // No arguments
  webhookId = null;
  eventId = null;
}

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// This should not happen since we have a hardcoded default, but keeping as safeguard
if (!webhookId) {
  console.error('Error: No webhook ID available');
  console.error('Usage: node send-bridge-webhook-event.js [event_id] or [webhook_id] [event_id]');
  process.exit(1);
}

if (!eventId) {
  console.error('Error: No event ID provided');
  console.error('Usage: node send-bridge-webhook-event.js [event_id] or [webhook_id] [event_id]');
  process.exit(1);
}

// Generate an idempotency key
const idempotencyKey = `webhook-event-${uuidv4()}`;

console.log(`Sending event ${eventId} to webhook ID: ${webhookId}`);
console.log(`Using idempotency key: ${idempotencyKey}`);

const options = {
  method: 'POST',
  url: `${BRIDGE_API_URL}/webhooks/${webhookId}/send`,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'Api-Key': BRIDGE_API_KEY,
    'Idempotency-Key': idempotencyKey
  },
  data: {
    event_id: eventId
  }
};

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Response data:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error sending webhook event:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
