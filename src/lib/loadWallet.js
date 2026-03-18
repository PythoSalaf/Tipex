import { initEvmWallet } from "./wdkWallet";

export async function loadWallet() {
  const seed = localStorage.getItem("seed");

  if (!seed) return null;

  const { wdk } = initEvmWallet(seed);

  const account = await wdk.getAccount("ethereum", 0);

  const address = await account.getAddress();

  return { wdk, account, address };
}
