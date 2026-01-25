// Script to sync lyzbeth's resources to Convex
// Run after provision-lyzbeth.js

const CUSTOMER_ID = "67050ef2-f4ea-4069-90d8-86885f7e6580";
const USER_ID = "j57c9cytasbcgxwfa0x0zzyxbn7zvj25"; // Lyzbeth's Convex user ID

async function main() {
  console.log("=== Syncing Lyzbeth's resources to Convex ===\n");

  // We'll use npx convex run to call the sync functions
  const { execSync } = require('child_process');

  // 1. Sync customer
  console.log("1. Syncing customer...");
  try {
    execSync(`npx convex run bridgeCustomers:syncFromBridge '{"bridgeCustomerId": "${CUSTOMER_ID}"}'`, { stdio: 'inherit' });
  } catch (e) {
    console.log("Customer sync error (may already exist)");
  }

  // 2. Sync wallets
  console.log("\n2. Syncing wallets...");
  try {
    execSync(`npx convex run bridgeWallets:syncCustomerWallets '{"bridgeCustomerId": "${CUSTOMER_ID}"}'`, { stdio: 'inherit' });
  } catch (e) {
    console.log("Wallet sync error:", e.message);
  }

  // 3. Sync liquidation addresses
  console.log("\n3. Syncing liquidation addresses...");
  try {
    execSync(`npx convex run liquidationAddresses:syncCustomerAddresses '{"bridgeCustomerId": "${CUSTOMER_ID}"}'`, { stdio: 'inherit' });
  } catch (e) {
    console.log("Liquidation address sync error:", e.message);
  }

  // 4. Sync virtual accounts
  console.log("\n4. Syncing virtual accounts...");
  try {
    execSync(`npx convex run bridgeVirtualAccounts:syncFromBridge '{"customerId": "${CUSTOMER_ID}"}'`, { stdio: 'inherit' });
  } catch (e) {
    console.log("Virtual accounts sync error:", e.message);
  }

  console.log("\n=== Done ===");
  console.log("\nNow manually link the wallets and customer to user in Convex dashboard:");
  console.log(`  - Set bridgeCustomerId on user ${USER_ID} to ${CUSTOMER_ID}`);
  console.log(`  - Set userId on wallets to ${USER_ID}`);
}

main().catch(console.error);
