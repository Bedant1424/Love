import { describe, it, expect, beforeEach } from 'vitest';
import { handleApiRequest } from '../../src/server/api';
import { hashPassword, verifyPassword, generateSecureToken } from '../../src/server/authCrypto';
import { globalMemoryDb } from '../../src/server/db';

describe('Single Admin Email & Password Authentication & Sessions', () => {
  beforeEach(() => {
    globalMemoryDb.seed();
  });

  describe('Password Hashing & Crypto', () => {
    it('generates PBKDF2-SHA256 hashes with 100,000 iterations and verifies correctly', async () => {
      const plaintext = '1029384756';
      const hash = await hashPassword(plaintext);

      expect(hash).toMatch(/^pbkdf2:sha256:100000:[0-9a-f]{32}:[0-9a-f]{64}$/);

      const isValid = await verifyPassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isWrong = await verifyPassword('wrongpassword', hash);
      expect(isWrong).toBe(false);
    });

    it('rejects malformed hashes gracefully', async () => {
      expect(await verifyPassword('test', '')).toBe(false);
      expect(await verifyPassword('test', 'invalid:hash')).toBe(false);
      expect(await verifyPassword('test', 'pbkdf2:sha256:10:bad:hash')).toBe(false);
    });

    it('generates random hex tokens of custom length', () => {
      const token1 = generateSecureToken(16);
      const token2 = generateSecureToken(16);
      expect(token1).toHaveLength(32);
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2);
    });
  });

  describe('Single Admin Account Creation & Gating (/api/v1/admin/auth/init)', () => {
    it('allows initial creation when admin count is 0 and rejects weak inputs', async () => {
      // 1. Invalid email
      const badEmailRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/init', {
          method: 'POST',
          body: JSON.stringify({ email: 'invalid-email', password: 'password123' }),
        })
      );
      expect(badEmailRes.status).toBe(400);

      // 2. Short password
      const shortPassRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/init', {
          method: 'POST',
          body: JSON.stringify({ email: 'astar0017@gmail.com', password: 'short' }),
        })
      );
      expect(shortPassRes.status).toBe(400);

      // 3. Valid initial setup
      const validInitRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/init', {
          method: 'POST',
          body: JSON.stringify({ email: 'astar0017@gmail.com', password: 'initialPassword123' }),
        })
      );
      expect(validInitRes.status).toBe(201);
      const initJson = (await validInitRes.json()) as any;
      expect(initJson.success).toBe(true);

      // 4. Setup is now permanently disabled (403 SETUP_DISABLED)
      const secondInitRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/init', {
          method: 'POST',
          body: JSON.stringify({ email: 'second@gmail.com', password: 'secondPassword123' }),
        })
      );
      expect(secondInitRes.status).toBe(403);
      const secondJson = (await secondInitRes.json()) as any;
      expect(secondJson.error.code).toBe('SETUP_DISABLED');
    });
  });

  describe('Login, Mandatory Password Change & Session Lifecycle', () => {
    const testEmail = 'astar0017@gmail.com';
    const initialPass = '1029384756';

    beforeEach(async () => {
      // Initialize single owner account
      await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/init', {
          method: 'POST',
          body: JSON.stringify({ email: testEmail, password: initialPass }),
        })
      );
    });

    it('rejects incorrect credentials with 401', async () => {
      const wrongPassRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: testEmail, password: 'wrongpassword' }),
        })
      );
      expect(wrongPassRes.status).toBe(401);

      const wrongEmailRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'unknown@gmail.com', password: initialPass }),
        })
      );
      expect(wrongEmailRes.status).toBe(401);
    });

    it('authenticates owner, sets HttpOnly cookie, and enforces mustChangePassword', async () => {
      const loginRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: testEmail, password: initialPass }),
        })
      );
      expect(loginRes.status).toBe(200);

      const setCookie = loginRes.headers.get('Set-Cookie');
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain('admin_session=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');

      const loginJson = (await loginRes.json()) as any;
      expect(loginJson.success).toBe(true);
      expect(loginJson.data.authenticated).toBe(true);
      expect(loginJson.data.email).toBe(testEmail);
      expect(loginJson.data.mustChangePassword).toBe(true);
      expect(loginJson.data.csrfToken).toBeTruthy();

      const sessionCookie = setCookie!.split(';')[0];
      const csrfToken = loginJson.data.csrfToken;

      // When mustChangePassword is true, calling protected admin dashboard returns 403
      const blockedDashboardRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/dashboard', {
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      expect(blockedDashboardRes.status).toBe(403);
      const blockedJson = (await blockedDashboardRes.json()) as any;
      expect(blockedJson.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

      // Change password requires valid current password and CSRF token
      const failedChangeRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/change-password', {
          method: 'POST',
          headers: {
            Cookie: sessionCookie,
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            currentPassword: 'incorrect-current',
            newPassword: 'MyNewStrongPassword2026!',
          }),
        })
      );
      expect(failedChangeRes.status).toBe(400);

      // Successful password change
      const successChangeRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/change-password', {
          method: 'POST',
          headers: {
            Cookie: sessionCookie,
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            currentPassword: initialPass,
            newPassword: 'MyNewStrongPassword2026!',
          }),
        })
      );
      expect(successChangeRes.status).toBe(200);

      // Now dashboard is unblocked and returns 200
      const unblockedDashboardRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/dashboard', {
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      expect(unblockedDashboardRes.status).toBe(200);

      // Checking session returns mustChangePassword: false
      const sessionRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/session', {
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      expect(sessionRes.status).toBe(200);
      const sessionJson = (await sessionRes.json()) as any;
      expect(sessionJson.data.authenticated).toBe(true);
      expect(sessionJson.data.mustChangePassword).toBe(false);

      // Logging out invalidates session
      const logoutRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/logout', {
          method: 'POST',
          headers: {
            Cookie: sessionCookie,
            'X-CSRF-Token': csrfToken,
          },
        })
      );
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.headers.get('Set-Cookie')).toContain('Max-Age=0');

      // Subsequent access with logged out session returns 401
      const afterLogoutRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/dashboard', {
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        })
      );
      expect(afterLogoutRes.status).toBe(401);
    });

    it('enforces CSRF protection on mutating admin routes', async () => {
      const loginRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: testEmail, password: initialPass }),
        })
      );
      const setCookie = loginRes.headers.get('Set-Cookie')!;
      const sessionCookie = setCookie.split(';')[0];

      // 1. Password change without X-CSRF-Token -> 403 CSRF failed
      const missingCsrfRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/change-password', {
          method: 'POST',
          headers: {
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            currentPassword: initialPass,
            newPassword: 'BrandNewPassword123!',
          }),
        })
      );
      expect(missingCsrfRes.status).toBe(403);

      // 2. Password change with wrong X-CSRF-Token -> 403 CSRF failed
      const wrongCsrfRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/auth/change-password', {
          method: 'POST',
          headers: {
            Cookie: sessionCookie,
            'X-CSRF-Token': 'forged-csrf-token',
          },
          body: JSON.stringify({
            currentPassword: initialPass,
            newPassword: 'BrandNewPassword123!',
          }),
        })
      );
      expect(wrongCsrfRes.status).toBe(403);
    });

    it('permanently revokes the compromised test token', async () => {
      const compromisedRes = await handleApiRequest(
        new Request('http://localhost/api/v1/admin/dashboard', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer admin-jwt-session-nagarjuna',
          },
        })
      );
      expect(compromisedRes.status).toBe(401);
      const json = (await compromisedRes.json()) as any;
      expect(json.error.message).toContain('revoked');
    });
  });
});
