import QRCode from 'qrcode';
import { buildCardUrl, type CardUrlOptions } from './url';

/**
 * ISO/IEC 18004 Production Printing Defaults
 * Configured specifically for physical review cards (CR-80 format).
 */
export const MASTER_QR_OPTIONS = {
  type: 'svg' as const,
  errorCorrectionLevel: 'H' as const, // Survives ~30% physical occlusion/scratches
  margin: 4, // Strict 4-module quiet zone per ISO/IEC 18004
  color: {
    dark: '#000000', // 100% Black (K:100)
    light: '#ffffff', // 100% White (Substrate background)
  },
} as const;

export interface QrGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Validates that an SVG string contains well-formed QR vector markup and zero hostile elements.
 */
export function validateQrSvg(svg: string): { isValid: boolean; error?: string } {
  if (typeof svg !== 'string' || !svg.trim()) {
    return { isValid: false, error: 'SVG output must be a non-empty string' };
  }

  const trimmed = svg.trim();

  // Root SVG element check
  if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
    return { isValid: false, error: 'SVG markup must begin with <svg and end with </svg>' };
  }

  // Security checks: ban script tags and inline event handlers
  if (/<script/i.test(trimmed)) {
    return { isValid: false, error: 'Hostile element detected: <script> tags are strictly banned' };
  }

  if (/on[a-z]+\s*=/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Hostile attribute detected: inline event handlers are strictly banned',
    };
  }

  if (/<iframe|<object|<embed/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Hostile element detected: embedded frames/objects are banned',
    };
  }

  // Ensure path or rect elements exist (the QR matrix modules)
  if (!/<path|<rect/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid QR SVG: missing module path or rect elements' };
  }

  // Ensure viewBox is present
  if (!/viewBox=/i.test(trimmed)) {
    return { isValid: false, error: 'Invalid QR SVG: missing viewBox attribute' };
  }

  return { isValid: true };
}

/**
 * Generates production-ready, deterministic vector SVG artwork for a card's physical QR code.
 *
 * Sacred Physical Invariant:
 * The physical QR code encodes ONLY the permanent routing URL:
 * https://<HOST>/c/<publicId>
 * It NEVER encodes target Google review URLs.
 */
export async function generateCardQrSvg(
  publicId: string,
  urlOptions?: CardUrlOptions,
  qrOptions?: Partial<QrGenerationOptions>
): Promise<string> {
  const canonicalUrl = buildCardUrl(publicId, urlOptions);

  const rawSvg = await QRCode.toString(canonicalUrl, {
    type: 'svg',
    errorCorrectionLevel: qrOptions?.errorCorrectionLevel ?? MASTER_QR_OPTIONS.errorCorrectionLevel,
    margin: qrOptions?.margin ?? MASTER_QR_OPTIONS.margin,
    color: {
      dark: qrOptions?.color?.dark ?? MASTER_QR_OPTIONS.color.dark,
      light: qrOptions?.color?.light ?? MASTER_QR_OPTIONS.color.light,
    },
  });

  // Inject accessibility and SVG presentation attributes if not present
  let svg = rawSvg.trim();

  // Add role and aria-label for accessibility
  if (!svg.includes('role=')) {
    svg = svg.replace('<svg ', `<svg role="img" aria-label="QR Code for card ${publicId}" `);
  }

  // Validate output before returning
  const validation = validateQrSvg(svg);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Failed to generate valid QR SVG');
  }

  return svg;
}

// ============================================================================
// Universal Zero-Dependency PNG Encoder for QR Matrices
// Compatible across Browser, Node.js, and Cloudflare Workers (workerd)
// ============================================================================

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function calculateCrc32(buf: Uint8Array, offset = 0, len = buf.length): number {
  let crc = 0xffffffff;
  for (let i = offset; i < offset + len; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function calculateAdler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]!) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(len + 12);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, len);
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  const crc = calculateCrc32(chunk, 4, len + 4);
  dv.setUint32(len + 8, crc);
  return chunk;
}

/**
 * Encodes a QR matrix into valid PNG byte stream without requiring DOM Canvas or native binaries.
 */
