import { initEvmWallet } from "./wdkWallet";

export async function restoreWallet(seed) {
  const { wdk } = initEvmWallet(seed);

  const account = await wdk.getAccount("ethereum", 0);

  const address = await account.getAddress();

  return address;
}
