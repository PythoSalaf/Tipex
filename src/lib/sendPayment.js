import { USDT_SEPOLIA, USDT_DECIMALS } from "./constants";

// Sends USDT on Sepolia using account.transfer() from wdk-wallet-evm
// amount: human-readable number (e.g. 50 for 50 USDT)
// recipient: EVM address string
export async function sendUSDT({ account, recipient, amount }) {
  // Convert human amount to 6-decimal bigint (e.g. 50 → 50000000n)
  const rawAmount = BigInt(Math.round(amount * Number(10n ** USDT_DECIMALS)));

  const result = await account.transfer({
    token: USDT_SEPOLIA,
    recipient,
    amount: rawAmount,
  });

  return { txHash: result.hash, fee: result.fee };
}
