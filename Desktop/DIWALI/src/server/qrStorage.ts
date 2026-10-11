/**
 * NAGARJUNA TRADERS: PERSISTENT R2 STORAGE & VALIDATION SERVICE
 *
 * Implements:
 * - Raster image magic bytes / file signature validation (PNG, JPEG, WebP)
 * - Strict active content rejection (SVG, HTML, XML, scripts)
 * - Cryptographic SHA-256 checksum computation
 * - Server-controlled R2 object key generation
 * - Cloudflare Workers R2Bucket binding integration with simulated fallback
 * - Safe response header generation for image serving
 */

export interface ValidatedRasterImage {
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  extension: 'png' | 'jpg' | 'webp';
  bytes: Uint8Array;
  sizeBytes: number;
  sha256Checksum: string;
}

export interface StoredQrAsset {
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  sha256Checksum: string;
  url: string;
}

export interface CloudflareR2Object {
  key: string;
  size: number;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface CloudflareR2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    }
  ): Promise<{ key: string; size: number } | null>;
  get(key: string): Promise<CloudflareR2Object | null>;
  delete(key: string | string[]): Promise<void>;
  head(key: string): Promise<{ key: string; size: number } | null>;
}

// In-memory simulated R2 bucket for deterministic local test runners & environments before R2 dashboard activation
class InMemoryR2Bucket implements CloudflareR2Bucket {
  private objects = new Map<
    string,
    {
      bytes: Uint8Array;
      contentType: string;
      customMetadata?: Record<string, string>;
    }
  >();

  constructor() {
    // Seed initial test fixture asset for qr_v1_seed
    const transparent1pxPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    this.objects.set('qr-assets/qr_v1_seed.png', {
      bytes: transparent1pxPng,
      contentType: 'image/png',
      customMetadata: {
        versionId: 'qr_v1_seed',
        sha256:
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    });
  }

  public async put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ) {
    let bytes: Uint8Array;
    if (value instanceof Uint8Array) {
      bytes = value;
    } else if (value instanceof ArrayBuffer) {
      bytes = new Uint8Array(value);
    } else if (ArrayBuffer.isView(value)) {
      bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    } else if (typeof value === 'string') {
      bytes = new TextEncoder().encode(value);
    } else {
      throw new Error('Unsupported value type for in-memory R2 bucket');
    }

    this.objects.set(key, {
      bytes,
      contentType: options?.httpMetadata?.contentType || 'application/octet-stream',
      customMetadata: options?.customMetadata,
    });
    return { key, size: bytes.length };
  }

  public async get(key: string): Promise<CloudflareR2Object | null> {
    const item = this.objects.get(key);
    if (!item) return null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(item.bytes);
        controller.close();
      },
    });

    return {
      key,
      size: item.bytes.length,
      httpMetadata: {
        contentType: item.contentType,
        cacheControl: 'private, no-transform, max-age=86400',
      },
      customMetadata: item.customMetadata,
      body: stream,
      arrayBuffer: async () => {
        const buf = new ArrayBuffer(item.bytes.byteLength);
        new Uint8Array(buf).set(item.bytes);
        return buf;
      },
    };
  }

  public async delete(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      for (const k of key) this.objects.delete(k);
    } else {
      this.objects.delete(key);
    }
  }

  public async head(key: string) {
    const item = this.objects.get(key);
    if (!item) return null;
    return { key, size: item.bytes.length };
  }

  public clear() {
    this.objects.clear();
  }
}

export const fallbackR2Bucket = new InMemoryR2Bucket();

/**
 * Parses and decodes raw binary bytes from a base64 Data URI or base64 string.
 */
