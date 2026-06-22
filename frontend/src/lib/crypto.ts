/**
 * Isomorphic AES-256-CBC Payload Encryption using Native Web Crypto API.
 * Uses SHA-256 to derive a 256-bit key from the shared secret.
 */

const SECRET_KEY = process.env.NEXT_PUBLIC_COMMUNICATION_SECRET || 'super_secret_comm_key_123!';

// Helper to convert string to ArrayBuffer
function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper to convert ArrayBuffer or Uint8Array to base64
function ab2base64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert base64 to ArrayBuffer
function base642ab(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Get the native crypto subtle API, supporting both browser and build time environments safely
function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  const globalCrypto = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (globalCrypto && globalCrypto.subtle) {
    return globalCrypto.subtle;
  }
  return null;
}

// Derive a CryptoKey asynchronously from the shared secret string using SHA-256
async function getCryptoKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    throw new Error('Web Crypto API is not supported in this environment.');
  }

  const keyData = str2ab(SECRET_KEY);
  // Hash the secret key using SHA-256 to get 32 bytes (256 bits)
  const hash = await subtle.digest('SHA-256', keyData as unknown as BufferSource);
  // Import the hash as a raw key for AES-CBC
  return subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts clear text payload using AES-256-CBC.
 * Returns an object containing the base64-encoded IV and encrypted data.
 */
export async function encryptPayload(text: string): Promise<{ iv: string; data: string }> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    // Fallback if Web Crypto is not ready (e.g. during server-side build phase)
    return { iv: '', data: text };
  }

  const cryptoKey = await getCryptoKey();
  
  // Generate random 16-byte IV
  const globalCrypto = (globalThis as unknown as { crypto?: Crypto }).crypto;
  const iv = typeof window !== 'undefined' 
    ? window.crypto.getRandomValues(new Uint8Array(16))
    : globalCrypto!.getRandomValues(new Uint8Array(16));

  const encryptedBuf = await subtle.encrypt(
    { name: 'AES-CBC', iv: iv as unknown as BufferSource },
    cryptoKey,
    str2ab(text) as unknown as BufferSource
  );

  return {
    iv: ab2base64(iv),
    data: ab2base64(encryptedBuf),
  };
}

/**
 * Decrypts AES-256-CBC encrypted payload object.
 * Returns the decrypted plain text string.
 */
export async function decryptPayload(encrypted: { iv: string; data: string }): Promise<string> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    return encrypted.data;
  }

  if (!encrypted.iv || !encrypted.data) {
    throw new Error('Invalid encrypted payload structure.');
  }

  const cryptoKey = await getCryptoKey();
  const ivBytes = base642ab(encrypted.iv);
  const dataBytes = base642ab(encrypted.data);

  const decryptedBuf = await subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes as unknown as BufferSource },
    cryptoKey,
    dataBytes as unknown as BufferSource
  );

  return new TextDecoder().decode(decryptedBuf);
}
