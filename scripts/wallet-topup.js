#!/usr/bin/env node
"use strict";

const addresses = (process.env.TEMPO_NODE_WALLETS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const amount = Number(process.argv[2] || process.env.NODE_WALLET_TOPUP_AMOUNT || "150");
const formatted = Number.isFinite(amount) ? amount.toFixed(2) : "150.00";

if (!addresses.length) {
  console.error("No tempo node wallets configured in TEMPO_NODE_WALLETS.");
  process.exit(1);
}

console.log("Top-up helper — send pathUSD to the following node wallets:");
console.log();
addresses.forEach((address) => {
  console.log(`- Address: ${address}`);
  console.log(`  Suggested amount: ${formatted} pathUSD`);
  console.log(`  Explorer: https://explore.moderato.tempo.xyz/address/${address}`);
  console.log(`  Instruction: Transfer ${formatted} pathUSD from your treasury wallet on Tempo (e.g. via Base or viem).`);
  console.log();
});

console.log("After transferring, rerun the wallet monitor via /dashboard/support to confirm balances.");
