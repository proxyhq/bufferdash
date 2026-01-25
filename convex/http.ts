import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Clerk webhook handler
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const eventType = payload.type;
    const userData = payload.data;

    switch (eventType) {
      case "user.created":
        await ctx.runMutation(api.users.createUser, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        });
        break;

      case "user.updated":
        await ctx.runMutation(api.users.updateUser, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        });
        break;

      case "user.deleted":
        await ctx.runMutation(api.users.deleteUser, {
          clerkId: userData.id,
        });
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Bridge webhook handler with signature verification
http.route({
  path: "/bridge-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signatureHeader = request.headers.get("X-Webhook-Signature");
    const bodyText = await request.text();

    // Verify signature if public key is configured
    const publicKeyPem = process.env.BRIDGE_WEBHOOK_PUBLIC_KEY;
    if (publicKeyPem && signatureHeader) {
      const isValid = await verifyBridgeSignature(
        signatureHeader,
        bodyText,
        publicKeyPem
      );

      if (!isValid) {
        console.error("Bridge webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Store the event (idempotent)
    const result = await ctx.runMutation(api.bridgeWebhooks.storeEvent, {
      eventId: payload.event_id,
      eventCategory: payload.event_category,
      eventType: payload.event_type,
      eventObjectId: payload.event_object_id,
      eventObjectStatus: payload.event_object_status,
      eventObject: payload.event_object,
      eventObjectChanges: payload.event_object_changes,
      eventCreatedAt: payload.event_created_at,
    });

    // If not a duplicate, process the event based on category
    if (!result.duplicate) {
      try {
        await processWebhookEvent(ctx, payload);
        await ctx.runMutation(api.bridgeWebhooks.markProcessed, {
          eventId: payload.event_id,
        });
      } catch (error) {
        console.error("Error processing webhook event:", error);
        // Still return 200 to prevent retries, event is stored for manual processing
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Helper to verify Bridge webhook signature
async function verifyBridgeSignature(
  signatureHeader: string,
  body: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    // Parse header: t=<timestamp>,v0=<base64_signature>
    const parts = signatureHeader.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v0="));

    if (!timestampPart || !signaturePart) {
      console.error("Invalid signature header format");
      return false;
    }

    const timestamp = timestampPart.substring(2);
    const signatureBase64 = signaturePart.substring(3);

    // Check timestamp to prevent replay attacks (10 minute window)
    const timestampMs = parseInt(timestamp, 10);
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    if (Math.abs(now - timestampMs) > tenMinutes) {
      console.error("Webhook timestamp too old, possible replay attack");
      return false;
    }

    // Create the message to verify: timestamp.body
    const message = `${timestamp}.${body}`;
    const messageBytes = new TextEncoder().encode(message);

    // Create SHA256 digest
    const digest = await crypto.subtle.digest("SHA-256", messageBytes);

    // Decode the signature
    const signature = Uint8Array.from(atob(signatureBase64), (c) =>
      c.charCodeAt(0)
    );

    // Import the public key
    const publicKey = await importPublicKey(publicKeyPem);

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      publicKey,
      signature,
      digest
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// Helper to import PEM public key
async function importPublicKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and whitespace
  const pemContents = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  // Decode base64 to binary
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );
}

// Process webhook events based on category
async function processWebhookEvent(ctx: any, payload: any) {
  const { event_category, event_type, event_object } = payload;

  switch (event_category) {
    case "customer":
      await ctx.runMutation(internal.bridgeWebhooks.processCustomerEvent, {
        eventType: event_type,
        eventObject: event_object,
      });
      break;

    case "kyc_link":
      await ctx.runMutation(internal.bridgeWebhooks.processKycLinkEvent, {
        eventType: event_type,
        eventObject: event_object,
      });
      break;

    case "liquidation_address.drain":
      await ctx.runMutation(internal.bridgeWebhooks.processDrainEvent, {
        eventType: event_type,
        eventObject: event_object,
      });
      break;

    case "transfer":
      await ctx.runMutation(internal.bridgeWebhooks.processTransferEvent, {
        eventType: event_type,
        eventObject: event_object,
      });
      break;

    case "virtual_account.activity":
      await ctx.runMutation(internal.bridgeWebhooks.processVirtualAccountEvent, {
        eventType: event_type,
        eventObject: event_object,
      });
      break;

    // TODO: Add handlers for other event categories as needed
    case "static_memo.activity":
    case "card_account":
    case "card_transaction":
    case "posted_card_account_transaction":
    case "card_withdrawal":
      // Event is stored, can be processed later
      console.log(`Received ${event_category} event: ${event_type}`);
      break;

    default:
      console.log(`Unknown event category: ${event_category}`);
  }
}

export default http;
