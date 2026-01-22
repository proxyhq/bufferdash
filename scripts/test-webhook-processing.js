#!/usr/bin/env node

/**
 * Script to test webhook processing and replay failed events
 * 
 * Usage:
 * node test-webhook-processing.js [action]
 * 
 * Actions:
 * - status: Show webhook processing status
 * - failed: Show failed webhook events
 * - replay <eventId>: Replay a specific failed event
 * - replay-all-failed: Replay all failed events
 */

require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require('convex/browser');

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.CONVEX_URL);

const action = process.argv[2] || 'status';
const eventId = process.argv[3];

async function showWebhookStatus() {
  console.log('📊 Webhook Processing Status\n');
  
  try {
    // Get recent webhook events
    const recentEvents = await convex.query('webhookEvents:getRecentWebhookEvents', { limit: 20 });
    
    if (!recentEvents || recentEvents.length === 0) {
      console.log('No webhook events found.');
      return;
    }

    // Group by status
    const statusCounts = recentEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status Summary:');
    console.log(`✅ Processed: ${statusCounts.processed || 0}`);
    console.log(`❌ Failed: ${statusCounts.failed || 0}`);
    console.log(`⏳ Received: ${statusCounts.received || 0}`);
    console.log(`📊 Total: ${recentEvents.length}\n`);

    // Show recent events
    console.log('Recent Events:');
    console.log('─'.repeat(80));
    recentEvents.slice(0, 10).forEach(event => {
      const status = event.status === 'processed' ? '✅' : 
                    event.status === 'failed' ? '❌' : '⏳';
      const time = new Date(event.receivedAt).toLocaleString();
      
      console.log(`${status} ${event.eventId} | ${event.eventType} | ${time}`);
      if (event.status === 'failed' && event.errorMessage) {
        console.log(`   Error: ${event.errorMessage.substring(0, 100)}...`);
      }
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
  }
}

async function showFailedEvents() {
  console.log('❌ Failed Webhook Events\n');
  
  try {
    const recentEvents = await convex.query('webhookEvents:getRecentWebhookEvents', { limit: 50 });
    const failedEvents = recentEvents.filter(event => event.status === 'failed');
    
    if (failedEvents.length === 0) {
      console.log('🎉 No failed webhook events found!');
      return;
    }

    console.log(`Found ${failedEvents.length} failed events:\n`);
    
    failedEvents.forEach((event, index) => {
      const time = new Date(event.receivedAt).toLocaleString();
      console.log(`${index + 1}. Event ID: ${event.eventId}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Time: ${time}`);
      console.log(`   Error: ${event.errorMessage}`);
      console.log('');
    });

    console.log(`\nTo replay a specific event: node test-webhook-processing.js replay <eventId>`);
    console.log(`To replay all failed events: node test-webhook-processing.js replay-all-failed`);

  } catch (error) {
    console.error('Error fetching failed events:', error);
  }
}

async function replayEvent(eventId) {
  console.log(`🔄 Replaying webhook event: ${eventId}\n`);
  
  try {
    // Get the event
    const events = await convex.query('webhookEvents:getRecentWebhookEvents', { limit: 100 });
    const event = events.find(e => e.eventId === eventId);
    
    if (!event) {
      console.log(`❌ Event ${eventId} not found`);
      return;
    }

    if (event.status === 'processed') {
      console.log(`⚠️ Event ${eventId} is already processed. Replaying anyway...`);
    }

    console.log(`Event Type: ${event.eventType}`);
    console.log(`Original Status: ${event.status}`);
    
    if (event.errorMessage) {
      console.log(`Previous Error: ${event.errorMessage}`);
    }

    // Parse the payload and replay
    const payload = JSON.parse(event.payload);
    
    // Reset the event status to received
    await convex.mutation('webhookEvents:resetWebhookEventStatus', {
      eventId: eventId,
    });

    // Process the event again
    await convex.action('bridgeWebhooks:processBridgeEvent', {
      event: payload,
    });

    // Mark as processed
    await convex.mutation('webhookEvents:markWebhookEventProcessed', {
      eventId: eventId,
    });

    console.log(`✅ Event ${eventId} replayed successfully!`);

  } catch (error) {
    console.error(`❌ Error replaying event ${eventId}:`, error);
    
    // Mark as failed again
    try {
      await convex.mutation('webhookEvents:markWebhookEventFailed', {
        eventId: eventId,
        errorMessage: error.message,
      });
    } catch (markError) {
      console.error('Error marking event as failed:', markError);
    }
  }
}

async function replayAllFailed() {
  console.log('🔄 Replaying all failed webhook events\n');
  
  try {
    const recentEvents = await convex.query('webhookEvents:getRecentWebhookEvents', { limit: 100 });
    const failedEvents = recentEvents.filter(event => event.status === 'failed');
    
    if (failedEvents.length === 0) {
      console.log('🎉 No failed events to replay!');
      return;
    }

    console.log(`Found ${failedEvents.length} failed events to replay...\n`);
    
    let successCount = 0;
    let failCount = 0;

    for (const event of failedEvents) {
      try {
        console.log(`Replaying: ${event.eventId} (${event.eventType})`);
        await replayEvent(event.eventId);
        successCount++;
      } catch (error) {
        console.error(`Failed to replay ${event.eventId}:`, error.message);
        failCount++;
      }
    }

    console.log(`\n📊 Replay Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${failedEvents.length}`);

  } catch (error) {
    console.error('Error replaying failed events:', error);
  }
}

// Main execution
async function main() {
  switch (action) {
    case 'status':
      await showWebhookStatus();
      break;
    case 'failed':
      await showFailedEvents();
      break;
    case 'replay':
      if (!eventId) {
        console.error('Error: Event ID required for replay');
        console.error('Usage: node test-webhook-processing.js replay <eventId>');
        process.exit(1);
      }
      await replayEvent(eventId);
      break;
    case 'replay-all-failed':
      await replayAllFailed();
      break;
    default:
      console.log('Available actions:');
      console.log('  status - Show webhook processing status');
      console.log('  failed - Show failed webhook events');
      console.log('  replay <eventId> - Replay a specific failed event');
      console.log('  replay-all-failed - Replay all failed events');
  }
}

main().catch(console.error); 