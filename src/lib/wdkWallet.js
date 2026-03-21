import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import { initWDK } from "./wdk";

export function initEvmWallet(seed) {
  const { wdk, phrase } = initWDK(seed);

  const wdkWithWallet = wdk.registerWallet("ethereum", WalletManagerEvm, {
    provider: "https://sepolia.base.org",
  });

  return {
    wdk: wdkWithWallet,
    phrase,
  };
}
