import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
  GenerateKeyPairResult,
  JSONWebKeySet,
} from 'jose';
import {
  verifyCloudflareAccessJwt,
  getCfAccessIssuer,
  getCfAccessJwksUrl,
} from '../../src/server/accessJwt';
import { verifyAdminRequest } from '../../src/server/api';

describe('Cloudflare Access JWT Cryptographic Verification Suite', () => {
  let keyPair: GenerateKeyPairResult;
  let jwks: JSONWebKeySet;
  const teamDomain = 'nagarjuna-store';
  const expectedIssuer = 'https://nagarjuna-store.cloudflareaccess.com';
  const expectedAudience = 'aud_nagarjuna_admin_tag_98765';
  const testKid = 'nagarjuna-signing-key-1';

  beforeAll(async () => {
    // Generate an in-memory RS256 key pair for test fixture
    keyPair = await generateKeyPair('RS256', { extractable: true });
    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.kid = testKid;
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    jwks = {
      keys: [publicJwk],
    };
  });

  const createTestToken = async (
    overrides?: {
      issuer?: string;
      audience?: string;
      email?: string;
      kid?: string;
      expiresIn?: string | number;
      notBefore?: string | number;
    },
    signerKey = keyPair.privateKey
  ) => {
    const builder = new SignJWT({
      email: overrides?.email ?? 'admin@nagarjunatraders.com',
      sub: 'usr_uuid_nagarjuna_owner',
      identity_nonce: 'nonce_12345',
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

    return await builder.sign(signerKey);
  };

  it('normalizes Cloudflare Access team domain to full HTTPS issuer URL', () => {
    expect(getCfAccessIssuer('my-team')).toBe(
      'https://my-team.cloudflareaccess.com'
    );
    expect(getCfAccessIssuer('https://my-team.cloudflareaccess.com/')).toBe(
      'https://my-team.cloudflareaccess.com'
    );
    expect(getCfAccessJwksUrl('my-team')).toBe(
      'https://my-team.cloudflareaccess.com/cdn-cgi/access/certs'
    );
  });

  it('verifies a validly signed Cloudflare Access RS256 JWT assertion', async () => {
    const token = await createTestToken({
      email: 'manager@nagarjunatraders.com',
    });

    const result = await verifyCloudflareAccessJwt(token, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(true);
    expect(result.status).toBe(200);
    expect(result.operatorId).toBe('manager@nagarjunatraders.com');
    expect(result.payload?.iss).toBe(expectedIssuer);
    expect(result.payload?.aud).toBe(expectedAudience);
  });

  it('rejects missing or empty JWT with 401', async () => {
    const resEmpty = await verifyCloudflareAccessJwt('', {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });
    expect(resEmpty.valid).toBe(false);
    expect(resEmpty.status).toBe(401);
    expect(resEmpty.error).toContain('Missing Cloudflare Access JWT');

    const resNull = await verifyCloudflareAccessJwt(null as any, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });
    expect(resNull.valid).toBe(false);
    expect(resNull.status).toBe(401);
  });

  it('fails closed with 500 when server configuration is missing', async () => {
    const token = await createTestToken();

    // Missing team domain
    const resNoDomain = await verifyCloudflareAccessJwt(token, {
      audience: expectedAudience,
      jwks,
    });
    expect(resNoDomain.valid).toBe(false);
    expect(resNoDomain.status).toBe(500);
    expect(resNoDomain.error).toContain('CF_ACCESS_TEAM_DOMAIN');

    // Missing audience
    const resNoAud = await verifyCloudflareAccessJwt(token, {
      teamDomain,
      jwks,
    });
    expect(resNoAud.valid).toBe(false);
    expect(resNoAud.status).toBe(500);
    expect(resNoAud.error).toContain('CF_ACCESS_AUD');
  });

  it('rejects forged JWTs with invalid cryptographic signatures with 401', async () => {
    // Generate an untrusted foreign key pair
    const foreignKeys = await generateKeyPair('RS256');
    const forgedToken = await createTestToken({}, foreignKeys.privateKey);

    const result = await verifyCloudflareAccessJwt(forgedToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('signature');
  });

  it('rejects tampered JWTs where header/payload were modified after signing', async () => {
    const validToken = await createTestToken();
    const parts = validToken.split('.');

    // Tamper with payload (modify middle part)
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        email: 'attacker@evil.com',
        iss: expectedIssuer,
        aud: expectedAudience,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');

    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const result = await verifyCloudflareAccessJwt(tamperedToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('signature');
  });

  it('rejects expired tokens with 401', async () => {
    const expiredToken = await createTestToken({
      expiresIn: '-10s', // expired 10 seconds ago
    });

    const result = await verifyCloudflareAccessJwt(expiredToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
      clockToleranceSeconds: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('expired');
  });

  it('rejects tokens not yet active (nbf in future) with 401', async () => {
    const futureToken = await createTestToken({
      notBefore: '1h', // valid starting in 1 hour
    });

    const result = await verifyCloudflareAccessJwt(futureToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
      clockToleranceSeconds: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('not yet active');
  });

  it('rejects tokens with incorrect audience with 403', async () => {
    const wrongAudToken = await createTestToken({
      audience: 'different-app-audience-tag',
    });

    const result = await verifyCloudflareAccessJwt(wrongAudToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('audience mismatch');
  });

  it('rejects tokens with incorrect issuer with 403', async () => {
    const wrongIssToken = await createTestToken({
      issuer: 'https://imposter-team.cloudflareaccess.com',
    });

    const result = await verifyCloudflareAccessJwt(wrongIssToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain('issuer mismatch');
  });

  it('rejects tokens with unknown key ID (kid) in JWKS with 401', async () => {
    const unknownKidToken = await createTestToken({
      kid: 'unknown-key-id-999',
    });

    const result = await verifyCloudflareAccessJwt(unknownKidToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain('key ID');
  });

  it('enforces configured administrator allowlist', async () => {
    const allowedEmail = 'owner@nagarjunatraders.com';
    const unauthorizedEmail = 'staff@nagarjunatraders.com';

    // 1. Authorized administrator succeeds
    const allowedToken = await createTestToken({ email: allowedEmail });
    const resAllowed = await verifyCloudflareAccessJwt(allowedToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
      allowedAdmins: [allowedEmail, 'security@nagarjunatraders.com'],
    });
    expect(resAllowed.valid).toBe(true);
    expect(resAllowed.operatorId).toBe(allowedEmail);

    // 2. Unauthorized administrator rejected with 403
    const unauthToken = await createTestToken({ email: unauthorizedEmail });
    const resUnauth = await verifyCloudflareAccessJwt(unauthToken, {
      teamDomain,
      audience: expectedAudience,
      jwks,
      allowedAdmins: [allowedEmail, 'security@nagarjunatraders.com'],
    });
    expect(resUnauth.valid).toBe(false);
    expect(resUnauth.status).toBe(403);
    expect(resUnauth.error).toContain('not authorized by access policy');
  });

  describe('Integration with verifyAdminRequest() in api.ts', () => {
    it('accepts valid Cloudflare Access assertion via Cf-Access-Jwt-Assertion header', async () => {
      const token = await createTestToken({ email: 'cf-admin@nagarjuna.com' });
      const req = new Request('http://localhost/api/v1/admin/dashboard', {
        headers: {
          'Cf-Access-Jwt-Assertion': token,
        },
      });

      const env = {
        ENVIRONMENT: 'production',
        CF_ACCESS_TEAM_DOMAIN: teamDomain,
        CF_ACCESS_AUD: expectedAudience,
        CF_ACCESS_JWKS: jwks,
      };

      const auth = await verifyAdminRequest(req, env);
      expect(auth.authorized).toBe(true);
      expect(auth.operatorId).toBe('cf-admin@nagarjuna.com');
    });

    it('strictly rejects dev tokens in production mode', async () => {
      const req = new Request('http://localhost/api/v1/admin/dashboard', {
        headers: {
          Authorization: 'Bearer dev-admin-token',
        },
      });

      const env = {
        ENVIRONMENT: 'production',
        CF_ACCESS_TEAM_DOMAIN: teamDomain,
        CF_ACCESS_AUD: expectedAudience,
      };

      const auth = await verifyAdminRequest(req, env);
      expect(auth.authorized).toBe(false);
      expect(auth.status).toBe(401);
      expect(auth.error).toContain('Cloudflare Access JWT Assertion is required');
    });

    it('rejects forged JWT assertions in production mode', async () => {
      const foreignKeys = await generateKeyPair('RS256');
      const forgedToken = await createTestToken({}, foreignKeys.privateKey);

      const req = new Request('http://localhost/api/v1/admin/dashboard', {
        headers: {
          'Cf-Access-Jwt-Assertion': forgedToken,
        },
      });

      const env = {
        ENVIRONMENT: 'production',
        CF_ACCESS_TEAM_DOMAIN: teamDomain,
        CF_ACCESS_AUD: expectedAudience,
        CF_ACCESS_JWKS: jwks,
      };

      const auth = await verifyAdminRequest(req, env);
      expect(auth.authorized).toBe(false);
      expect(auth.status).toBe(401);
      expect(auth.error).toContain('signature');
    });
  });
});
