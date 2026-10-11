import {
  createLocalJWKSet,
  createRemoteJWKSet,
  jwtVerify,
  errors as joseErrors,
  JWTPayload,
  JSONWebKeySet,
} from 'jose';

export interface VerifyCfAccessOptions {
  teamDomain?: string;
  audience?: string;
  allowedAdmins?: string[];
  jwksUrl?: string;
  jwks?: JSONWebKeySet;
  clockToleranceSeconds?: number;
}

export interface CfAccessVerifyResult {
  valid: boolean;
  operatorId?: string;
  payload?: JWTPayload;
  error?: string;
  status: number;
}

/**
 * Normalizes Cloudflare Access team domain to full HTTPS issuer URL.
 * e.g., 'my-team' -> 'https://my-team.cloudflareaccess.com'
 * e.g., 'https://my-team.cloudflareaccess.com' -> 'https://my-team.cloudflareaccess.com'
 */
export function getCfAccessIssuer(teamDomain: string): string {
  const trimmed = teamDomain.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}.cloudflareaccess.com`;
}

/**
 * Returns documented Cloudflare Access public signing keys endpoint.
 * Format: https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
 */
export function getCfAccessJwksUrl(teamDomain: string): string {
  const issuer = getCfAccessIssuer(teamDomain);
  return `${issuer}/cdn-cgi/access/certs`;
}

// In-memory cache for remote JWKS sets to enable key rotation and reuse
const remoteJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getOrCreateRemoteJwks(url: string) {
  let cached = remoteJwksCache.get(url);
  if (!cached) {
    cached = createRemoteJWKSet(new URL(url), {
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes cache
      cooldownDuration: 30 * 1000, // 30 seconds cooldown between manual refreshes
    });
    remoteJwksCache.set(url, cached);
  }
  return cached;
}

/**
 * Clears cached remote JWKS (useful in test suites)
 */
export function clearRemoteJwksCache(): void {
  remoteJwksCache.clear();
}

/**
 * Cryptographically verifies a Cloudflare Access JWT Assertion.
 *
 * Requirements enforced:
 * 1. Checks team domain & audience configuration; fails closed if missing.
 * 2. Obtains public signing keys from JWKS (or local test JWKS).
 * 3. Verifies cryptographic signature using accepted algorithm (RS256).
 * 4. Validates issuer, audience, expiry, and not-before claims.
 * 5. Handles key rotation via key ID (kid).
 * 6. Checks operator identity against optional configured allowlist.
 * 7. Fails closed with appropriate HTTP status codes (401, 403, 500).
 */
export async function verifyCloudflareAccessJwt(
  jwt: string,
  options: VerifyCfAccessOptions
): Promise<CfAccessVerifyResult> {
  if (!jwt || typeof jwt !== 'string' || jwt.trim().length === 0) {
    return {
      valid: false,
      status: 401,
      error: 'Missing Cloudflare Access JWT Assertion.',
    };
  }

  const teamDomain = options.teamDomain?.trim();
  const audience = options.audience?.trim();

  // Fail closed if required Access configuration is missing
  if (!teamDomain || !audience) {
    return {
      valid: false,
      status: 500,
      error:
        'Cloudflare Access server configuration missing: CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD are required.',
    };
  }

  const expectedIssuer = getCfAccessIssuer(teamDomain);

  let keySet;
  if (options.jwks) {
    // Local / test JWKS provided
    keySet = createLocalJWKSet(options.jwks);
  } else {
    // Remote documented Cloudflare Access certs endpoint
    const jwksUrl = options.jwksUrl?.trim() || getCfAccessJwksUrl(teamDomain);
    try {
      keySet = getOrCreateRemoteJwks(jwksUrl);
    } catch (urlErr: any) {
      return {
        valid: false,
        status: 500,
        error: `Failed to initialize Cloudflare Access JWKS endpoint: ${urlErr.message}`,
      };
    }
  }

  try {
    const { payload } = await jwtVerify(jwt, keySet, {
      issuer: expectedIssuer,
      audience: audience,
      algorithms: ['RS256'],
      clockTolerance: options.clockToleranceSeconds ?? 5,
    });

    // Check optional administrator allowlist
    const allowedAdmins = options.allowedAdmins;
    const operatorId =
      (payload.email as string) ||
      (payload.sub as string) ||
      'CF-ACCESS-OPERATOR';

    if (allowedAdmins && allowedAdmins.length > 0) {
      const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
      const sub = typeof payload.sub === 'string' ? payload.sub.toLowerCase() : '';
      const isAllowed = allowedAdmins.some((allowed) => {
        const norm = allowed.trim().toLowerCase();
        return norm === email || norm === sub;
      });

      if (!isAllowed) {
        return {
          valid: false,
          status: 403,
          error: `Administrator identity (${operatorId}) is not authorized by access policy.`,
        };
      }
    }

    return {
      valid: true,
      status: 200,
      operatorId,
      payload,
    };
  } catch (err: any) {
    // Differentiate cryptographic and claim failures, failing closed
    if (err instanceof joseErrors.JWTExpired) {
      return {
        valid: false,
        status: 401,
        error: 'Cloudflare Access token has expired.',
      };
    }

    if (err instanceof joseErrors.JWTClaimValidationFailed) {
      if (err.claim === 'aud') {
        return {
          valid: false,
          status: 403,
          error: 'JWT audience mismatch.',
        };
      }
      if (err.claim === 'iss') {
        return {
          valid: false,
          status: 403,
          error: 'JWT issuer mismatch.',
        };
      }
      if (err.claim === 'nbf') {
        return {
          valid: false,
          status: 401,
          error: 'Cloudflare Access token is not yet active.',
        };
      }
      return {
        valid: false,
        status: 401,
        error: `JWT claim validation failed: ${err.message}`,
      };
    }

    if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
      return {
        valid: false,
        status: 401,
        error: 'Invalid JWT signature or forged token.',
      };
    }

    if (
      err instanceof joseErrors.JWKSNoMatchingKey ||
      err.message?.includes('no applicable key')
    ) {
      return {
        valid: false,
        status: 401,
        error: 'Unknown signing key ID (kid) in JWKS.',
      };
    }

    return {
      valid: false,
      status: 401,
      error: `Cloudflare Access JWT verification failed: ${err.message || 'unknown error'}`,
    };
  }
}
