import { USDC_SEPOLIA, USDC_DECIMALS } from "./constants";

// Returns USDC balance as a human-readable number (e.g. 50.5)
export async function getUSDCBalance(account) {
  const raw = await account.getTokenBalance(USDC_SEPOLIA);
  return Number(raw) / Number(10n ** USDC_DECIMALS);
}

// Returns native ETH balance in ETH (not wei)
export async function getETHBalance(account) {
  const raw = await account.getBalance();
  return Number(raw) / 1e18;
}
