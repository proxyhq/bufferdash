const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get limit from command line argument or default to 15
const limit = parseInt(process.argv[2]) || 15;

// Make API request
async function getLastTransfers() {
  try {
    console.log(`Fetching last ${limit} transfers...`);
    
    // Try with limit parameter first
    let url = `${BRIDGE_API_URL}/transfers?limit=${limit}`;
    
    const response = await axios.get(url, {
      headers: {
        'Api-Key': BRIDGE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    let transfers = response.data;
    
    // Handle different response formats
    if (Array.isArray(transfers)) {
      // If it's an array, take the last N items
      transfers = transfers.slice(-limit);
    } else if (transfers.data && Array.isArray(transfers.data)) {
      // If it's wrapped in a data object
      transfers = transfers.data.slice(-limit);
      transfers = { ...transfers, data: transfers };
    } else if (transfers.results && Array.isArray(transfers.results)) {
      // If it's in a results array
      transfers.results = transfers.results.slice(-limit);
    }

    console.log(`\nFound ${Array.isArray(transfers) ? transfers.length : (transfers.data?.length || transfers.results?.length || 0)} transfers:`);
    console.log(JSON.stringify(transfers, null, 2));
  } catch (error) {
    // If limit parameter doesn't work, try without it and limit manually
    if (error.response?.status === 400 || error.response?.status === 422) {
      console.log('Limit parameter not supported, fetching all and limiting manually...');
      try {
        const response = await axios.get(`${BRIDGE_API_URL}/transfers`, {
          headers: {
            'Api-Key': BRIDGE_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        let transfers = response.data;
        let transferArray = [];
        
        if (Array.isArray(transfers)) {
          transferArray = transfers;
        } else if (transfers.data && Array.isArray(transfers.data)) {
          transferArray = transfers.data;
        } else if (transfers.results && Array.isArray(transfers.results)) {
          transferArray = transfers.results;
        }

        // Sort by created_at descending (most recent first) and take last N
        transferArray.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        const lastTransfers = transferArray.slice(0, limit);
        
        console.log(`\nLast ${lastTransfers.length} transfers (sorted by most recent):`);
        console.log(JSON.stringify(lastTransfers, null, 2));
      } catch (retryError) {
        console.error('Error fetching transfers:');
        if (retryError.response) {
          console.error('Response Status:', retryError.response.status);
          console.error('Response Data:', retryError.response.data);
        } else {
          console.error('Error:', retryError.message);
        }
        process.exit(1);
      }
    } else {
      console.error('Error fetching transfers:');
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      process.exit(1);
    }
  }
}

// Execute the function
getLastTransfers();
