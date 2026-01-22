const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: ".env.local" });

/* --- ENV --- */
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL =
  process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

if (!BRIDGE_API_KEY) {
  console.error("BRIDGE_API_KEY missing in .env.local");
  process.exit(1);
}

/* --- CLI --- */
const customerId = process.argv[2];
const developerFeePercent = process.argv[3] || "2.0";

if (!customerId) {
  console.error(
    "Usage: node scripts/create-bridge-virtual-account.js <customerId> [feePercent]"
  );
  process.exit(1);
}

/* --- Constants --- */
const sourceCurrency = "usd"; // lowercase as per API requirements
const destinationCurrency = "usdc";
const destinationPaymentRail = "solana";

/* --- Main --- */
(async () => {
  try {
    /* 1. Create wallet */
    const walletKey = `wallet-${customerId}-${Date.now()}`;
    const walletRes = await axios.post(
      `${BRIDGE_API_URL}/customers/${customerId}/wallets`,
      { chain: destinationPaymentRail },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": BRIDGE_API_KEY,
          "Idempotency-Key": walletKey,
        },
      }
    );

    const wallet = walletRes.data;
    const walletAddress =
      wallet.address || wallet.public_address || wallet.solana_address;
    if (!walletAddress)
      throw new Error("Wallet address not returned by Bridge");

    console.log("✅ Wallet created:", walletAddress);

    /* 2. Create virtual account */
    const vaKey = `va-${customerId}-${uuidv4()}`;
    const vaBody = {
      developer_fee_percent: developerFeePercent,
      source: { currency: sourceCurrency },
      destination: {
        currency: destinationCurrency,
        payment_rail: destinationPaymentRail,
        address: walletAddress,
      },
    };

    const vaRes = await axios.post(
      `${BRIDGE_API_URL}/customers/${customerId}/virtual_accounts`,
      vaBody,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": BRIDGE_API_KEY,
          "Idempotency-Key": vaKey,
        },
      }
    );

    console.log("✅ Virtual account created:");
    console.log(JSON.stringify(vaRes.data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response && err.response.data) {
      console.error("API Error:", err.response.data);
    }
    process.exit(1);
  }
})();