import { USDC_SEPOLIA, USDC_DECIMALS } from "./constants";

// Sends USDC on Base Sepolia using account.transfer() from wdk-wallet-evm
// amount: human-readable number (e.g. 50 for 50 USDC)
// recipient: EVM address string
export async function sendUSDC({ account, recipient, amount }) {
  // Convert human amount to 6-decimal bigint (e.g. 50 → 50000000n)
  const rawAmount = BigInt(Math.round(amount * Number(10n ** USDC_DECIMALS)));

  const result = await account.transfer({
    token: USDC_SEPOLIA,
    recipient,
    amount: rawAmount,
  });

  return { txHash: result.hash, fee: result.fee };
}

// Sends native ETH on Base Sepolia
// amountEth: human-readable ETH (e.g. 0.003 for 0.003 ETH)
export async function sendETH({ account, recipient, amountEth }) {
  const valueWei = BigInt(Math.round(amountEth * 1e18));
  const result = await account.sendTransaction({
    to: recipient,
    value: valueWei,
  });
  return { txHash: result.hash };
}
