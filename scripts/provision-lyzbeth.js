// Script to provision resources for lyzbeth (customer_id: 67050ef2-f4ea-4069-90d8-86885f7e6580)
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";
const CUSTOMER_ID = "67050ef2-f4ea-4069-90d8-86885f7e6580";

async function main() {
  if (!BRIDGE_API_KEY) {
    console.error("BRIDGE_API_KEY not set");
    process.exit(1);
  }

  console.log("=== Provisioning resources for Lyzbeth ===\n");

  // 1. Get customer info
  console.log("1. Fetching customer info...");
  const customerRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID, {
    headers: { "Api-Key": BRIDGE_API_KEY, "Accept": "application/json" }
  });

  if (!customerRes.ok) {
    console.log("Customer not found or error:", await customerRes.text());
  } else {
    const customer = await customerRes.json();
    console.log("Customer:", JSON.stringify(customer, null, 2));
  }

  // 2. Get existing wallets
  console.log("\n2. Fetching existing wallets...");
  const walletsRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/wallets", {
    headers: { "Api-Key": BRIDGE_API_KEY, "Accept": "application/json" }
  });

  if (walletsRes.ok) {
    const wallets = await walletsRes.json();
    console.log("Existing wallets:", JSON.stringify(wallets, null, 2));
  }

  // 3. Create Solana wallet if not exists
  console.log("\n3. Creating Solana wallet...");
  const solanaWalletRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/wallets", {
    method: "POST",
    headers: {
      "Api-Key": BRIDGE_API_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Idempotency-Key": "wallet-" + CUSTOMER_ID + "-solana-" + Date.now()
    },
    body: JSON.stringify({ chain: "solana" })
  });

  if (solanaWalletRes.ok) {
    const solanaWallet = await solanaWalletRes.json();
    console.log("Solana wallet created:", JSON.stringify(solanaWallet, null, 2));
  } else {
    const err = await solanaWalletRes.text();
    console.log("Solana wallet error:", err);
  }

  // 4. Create Arbitrum wallet
  console.log("\n4. Creating Arbitrum wallet...");
  const arbWalletRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/wallets", {
    method: "POST",
    headers: {
      "Api-Key": BRIDGE_API_KEY,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Idempotency-Key": "wallet-" + CUSTOMER_ID + "-arbitrum-" + Date.now()
    },
    body: JSON.stringify({ chain: "arbitrum" })
  });

  if (arbWalletRes.ok) {
    const arbWallet = await arbWalletRes.json();
    console.log("Arbitrum wallet created:", JSON.stringify(arbWallet, null, 2));
  } else {
    const err = await arbWalletRes.text();
    console.log("Arbitrum wallet error:", err);
  }

  // 5. Get all wallets again
  console.log("\n5. Fetching all wallets after creation...");
  const allWalletsRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/wallets", {
    headers: { "Api-Key": BRIDGE_API_KEY, "Accept": "application/json" }
  });

  let allWallets = { data: [] };
  if (allWalletsRes.ok) {
    allWallets = await allWalletsRes.json();
    console.log("All wallets:", JSON.stringify(allWallets, null, 2));
  }

  // 6. Create liquidation addresses for each wallet
  for (const wallet of (allWallets.data || [])) {
    console.log("\n6. Creating liquidation address for " + wallet.chain + " wallet...");

    const liqRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/liquidation_addresses", {
      method: "POST",
      headers: {
        "Api-Key": BRIDGE_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": "liq-" + CUSTOMER_ID + "-" + wallet.chain + "-usdc-" + Date.now()
      },
      body: JSON.stringify({
        chain: wallet.chain,
        currency: "usdc",
        destination_payment_rail: wallet.chain,
        destination_currency: "usdc",
        bridge_wallet_id: wallet.id
      })
    });

    if (liqRes.ok) {
      const liq = await liqRes.json();
      console.log("Liquidation address for " + wallet.chain + ":", JSON.stringify(liq, null, 2));
    } else {
      const err = await liqRes.text();
      console.log("Liquidation address error for " + wallet.chain + ":", err);
    }
  }

  // 7. Get all liquidation addresses
  console.log("\n7. Fetching all liquidation addresses...");
  const liqAddrsRes = await fetch(BRIDGE_API_URL + "/customers/" + CUSTOMER_ID + "/liquidation_addresses", {
    headers: { "Api-Key": BRIDGE_API_KEY, "Accept": "application/json" }
  });

  if (liqAddrsRes.ok) {
    const liqAddrs = await liqAddrsRes.json();
    console.log("All liquidation addresses:", JSON.stringify(liqAddrs, null, 2));
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
