import { buildCardUrl, type CardUrlOptions } from './url';

/**
 * NFC Hardware and NDEF Record Specifications
 * Grounded in NFC Forum Type 2 Tag Operation Specification and NTAG213/215/216 hardware specs.
 */

export interface NfcPayloadInfo {
  publicId: string;
  canonicalUrl: string;
  ndefRecordType: 'U'; // Well-Known Type 'U' (URI, 0x55)
  ndefTnf: '0x01'; // NFC Forum Well-Known Type
  ndefPrefixCode: '0x04'; // Prefix code 0x04 represents 'https://'
  ndefCompressedPayload: string; // URL without https:// prefix (e.g. go.taprevieww.workers.dev/c/A7K92P4X8Q)
  byteLength: number; // Raw ASCII/UTF-8 byte length of full URL
  compressedByteLength: number; // Payload size when using 0x04 prefix compression (1 byte prefix + domain/path)
  ntag213UserCapacityBytes: 144;
  ntag213BytesUsed: number; // Total NDEF message size including TLV header
  ntag213CapacityPercent: number;
  isNtag213Compatible: boolean;
  factoryLockDirective: 'PERMANENT_READ_ONLY';
}

/**
 * Generates canonical NFC URI payload metadata according to NFC Forum RTD Type U.
 *
 * Encoding Details:
 * - NFC Forum Record Type Definition (RTD) URI: Record Type "U" (0x55).
 * - TNF (Type Name Format): 0x01 (NFC Forum Well-Known).
 * - Identifier Code 0x04: abbreviates "https://".
 * - NXP NTAG213 user memory capacity: 144 bytes (36 pages × 4 bytes).
 * - An NDEF message containing a ~35-char QRoute URL consumes ~45 bytes total (including NDEF TLV wrapper),
 *   occupying roughly ~31% of NTAG213 capacity and leaving ample room for OTP locking.
 */
export function generateNfcPayload(publicId: string, urlOptions?: CardUrlOptions): NfcPayloadInfo {
  const canonicalUrl = buildCardUrl(publicId, urlOptions);

  // Extract payload without https:// for NDEF prefix 0x04
  let compressedPayload = canonicalUrl;
  const prefixCode = '0x04' as const;
  if (canonicalUrl.startsWith('https://')) {
    compressedPayload = canonicalUrl.slice(8);
  } else if (canonicalUrl.startsWith('http://')) {
    compressedPayload = canonicalUrl.slice(7);
  }

  const rawBytes = new TextEncoder().encode(canonicalUrl).length;
  // NDEF Record overhead with prefix compression:
  // - 1 byte NDEF Record Header (MB/ME/CF/1/SR/IL/TNF)
  // - 1 byte Type Length (0x01 for 'U')
  // - 1 byte Payload Length (1 byte prefix code + compressed payload length)
  // - 1 byte Type ('U')
  // - 1 byte URI Identifier Code (0x04)
  // - N bytes URI Payload
  // - 2 bytes NDEF TLV wrapper (0x03, Length) + 1 byte Terminator TLV (0xFE)
  const compressedPayloadBytes = new TextEncoder().encode(compressedPayload).length;
  const ndefTotalBytes = 5 + compressedPayloadBytes + 3;

  const NTAG213_USER_CAPACITY = 144;
  const capacityPercent = Math.min(
    100,
    parseFloat(((ndefTotalBytes / NTAG213_USER_CAPACITY) * 100).toFixed(1))
  );

  return {
    publicId,
    canonicalUrl,
    ndefRecordType: 'U',
    ndefTnf: '0x01',
    ndefPrefixCode: prefixCode,
    ndefCompressedPayload: compressedPayload,
    byteLength: rawBytes,
    compressedByteLength: compressedPayloadBytes + 1,
    ntag213UserCapacityBytes: NTAG213_USER_CAPACITY,
    ntag213BytesUsed: ndefTotalBytes,
    ntag213CapacityPercent: capacityPercent,
    isNtag213Compatible: ndefTotalBytes <= NTAG213_USER_CAPACITY,
    factoryLockDirective: 'PERMANENT_READ_ONLY',
  };
}
