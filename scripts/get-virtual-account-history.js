const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// Get customer ID and virtual account ID from command line arguments
const customerId = process.argv[2];
const virtualAccountId = process.argv[3];

if (!customerId || !virtualAccountId) {
  console.error('Error: Please provide both customer ID and virtual account ID as arguments');
  console.error('Usage: node get-virtual-account-history.js <customerID> <virtualAccountID> [options]');
  console.error('');
  console.error('Optional query parameters:');
  console.error('  --limit <number>           Number of items to return (default 10, max 100)');
  console.error('  --event-type <type>       Filter by event type');
  console.error('  --starting-after <id>     Get events after this event ID');
  console.error('  --ending-before <id>      Get events before this event ID');
  console.error('  --tx-hash <hash>          Filter by transaction hash');
  console.error('');
  console.error('Event types: funds_received, payment_submitted, payment_processed, in_review, refund, microdeposit, account_update, deactivation, activation');
  process.exit(1);
}

// Parse optional query parameters
const queryParams = {};
const args = process.argv.slice(4);

for (let i = 0; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  
  switch (flag) {
    case '--limit':
      queryParams.limit = parseInt(value);
      break;
    case '--event-type':
      queryParams.event_type = value;
      break;
    case '--starting-after':
      queryParams.starting_after = value;
      break;
    case '--ending-before':
      queryParams.ending_before = value;
      break;
    case '--tx-hash':
      queryParams.tx_hash = value;
      break;
    default:
      console.error(`Unknown parameter: ${flag}`);
      process.exit(1);
  }
}

// Build URL with query parameters
let url = `https://api.bridge.xyz/v0/customers/${customerId}/virtual_accounts/${virtualAccountId}/history`;
const queryString = new URLSearchParams(queryParams).toString();
if (queryString) {
  url += `?${queryString}`;
}

const options = {
  method: 'GET',
  url: url,
  headers: {
    accept: 'application/json',
    'Api-Key': BRIDGE_API_KEY
  }
};

console.log(`Fetching virtual account history for:`);
console.log(`  Customer ID: ${customerId}`);
console.log(`  Virtual Account ID: ${virtualAccountId}`);
if (Object.keys(queryParams).length > 0) {
  console.log(`  Query parameters:`, queryParams);
}
console.log('');

axios
  .request(options)
  .then(res => {
    console.log('Response status:', res.status);
    console.log('Total events:', res.data.count);
    console.log('');
    
    if (res.data.data && res.data.data.length > 0) {
      console.log('Virtual Account Events:');
      console.log('======================');
      
      res.data.data.forEach((event, index) => {
        console.log(`\n${index + 1}. Event ID: ${event.id}`);
        console.log(`   Type: ${event.type}`);
        console.log(`   Amount: ${event.amount} ${event.currency}`);
        console.log(`   Created: ${event.created_at}`);
        
        if (event.deposit_id) {
          console.log(`   Deposit ID: ${event.deposit_id}`);
        }
        
        if (event.destination_tx_hash) {
          console.log(`   Destination TX Hash: ${event.destination_tx_hash}`);
        }
        
        if (event.source) {
          console.log(`   Payment Rail: ${event.source.payment_rail}`);
          if (event.source.description) {
            console.log(`   Description: ${event.source.description}`);
          }
          if (event.source.sender_name) {
            console.log(`   Sender: ${event.source.sender_name}`);
          }
        }
        
        if (event.developer_fee_amount && parseFloat(event.developer_fee_amount) > 0) {
          console.log(`   Developer Fee: ${event.developer_fee_amount}`);
        }
        
        if (event.exchange_fee_amount && parseFloat(event.exchange_fee_amount) > 0) {
          console.log(`   Exchange Fee: ${event.exchange_fee_amount}`);
        }
        
        if (event.gas_fee && parseFloat(event.gas_fee) > 0) {
          console.log(`   Gas Fee: ${event.gas_fee}`);
        }
      });
    } else {
      console.log('No events found for this virtual account.');
    }
    
    console.log('\nRaw response data:');
    console.log(JSON.stringify(res.data, null, 2));
  })
  .catch(err => {
    console.error('Error fetching virtual account history:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  });
