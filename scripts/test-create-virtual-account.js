#!/usr/bin/env node

/**
 * Test script to call the create-virtual-account Edge Function directly
 * 
 * Usage:
 *   node test-create-virtual-account.js <user_id>
 * 
 * Example:
 *   node test-create-virtual-account.js 3810b539-ae5c-4482-a08e-d79b6dd07e11
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Get command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Error: User ID is required');
  console.error('Usage: node test-create-virtual-account.js <user_id>');
  process.exit(1);
}

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ypbsyemfcsguafutenbs.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function testCreateVirtualAccount() {
  try {
    console.log(`Testing create-virtual-account function with user ID: ${userId}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-virtual-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ userId })
    });
    
    const responseBody = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(responseBody, null, 2));
    
    if (!response.ok) {
      console.error('Error calling Edge Function');
    } else {
      console.log('Edge Function called successfully');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateVirtualAccount();
