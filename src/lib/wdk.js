import WDK from "@tetherto/wdk";

export function initWDK(seed) {
  const phrase = seed || WDK.getRandomSeedPhrase();

  const wdk = new WDK(phrase);

  return {
    wdk,
    phrase,
  };
}