export function encodeQrBitmapToPng(
  canonicalUrl: string,
  options?: { scale?: number; margin?: number }
): Uint8Array {
  const scale = Math.max(1, Math.min(32, options?.scale ?? 8));
  const margin = options?.margin ?? MASTER_QR_OPTIONS.margin;

  const qr = QRCode.create(canonicalUrl, {
    errorCorrectionLevel: MASTER_QR_OPTIONS.errorCorrectionLevel,
  });
  const modCount = qr.modules.size;
  const fullSize = (modCount + margin * 2) * scale;

  // Grayscale scanline buffer: 1 filter byte (0) + fullSize bytes per row
  const rowBytes = 1 + fullSize;
  const rawData = new Uint8Array(fullSize * rowBytes);

  for (let y = 0; y < fullSize; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    const modY = Math.floor(y / scale) - margin;

    for (let x = 0; x < fullSize; x++) {
      const modX = Math.floor(x / scale) - margin;
      let isDark = false;
      if (modX >= 0 && modX < modCount && modY >= 0 && modY < modCount) {
        isDark = qr.modules.get(modX, modY) === 1;
      }
      rawData[rowOffset + 1 + x] = isDark ? 0 : 255;
    }
  }

  // Wrap rawData in standard zlib stream with RFC 1951 uncompressed blocks
  const maxBlock = 65535;
  const numBlocks = Math.ceil(rawData.length / maxBlock);
  let zlibLen = 2 + 4; // 2 byte zlib header + 4 byte Adler-32
  for (let b = 0; b < numBlocks; b++) {
    const blockLen = Math.min(maxBlock, rawData.length - b * maxBlock);
    zlibLen += 5 + blockLen; // 1 byte flags + 2 byte len + 2 byte nlen + data
  }

  const zlibBuf = new Uint8Array(zlibLen);
  zlibBuf[0] = 0x78; // zlib CMF (deflate, 32k window)
  zlibBuf[1] = 0x01; // zlib FLG
  let zPos = 2;

  for (let b = 0; b < numBlocks; b++) {
    const isLast = b === numBlocks - 1;
    const blockLen = Math.min(maxBlock, rawData.length - b * maxBlock);
    zlibBuf[zPos++] = isLast ? 0x01 : 0x00; // BFINAL + BTYPE (00)
    zlibBuf[zPos++] = blockLen & 0xff;
    zlibBuf[zPos++] = (blockLen >>> 8) & 0xff;
    const nlen = ~blockLen & 0xffff;
    zlibBuf[zPos++] = nlen & 0xff;
    zlibBuf[zPos++] = (nlen >>> 8) & 0xff;

    zlibBuf.set(rawData.subarray(b * maxBlock, b * maxBlock + blockLen), zPos);
    zPos += blockLen;
  }

  const adler = calculateAdler32(rawData);
  const dvZlib = new DataView(zlibBuf.buffer);
  dvZlib.setUint32(zPos, adler);

  // PNG File Signature: \x89PNG\r\n\x1a\n
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk: width, height, bitDepth(8), colorType(0: grayscale), comp(0), filter(0), interlace(0)
  const ihdrData = new Uint8Array(13);
  const dvIhdr = new DataView(ihdrData.buffer);
  dvIhdr.setUint32(0, fullSize);
  dvIhdr.setUint32(4, fullSize);
  ihdrData[8] = 8;
  ihdrData[9] = 0;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makePngChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makePngChunk('IDAT', zlibBuf);

  // IEND Chunk
  const iendChunk = makePngChunk('IEND', new Uint8Array(0));

  const pngLen = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const pngBytes = new Uint8Array(pngLen);
  let p = 0;
  pngBytes.set(sig, p);
  p += sig.length;
  pngBytes.set(ihdrChunk, p);
  p += ihdrChunk.length;
  pngBytes.set(idatChunk, p);
  p += idatChunk.length;
  pngBytes.set(iendChunk, p);

  return pngBytes;
}

/**
 * Converts a Uint8Array byte buffer to a base64 string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer) {
    return globalBuffer.from(bytes).toString('base64');
  }

  let binary = '';
  const len = bytes.length;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 Data URI into a Uint8Array byte buffer.
 */
export function dataUriToUint8Array(dataUri: string): Uint8Array {
  const base64Index = dataUri.indexOf(';base64,');
  if (base64Index === -1) {
    throw new Error('Invalid data URI format: missing ;base64,');
  }
  const base64Data = dataUri.slice(base64Index + 8);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer) {
    return new Uint8Array(globalBuffer.from(base64Data, 'base64'));
  }

  if (typeof atob === 'function') {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error('No base64 decoder available in current environment');
}

/**
 * Generates PNG byte buffer for in-memory archive packaging.
 */
export async function generateCardQrPngBuffer(
  publicId: string,
  urlOptions?: CardUrlOptions,
  options?: { width?: number; margin?: number }
): Promise<Uint8Array> {
  const canonicalUrl = buildCardUrl(publicId, urlOptions);
  // Default scale 8 produces a crisp ~300-500px image
  const scale = options?.width ? Math.max(1, Math.round(options.width / 45)) : 8;
  return encodeQrBitmapToPng(canonicalUrl, {
    scale,
    margin: options?.margin ?? MASTER_QR_OPTIONS.margin,
  });
}

/**
 * Generates high-resolution raster PNG preview (as data URI) for on-screen inspection.
 */
export async function generateCardQrPng(
  publicId: string,
  urlOptions?: CardUrlOptions,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const pngBytes = await generateCardQrPngBuffer(publicId, urlOptions, options);
  const base64 = uint8ArrayToBase64(pngBytes);
  return `data:image/png;base64,${base64}`;
}
