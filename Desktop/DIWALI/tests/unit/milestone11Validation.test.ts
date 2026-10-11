import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
  GenerateKeyPairResult,
  JSONWebKeySet,
} from 'jose';
import { globalMemoryDb } from '../../src/server/db';
import { handleApiRequest } from '../../src/server/api';
import { fallbackR2Bucket } from '../../src/server/qrStorage';

describe('Milestone 11 Validation: QR Lifecycle, Decoupled Storage & Zero Trust Admin Access', () => {
  let keyPair: GenerateKeyPairResult;
  let jwks: JSONWebKeySet;
  const teamDomain = 'nagarjuna-store';
  const expectedIssuer = 'https://nagarjuna-store.cloudflareaccess.com';
  const expectedAudience = 'aud_nagarjuna_prod_998877';
  const testKid = 'nagarjuna-access-key-2026';
  const allowedAdminEmail = 'manager@nagarjunatraders.com';

  let hostedAccessEnv: any;

  beforeAll(async () => {
    keyPair = await generateKeyPair('RS256', { extractable: true });
    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = testKid;
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    jwks = {
      keys: [publicJwk],
    };

    hostedAccessEnv = {
      ENVIRONMENT: 'production',
      IS_HOSTED: 'true',
      CF_ACCESS_TEAM_DOMAIN: teamDomain,
      CF_ACCESS_AUD: expectedAudience,
      CF_ACCESS_ALLOWED_ADMINS: allowedAdminEmail,
      CF_ACCESS_JWKS: jwks,
    };
  });

  beforeEach(() => {
    globalMemoryDb.seed();
    fallbackR2Bucket.clear();
  });

  const createAdminJwt = async (
    overrides?: {
      email?: string;
      audience?: string;
      issuer?: string;
      expiresIn?: string | number;
      notBefore?: string | number;
      kid?: string;
    },
    signer = keyPair.privateKey
  ) => {
    const builder = new SignJWT({
      email: overrides?.email ?? allowedAdminEmail,
      sub: 'usr_nagarjuna_operator_1',
      identity_nonce: 'nonce_cf_access_123',
    })
      .setProtectedHeader({
        alg: 'RS256',
        kid: overrides?.kid ?? testKid,
      })
      .setIssuedAt()
      .setIssuer(overrides?.issuer ?? expectedIssuer)
      .setAudience(overrides?.audience ?? expectedAudience);

    if (overrides?.expiresIn !== undefined) {
      builder.setExpirationTime(overrides.expiresIn);
    } else {
      builder.setExpirationTime('2h');
    }

    if (overrides?.notBefore !== undefined) {
      builder.setNotBefore(overrides.notBefore);
    }

    return await builder.sign(signer);
  };

  // Helper valid fixtures
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG magic
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  const validPngDataUri = `data:image/png;base64,${validPngBuffer.toString('base64')}`;

  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03,
    0xff, 0xd9,
  ]);
  const validJpegDataUri = `data:image/jpeg;base64,${validJpegBuffer.toString('base64')}`;

  describe('Part C: QR Workflow Validation and Storage Decoupling', () => {
    it('uploads a valid PNG QR fixture and persists image to decoupled storage', async () => {
      const adminToken = await createAdminJwt();
      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'Diwali Primary Store UPI QR',
          vpa: 'nagarjunatraders@icici',
          accountName: 'NAGARJUNA TRADERS',
          imageDataUri: validPngDataUri,
          activateNow: false,
          operatorId: allowedAdminEmail,
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.label).toBe('Diwali Primary Store UPI QR');
      expect(json.data.vpa).toBe('nagarjunatraders@icici');
      expect(json.data.content_type).toBe('image/png');
      expect(json.data.r2_object_key).toMatch(/^qr-assets\//);
      expect(json.data.sha256_checksum).toBeDefined();
      expect(json.data.image_url).toContain('/api/v1/qr-images/');
      // Newly uploaded version with activateNow=false should be draft (inactive)
      expect(json.data.is_active).toBe(0);
    });

    it('uploads a valid JPEG QR fixture and handles JPEG MIME type', async () => {
      const adminToken = await createAdminJwt();
      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'HDFC Fallback Counter QR',
          vpa: 'nagarjunahdfc@okaxis',
          accountName: 'NAGARJUNA TRADERS',
          imageDataUri: validJpegDataUri,
          activateNow: false,
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.content_type).toBe('image/jpeg');
    });

    it('strictly rejects malformed images with invalid magic headers', async () => {
      const adminToken = await createAdminJwt();
      const badBuffer = Buffer.from('NOT_A_VALID_IMAGE_CONTENT_RAW_TEXT');
      const badDataUri = `data:image/png;base64,${badBuffer.toString('base64')}`;

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'Corrupted QR',
          vpa: 'bad@upi',
          accountName: 'Test',
          imageDataUri: badDataUri,
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_IMAGE_TYPE');
    });

    it('strictly rejects oversized images (> 2MB)', async () => {
      const adminToken = await createAdminJwt();
      // Generate oversized payload buffer (> 2.1 MB)
      const oversizedBuffer = Buffer.alloc(2.2 * 1024 * 1024, 0x41);
      // Give valid PNG header so size check triggers
      validPngBuffer.copy(oversizedBuffer, 0, 0, 8);
      const oversizedDataUri = `data:image/png;base64,${oversizedBuffer.toString('base64')}`;

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'Oversized QR',
          vpa: 'oversized@upi',
          accountName: 'Test',
          imageDataUri: oversizedDataUri,
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FILE_TOO_LARGE');
    });

    it('strictly rejects dangerous non-raster types like SVG or HTML scripts', async () => {
      const adminToken = await createAdminJwt();
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const svgDataUri = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'SVG QR Attack',
          vpa: 'test@upi',
          accountName: 'Test',
          imageDataUri: svgDataUri,
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_IMAGE_TYPE');
    });

    it('retrieves stored image bytes via decoupled proxy route with correct headers', async () => {
      const adminToken = await createAdminJwt();
      const uploadReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': adminToken,
        },
        body: JSON.stringify({
          label: 'Persistent QR',
          vpa: 'persist@upi',
          accountName: 'Persist Account',
          imageDataUri: validPngDataUri,
        }),
      });

      const uploadRes = await handleApiRequest(uploadReq, hostedAccessEnv);
      const uploadJson = await uploadRes.json();
      const qrId = uploadJson.data.id;

      // Now fetch stored binary image via public retrieval route
      const fetchReq = new Request(`https://nagarjuna-traders.pages.dev/api/v1/qr-images/${qrId}`);
      const fetchRes = await handleApiRequest(fetchReq, hostedAccessEnv);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.headers.get('Content-Type')).toBe('image/png');
      expect(fetchRes.headers.get('ETag')).toBeDefined();
      expect(fetchRes.headers.get('Cache-Control')).toContain('max-age=86400');

      const arrayBuf = await fetchRes.arrayBuffer();
      const retrievedBuf = Buffer.from(arrayBuf);
      expect(retrievedBuf.slice(0, 8)).toEqual(validPngBuffer.slice(0, 8));
    });

    it('enforces single-active QR version via atomic activation and deactivation', async () => {
      const adminToken = await createAdminJwt();

      // Upload Version 1 and activate it
      const up1 = await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
          body: JSON.stringify({
            label: 'Counter QR 1',
            vpa: 'counter1@upi',
            accountName: 'Nagarjuna Counter 1',
            imageDataUri: validPngDataUri,
            activateNow: true,
            operatorId: allowedAdminEmail,
          }),
        }),
        hostedAccessEnv
      );
      const v1 = (await up1.json()).data;
      expect(v1.is_active).toBe(1);

      // Upload Version 2 as draft
      const up2 = await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
          body: JSON.stringify({
            label: 'Counter QR 2 (Draft)',
            vpa: 'counter2@upi',
            accountName: 'Nagarjuna Counter 2',
            imageDataUri: validJpegDataUri,
            activateNow: false,
          }),
        }),
        hostedAccessEnv
      );
      const v2 = (await up2.json()).data;
      expect(v2.is_active).toBe(0);

      // Activate Version 2
      const actRes = await handleApiRequest(
        new Request(`https://nagarjuna-traders.pages.dev/api/v1/admin/qr/${v2.id}/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
        }),
        hostedAccessEnv
      );
      expect(actRes.status).toBe(200);

      // Inspect versions list: confirm exactly one is active
      const listRes = await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
        }),
        hostedAccessEnv
      );
      const versions = (await listRes.json()).data;
      const activeVersions = versions.filter((item: any) => item.is_active === 1);
      expect(activeVersions.length).toBe(1);
      expect(activeVersions[0].id).toBe(v2.id);

      // Deactivate Version 2
      const deactRes = await handleApiRequest(
        new Request(`https://nagarjuna-traders.pages.dev/api/v1/admin/qr/${v2.id}/deactivate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
        }),
        hostedAccessEnv
      );
      expect(deactRes.status).toBe(200);

      const listAfterDeact = await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
        }),
        hostedAccessEnv
      );
      const versionsAfter = (await listAfterDeact.json()).data;
      const activeAfter = versionsAfter.filter((item: any) => item.is_active === 1);
      expect(activeAfter.length).toBe(0);

      // Verify audit logs recorded both QR activations and deactivations
      const auditRes = await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/audit-logs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
        }),
        hostedAccessEnv
      );
      const auditJson = await auditRes.json();
      const reasons = auditJson.data.map((l: any) => (l.reason || '').toLowerCase());
      expect(reasons.some((r: string) => r.includes('activated qr version') || r.includes('initial activation'))).toBe(true);
      expect(reasons.some((r: string) => r.includes('deactivated qr version'))).toBe(true);
    });

    it('customer payment-config never exposes active QR in public production when payment collection is disabled', async () => {
      // Public environment: payment collection disabled
      const publicProdEnv = {
        ENVIRONMENT: 'production',
        IS_HOSTED: 'true',
        PAYMENT_COLLECTION_ENABLED: 'false',
        RESTRICTED_TEST_MODE: 'false',
      };

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config');
      const res = await handleApiRequest(req, publicProdEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.paymentCollectionEnabled).toBe(false);
      expect(json.data.qrImageUrl).toBeUndefined();
      expect(json.data.vpa).toBeUndefined();
      expect(json.data.isRestrictedEnv).toBe(false);
    });

    it('restricted test mode uses active QR only when server env permits testing', async () => {
      const adminToken = await createAdminJwt();
      // Activate a QR
      await handleApiRequest(
        new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/qr/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cf-Access-Jwt-Assertion': adminToken,
          },
          body: JSON.stringify({
            label: 'Test Verified QR',
            vpa: 'testverified@upi',
            accountName: 'Test Verified',
            imageDataUri: validPngDataUri,
            activateNow: true,
          }),
        }),
        hostedAccessEnv
      );

      const restrictedEnv = {
        ENVIRONMENT: 'test',
        RESTRICTED_TEST_MODE: 'true',
        PAYMENT_COLLECTION_ENABLED: 'false',
      };

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/payment-config');
      const res = await handleApiRequest(req, restrictedEnv);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isRestrictedEnv).toBe(true);
      expect(json.data.vpa).toBe('testverified@upi');
      expect(json.data.testFixture).toBeDefined();
    });
  });

  describe('Part D: Cloudflare Access Zero Trust Security & Admin Authorization', () => {
    it('rejects unauthenticated requests to /api/v1/admin/* with 401', async () => {
      const endpoints = [
        '/api/v1/admin/dashboard',
        '/api/v1/admin/inventory',
        '/api/v1/admin/orders',
        '/api/v1/admin/qr',
        '/api/v1/admin/customers',
      ];

      for (const ep of endpoints) {
        const req = new Request(`https://nagarjuna-traders.pages.dev${ep}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const res = await handleApiRequest(req, hostedAccessEnv);
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.success).toBe(false);
      }
    });

    it('permanently bans revoked compromised token admin-jwt-session-nagarjuna with 401', async () => {
      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-jwt-session-nagarjuna',
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('Compromised administrative session token is permanently revoked');
    });

    it('rejects fixed local dev bearer tokens on hosted preview domains with 401', async () => {
      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-admin-token',
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('Cloudflare Access JWT Assertion is required');
    });

    it('rejects forged JWT signed with an untrusted RS256 key with 401', async () => {
      const rogueKeyPair = await generateKeyPair('RS256');
      const forgedJwt = await createAdminJwt({}, rogueKeyPair.privateKey);

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': forgedJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('Invalid JWT signature or forged token');
    });

    it('rejects expired Cloudflare Access tokens with 401', async () => {
      const expiredJwt = await createAdminJwt({
        expiresIn: '-10s',
      });

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': expiredJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('token has expired');
    });

    it('rejects tokens not yet active (nbf in future) with 401', async () => {
      const futureJwt = await createAdminJwt({
        notBefore: '1h',
      });

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': futureJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('not yet active');
    });

    it('rejects tokens with incorrect audience with 403', async () => {
      const badAudJwt = await createAdminJwt({
        audience: 'aud_wrong_application_tag_000',
      });

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': badAudJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.message).toContain('audience mismatch');
    });

    it('rejects tokens with incorrect issuer with 403', async () => {
      const badIssJwt = await createAdminJwt({
        issuer: 'https://imposter-team.cloudflareaccess.com',
      });

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': badIssJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.message).toContain('issuer mismatch');
    });

    it('rejects unauthorized identity outside allowlist with 403', async () => {
      const rogueEmailJwt = await createAdminJwt({
        email: 'attacker@unauthorized-external-domain.com',
      });

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': rogueEmailJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.message).toContain('not authorized by access policy');
    });

    it('POSITIVE AUTHORIZATION: genuine administrator can sign in and retrieve dashboard KPIs via Cf-Access-Jwt-Assertion', async () => {
      const validAdminJwt = await createAdminJwt();

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': validAdminJwt,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.totalOrders).toBeDefined();
      expect(json.data.totalVariantsCount).toBeDefined();
      expect(json.data.utrSubmittedCount).toBeDefined();
      expect(json.data.ordersReadyForPickupCount).toBeDefined();
    });

    it('POSITIVE AUTHORIZATION: genuine administrator can authenticate via Bearer JWT header', async () => {
      const validAdminJwt = await createAdminJwt();

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validAdminJwt}`,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });

    it('POSITIVE AUTHORIZATION: genuine administrator can authenticate via CF_Authorization cookie', async () => {
      const validAdminJwt = await createAdminJwt();

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session_id=123; CF_Authorization=${validAdminJwt}; tracking=xyz`,
        },
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('POSITIVE AUTHORIZATION: genuine administrator can adjust inventory stock and log is audited', async () => {
      const validAdminJwt = await createAdminJwt();

      // Retrieve first inventory variant dynamically
      const invReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': validAdminJwt,
        },
      });
      const invRes = await handleApiRequest(invReq, hostedAccessEnv);
      const invJson = await invRes.json();
      const targetVariantId = invJson.data[0].variant_id;

      const req = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': validAdminJwt,
        },
        body: JSON.stringify({
          variantId: targetVariantId,
          newStock: 88,
          operatorId: allowedAdminEmail,
          reason: 'Verified by Diwali stock warehouse manager',
        }),
      });

      const res = await handleApiRequest(req, hostedAccessEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.current_stock).toBe(88);

      // Verify inventory audit log entry
      const logReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/inventory/audit-logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cf-Access-Jwt-Assertion': validAdminJwt,
        },
      });
      const logRes = await handleApiRequest(logReq, hostedAccessEnv);
      const logJson = await logRes.json();
      expect(logJson.data.some((l: any) => l.reason.includes('Verified by Diwali stock warehouse manager'))).toBe(true);
    });
  });
});
