import { initEvmWallet } from "./wdkWallet";

export async function createWallet() {
  const { wdk, phrase } = initEvmWallet();

  const account = await wdk.getAccount("ethereum", 0);

  const address = await account.getAddress();

  localStorage.setItem("seed", phrase);
  localStorage.setItem("address", address);

  return {
    address,
    seed: phrase,
  };
}
