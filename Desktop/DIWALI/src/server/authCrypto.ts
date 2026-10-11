/**
 * Cryptographic helpers for admin authentication using the native Web Crypto API.
 * Compatible with Cloudflare Workers / Pages Functions, modern browsers, and Node 20+.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time comparison between two hex strings to mitigate timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Generates a cryptographically secure random hexadecimal token.
 */
export function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

/**
 * Hashes a plaintext password using PBKDF2-SHA256 with 100,000 iterations.
 * Returns a serialized string format: pbkdf2:sha256:<iterations>:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_BYTES * 8
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 serialized hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') {
    return false;
  }

  const iterations = parseInt(parts[2], 10);
  if (isNaN(iterations) || iterations < 10000) {
    return false;
  }

  const saltHex = parts[3];
  const expectedHashHex = parts[4];
  const salt = hexToBytes(saltHex);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_BYTES * 8
  );

  const actualHashHex = bufferToHex(derivedBits);
  return timingSafeEqual(actualHashHex, expectedHashHex);
}
