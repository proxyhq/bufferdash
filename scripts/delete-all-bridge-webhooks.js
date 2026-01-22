const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get API key from environment variables
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

// First, get all webhooks
const getWebhooks = async () => {
  try {
    const response = await axios.request({
      method: 'GET',
      url: 'https://api.bridge.xyz/v0/webhooks',
      headers: {
        accept: 'application/json',
        'Api-Key': BRIDGE_API_KEY
      }
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    } else {
      console.error('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching webhooks:', error.message);
    return [];
  }
};

// Delete a webhook by ID
const deleteWebhook = async (webhookId) => {
  try {
    const response = await axios.request({
      method: 'DELETE',
      url: `https://api.bridge.xyz/v0/webhooks/${webhookId}`,
      headers: {
        accept: 'application/json',
        'Api-Key': BRIDGE_API_KEY
      }
    });
    
    console.log(`Successfully deleted webhook ${webhookId}. Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`Error deleting webhook ${webhookId}:`, error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
};

// Main function to delete all webhooks
const deleteAllWebhooks = async () => {
  console.log('Fetching all webhooks...');
  const webhooks = await getWebhooks();
  
  if (webhooks.length === 0) {
    console.log('No webhooks found to delete.');
    return;
  }
  
  console.log(`Found ${webhooks.length} webhooks. Proceeding to delete...`);
  
  // Ask for confirmation
  console.log('Webhook IDs to be deleted:');
  webhooks.forEach(webhook => {
    console.log(`- ${webhook.id} (URL: ${webhook.url})`);
  });
  
  console.log('\nDeleting all webhooks...');
  
  // Delete each webhook
  let successCount = 0;
  for (const webhook of webhooks) {
    const success = await deleteWebhook(webhook.id);
    if (success) successCount++;
  }
  
  console.log(`\nDeletion complete. Successfully deleted ${successCount}/${webhooks.length} webhooks.`);
};

// Run the main function
deleteAllWebhooks().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
