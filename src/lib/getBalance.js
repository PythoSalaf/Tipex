import { USDT_SEPOLIA, USDT_DECIMALS } from "./constants";

// Returns USDT balance as a human-readable number (e.g. 50.5)
export async function getUSDTBalance(account) {
  const raw = await account.getTokenBalance(USDT_SEPOLIA);
  return Number(raw) / Number(10n ** USDT_DECIMALS);
}

// Returns native ETH balance in ETH (not wei)
export async function getETHBalance(account) {
  const raw = await account.getBalance();
  return Number(raw) / 1e18;
}
