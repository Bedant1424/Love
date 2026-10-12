import { describe, it, expect, beforeEach } from 'vitest';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';

describe('QR Version Dynamic Sync & Payment Config Suite', () => {
  const prodEnv = {
    ENVIRONMENT: 'production',
    PAYMENT_COLLECTION_ENABLED: 'true',
    RESTRICTED_TEST_MODE: 'false',
  };

  beforeEach(async () => {
    // Clear any seeded active QR versions for isolated testing
    const versions = await globalMemoryDb.getQrVersions();
    for (const v of versions) {
      if (v.is_active === 1) {
        await globalMemoryDb.deactivateQrVersion(v.id);
      }
    }
  });

  it('fails safely with paymentCollectionEnabled: false when no active QR version exists in database', async () => {
    const req = new Request('http://localhost/api/v1/payment-config', { method: 'GET' });
    const res = await handleApiRequest(req, prodEnv);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.paymentCollectionEnabled).toBe(false);
    expect(json.data.message).toBe('Payment instructions are currently unavailable.');
    expect(json.data.vpa).toBeUndefined();
    expect(json.data.accountName).toBeUndefined();
  });

  it('dynamically serves the active QR version when activated', async () => {
    // Upload and activate the approved Slice QR
    const uploaded = await globalMemoryDb.uploadQrVersion(
      'Slice UPI - jena2005@slc',
      'jena2005@slc',
      'Mr Subham Jena',
      '/images/nagarjuna-payment-qr.jpeg',
      'astar0017@gmail.com'
    );
    await globalMemoryDb.activateQrVersion(uploaded.id, 'astar0017@gmail.com', 'Production activation');

    const req = new Request('http://localhost/api/v1/payment-config', { method: 'GET' });
    const res = await handleApiRequest(req, prodEnv);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.paymentCollectionEnabled).toBe(true);
    expect(json.data.vpa).toBe('jena2005@slc');
    expect(json.data.accountName).toBe('Mr Subham Jena');
    expect(json.data.qrImageUrl).toBe('/images/nagarjuna-payment-qr.jpeg');
    expect(json.data.isRestrictedEnv).toBe(false);
  });

  it('ensures deactivating the QR version disables customer checkout payments immediately', async () => {
    const uploaded = await globalMemoryDb.uploadQrVersion(
      'Temporary QR',
      'temp@upi',
      'Temporary Merchant',
      '/images/temp.png'
    );
    await globalMemoryDb.activateQrVersion(uploaded.id);

    // Verify enabled
    let res = await handleApiRequest(new Request('http://localhost/api/v1/payment-config'), prodEnv);
    let json = await res.json();
    expect(json.data.paymentCollectionEnabled).toBe(true);

    // Deactivate
    await globalMemoryDb.deactivateQrVersion(uploaded.id);

    // Verify immediately disabled
    res = await handleApiRequest(new Request('http://localhost/api/v1/payment-config'), prodEnv);
    json = await res.json();
    expect(json.data.paymentCollectionEnabled).toBe(false);
    expect(json.data.message).toBe('Payment instructions are currently unavailable.');
  });
});
