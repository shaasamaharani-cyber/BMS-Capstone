// IDs for local records must also work when the app is served over ordinary HTTP.
export function createClientId(strPrefix = '') {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${strPrefix}${globalThis.crypto.randomUUID()}`;
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arrBytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return `${strPrefix}${Array.from(arrBytes, (intByte) => intByte.toString(16).padStart(2, '0')).join('')}`;
  }
  return `${strPrefix}${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
