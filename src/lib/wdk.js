import WDK from "@tetherto/wdk";

export function initWDK(seed) {
  const phrase = seed || WDK.getRandomSeedPhrase(24);

  const wdk = new WDK(phrase);

  return {
    wdk,
    phrase,
  };
}