export function decodeImageData(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;

  let base64 = input.trim();
  if (base64.startsWith('data:')) {
    const commaIdx = base64.indexOf(',');
    if (commaIdx !== -1) {
      base64 = base64.slice(commaIdx + 1);
    }
  }

  // Remove whitespace
  base64 = base64.replace(/\s/g, '');

  if (typeof atob !== 'undefined') {
    const binStr = atob(base64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Calculates SHA-256 hexadecimal checksum.
 */
export async function computeSha256Checksum(bytes: Uint8Array): Promise<string> {
  const cleanBuf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(cleanBuf).set(bytes);
  const hashBuffer = await crypto.subtle.digest('SHA-256', cleanBuf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates image signatures (magic bytes), payload size (max 2MB), and rejects SVG/HTML/XML scripts.
 */
export async function validateRasterImagePayload(
  rawInput: string | Uint8Array
): Promise<ValidatedRasterImage> {
  // Check string representation for active content before decode
  if (typeof rawInput === 'string') {
    const lower = rawInput.toLowerCase();
    if (
      lower.includes('<svg') ||
      lower.includes('<script') ||
      lower.includes('<html') ||
      lower.includes('<?xml') ||
      lower.includes('javascript:') ||
      lower.includes('data:image/svg+xml')
    ) {
      throw new Error('SVG, XML, HTML, and script payloads are strictly rejected.');
    }
  }

  const bytes = decodeImageData(rawInput);

  // Maximum 2MB payload cap
  const MAX_BYTES = 2 * 1024 * 1024;
  if (bytes.length === 0) {
    throw new Error('Empty image payload.');
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error(`Image size (${bytes.length} bytes) exceeds maximum 2MB limit.`);
  }

  // Text inspection on binary head to catch embedded XML/SVG markers
  const headText = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, Math.min(bytes.length, 512)))
    .toLowerCase();
  if (
    headText.includes('<svg') ||
    headText.includes('<script') ||
    headText.includes('<?xml') ||
    headText.includes('<!doctype')
  ) {
    throw new Error('Active XML or script contents detected in image header.');
  }

  // Magic bytes verification
  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  // 2. JPEG: FF D8 FF
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  // 3. WebP: RIFF (bytes 0..3) and WEBP (bytes 8..11)
  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50; // P

  if (!isPng && !isJpeg && !isWebp) {
    throw new Error(
      'Invalid file signature. Only authentic raster PNG, JPEG, and WebP formats are accepted.'
    );
  }

  const contentType = isPng
    ? 'image/png'
    : isJpeg
    ? 'image/jpeg'
    : 'image/webp';
  const extension = isPng ? 'png' : isJpeg ? 'jpg' : 'webp';
  const sha256Checksum = await computeSha256Checksum(bytes);

  return {
    contentType,
    extension,
    bytes,
    sizeBytes: bytes.length,
    sha256Checksum,
  };
}

/**
 * Generates an unpredictable server-controlled R2 object key.
 * Format: qr-assets/qr_{versionId}_{timestamp}.{ext}
 */
export function generateR2ObjectKey(versionId: string, ext: string): string {
  const safeId = versionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const rand = Math.random().toString(36).substring(2, 8);
  return `qr-assets/${safeId}_${Date.now()}_${rand}.${ext}`;
}

export function getR2Bucket(env?: any): CloudflareR2Bucket {
  if (env?.QR_BUCKET && typeof env.QR_BUCKET.put === 'function') {
    return env.QR_BUCKET as CloudflareR2Bucket;
  }
  if (env?.CF_PAGES === '1' || env?.REQUIRE_R2 === 'true') {
    throw new Error(
      'Cloudflare R2 QR_BUCKET binding is unavailable at runtime. Persistent storage required.'
    );
  }
  return fallbackR2Bucket;
}

/**
 * Stores validated image bytes in R2 and returns asset metadata.
 */
export async function storeQrImageInR2(
  versionId: string,
  rawInput: string | Uint8Array,
  env?: any,
  operatorId: string = 'OP-ADMIN'
): Promise<StoredQrAsset> {
  const validated = await validateRasterImagePayload(rawInput);
  const objectKey = generateR2ObjectKey(versionId, validated.extension);
  const bucket = getR2Bucket(env);

  await bucket.put(objectKey, validated.bytes, {
    httpMetadata: {
      contentType: validated.contentType,
      cacheControl: 'private, no-transform, max-age=86400',
    },
    customMetadata: {
      sha256: validated.sha256Checksum,
      versionId,
      uploadOperatorId: operatorId,
    },
  });

  return {
    objectKey,
    contentType: validated.contentType,
    sizeBytes: validated.sizeBytes,
    sha256Checksum: validated.sha256Checksum,
    url: `/api/v1/qr-images/${versionId}`,
  };
}

/**
 * Retrieves QR image from R2 by object key.
 */
export async function getQrImageFromR2(
  objectKey: string,
  env?: any
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const bucket = getR2Bucket(env);
  const obj = await bucket.get(objectKey);
  if (!obj) return null;

  const bytes = await obj.arrayBuffer();
  const contentType = obj.httpMetadata?.contentType || 'image/png';
  return { bytes, contentType };
}
