import { describe, it, expect, beforeEach } from 'vitest';
import { globalMemoryDb } from '../../src/server/db';
import { handleApiRequest } from '../../src/server/api';

describe('Operations Hub: Inventory, QR, Support Issues, and Sales Reporting', () => {
  beforeEach(() => {
    globalMemoryDb.seed();
  });

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer admin-jwt-session-nagarjuna',
    'CF-Access-Authenticated-User-Email': 'bedant@nagarjunatraders.internal',
  };

  const restrictedEnv = {
    ENVIRONMENT: 'test',
    RESTRICTED_TEST_MODE: 'true',
  };

  describe('Inventory Management', () => {
    it('returns zero uninitialized stock for real inventory, and allows seeding synthetic test stock', async () => {
      const req = new Request('http://localhost/api/v1/admin/inventory', {
        method: 'GET',
        headers: adminHeaders,
      });

      const res = await handleApiRequest(req, restrictedEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);

      const firstItem = json.data[0];
      expect(firstItem.current_stock).toBe(0);
      expect(firstItem.reserved_stock).toBe(0);
      expect(firstItem.available_stock).toBe(0);
      expect(firstItem.is_low_stock).toBe(true);

      // Synthetic test fixture stock can be populated for simulated workflows
      globalMemoryDb.seedSyntheticTestStock(100);
      const resWithSynthetic = await handleApiRequest(req, restrictedEnv);
      const jsonWithSynthetic = await resWithSynthetic.json();
      const syntheticItem = jsonWithSynthetic.data[0];
      expect(syntheticItem.current_stock).toBe(100);
      expect(syntheticItem.available_stock).toBe(100);
      expect(syntheticItem.is_low_stock).toBe(false);
    });

    it('allows adjusting stock level and produces an audit log entry', async () => {
      const adjustReq = new Request('http://localhost/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          variantId: 'var_bijli_60',
          newStock: 8,
          operatorId: 'OP-TEST',
          reason: 'Physical count adjustment',
        }),
      });

      const res = await handleApiRequest(adjustReq, restrictedEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.current_stock).toBe(8);
      expect(json.data.available_stock).toBe(8);
      expect(json.data.is_low_stock).toBe(true); // 8 <= 10 threshold

      // Check audit log
      const logsReq = new Request('http://localhost/api/v1/admin/inventory/audit-logs', {
        method: 'GET',
        headers: adminHeaders,
      });
      const logsRes = await handleApiRequest(logsReq, restrictedEnv);
      const logsJson = await logsRes.json();
      expect(logsJson.success).toBe(true);
      expect(logsJson.data.length).toBeGreaterThan(0);
      expect(logsJson.data[0].variant_id).toBe('var_bijli_60');
      expect(logsJson.data[0].action).toBe('MANUAL_ADJUST');
      expect(logsJson.data[0].stock_after).toBe(8);
    });

    it('rejects invalid or negative stock levels with 400', async () => {
      const badReq = new Request('http://localhost/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          variantId: 'var_bijli_60',
          newStock: -10,
        }),
      });

      const res = await handleApiRequest(badReq, restrictedEnv);
      expect(res.status).toBe(400);
    });

    it('rejects stock adjustment when audit reason is omitted or empty with 400', async () => {
      const noReasonReq = new Request('http://localhost/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          variantId: 'var_bijli_60',
          newStock: 50,
          reason: '',
        }),
      });

      const res = await handleApiRequest(noReasonReq, restrictedEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('REASON_REQUIRED');
    });

    it('rejects reducing stock below actively reserved units', async () => {
      // 1. Place order reserving 10 units
      await handleApiRequest(
        new Request('http://localhost/api/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              fullName: 'Reservation Test Customer',
              mobileNumber: '9911223344',
              fulfilmentPreference: 'COUNTER_PICKUP',
              ageConfirmed: true,
            },
            items: [{ variantId: 'var_bijli_60', quantity: 10 }],
          }),
        }),
        restrictedEnv
      );

      // 2. Attempt to reduce stock to 5 (< 10 reserved)
      const underReserveReq = new Request('http://localhost/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          variantId: 'var_bijli_60',
          newStock: 5,
          reason: 'Physical recount shrinkage',
        }),
      });

      const res = await handleApiRequest(underReserveReq, restrictedEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('STOCK_ADJUSTMENT_FAILED');
      expect(json.error.message).toContain('below active reservation');
    });
  });

  describe('QR Rotation and Management', () => {
    it('returns active test fixture QR initially', async () => {
      const req = new Request('http://localhost/api/v1/admin/qr', {
        method: 'GET',
        headers: adminHeaders,
      });

      const res = await handleApiRequest(req, restrictedEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);

      const active = json.data.find((q: any) => q.is_active === 1);
      expect(active).toBeDefined();
      expect(active.vpa).toBe('test-fixture@nagarjunatraders');
    });

    it('rejects upload of SVG or non-raster image formats with 400', async () => {
      const badUpload = new Request('http://localhost/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          label: 'Hacked QR',
          vpa: 'admin@bank',
          accountName: 'Malicious',
          imageDataUri: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        }),
      });

      const res = await handleApiRequest(badUpload, restrictedEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_IMAGE_TYPE');
    });

    it('rejects QR upload payloads containing embedded script or SVG tags with 400', async () => {
      const scriptUpload = new Request('http://localhost/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          label: 'XSS Attempt QR',
          vpa: 'admin@bank',
          accountName: 'Malicious',
          imageDataUri: 'data:image/png;base64,<script>alert(1)</script>',
        }),
      });

      const res = await handleApiRequest(scriptUpload, restrictedEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_IMAGE_TYPE');
      expect(json.error.message).toContain('SVG, XML, and scripts are strictly rejected');
    });

    it('allows uploading a new draft version and activating it with rotation', async () => {
      const uploadReq = new Request('http://localhost/api/v1/admin/qr/upload', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          label: 'Counter QR Terminal 2',
          vpa: 'nagarjuna.terminal2@okaxis',
          accountName: 'NAGARJUNA TRADERS SIVAKASI',
          imageDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=',
        }),
      });

      const uploadRes = await handleApiRequest(uploadReq, restrictedEnv);
      expect(uploadRes.status).toBe(201);
      const uploadJson = await uploadRes.json();
      expect(uploadJson.success).toBe(true);
      expect(uploadJson.data.is_active).toBe(0); // Inactive draft upon upload
      expect(uploadJson.data.version_number).toBe(2);

      const draftId = uploadJson.data.id;

      // Activate the new QR version
      const activateReq = new Request(
        `http://localhost/api/v1/admin/qr/${draftId}/activate`,
        {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({ notes: 'Switched to Terminal 2' }),
        }
      );

      const activateRes = await handleApiRequest(activateReq, restrictedEnv);
      expect(activateRes.status).toBe(200);
      const activateJson = await activateRes.json();
      expect(activateJson.data.is_active).toBe(1);

      // Verify that old version 1 was deactivated
      const listReq = new Request('http://localhost/api/v1/admin/qr', {
        method: 'GET',
        headers: adminHeaders,
      });
      const listRes = await handleApiRequest(listReq, restrictedEnv);
      const listJson = await listRes.json();
      const v1 = listJson.data.find((q: any) => q.version_number === 1);
      expect(v1.is_active).toBe(0);
      expect(v1.deactivated_at).toBeTruthy();
    });
  });

  describe('Payment Support Issues Workflow', () => {
    it('allows customers to report payment issues and returns a reference', async () => {
      const issueReq = new Request('http://localhost/api/v1/payment-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: 'NT-8821',
          customerName: 'Anil Reddy',
          customerMobile: '9848011223',
          issueType: 'QR_LIMIT_REACHED',
          description: 'GPay gave bank daily limit error',
        }),
      });

      const res = await handleApiRequest(issueReq, restrictedEnv);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.issueReference).toMatch(/^ISS-[0-9A-F]+$/);
      expect(json.data.status).toBe('OPEN');

      // Admin views issues
      const adminReq = new Request('http://localhost/api/v1/admin/payment-issues', {
        method: 'GET',
        headers: adminHeaders,
      });
      const adminRes = await handleApiRequest(adminReq, restrictedEnv);
      const adminJson = await adminRes.json();
      expect(adminJson.success).toBe(true);
      expect(adminJson.data.length).toBeGreaterThan(0);
      expect(adminJson.data[0].customer_mobile).toBe('9848011223');
    });

    it('allows admin to update payment issue status with notes', async () => {
      const issue = await globalMemoryDb.createPaymentIssue({
        customerName: 'Pooja Hegde',
        customerMobile: '9876543210',
        issueType: 'QR_NOT_SCANNING',
        description: 'Camera blur',
      });

      const patchReq = new Request(
        `http://localhost/api/v1/admin/payment-issues/${issue.id}`,
        {
          method: 'PATCH',
          headers: adminHeaders,
          body: JSON.stringify({
            status: 'RESOLVED',
            staffNotes: 'Assisted customer with cash payment at counter',
          }),
        }
      );

      const res = await handleApiRequest(patchReq, restrictedEnv);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('RESOLVED');
      expect(json.data.staff_notes).toBe(
        'Assisted customer with cash payment at counter'
      );
    });

    it('rejects payment issue submissions containing sensitive payment credentials (PIN, OTP, CVV) with 400', async () => {
      const sensitiveReq = new Request('http://localhost/api/v1/payment-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: 'NT-9988',
          customerName: 'Naive User',
          customerMobile: '9848099887',
          issueType: 'PAYMENT_APP_ERROR',
          description: 'My UPI PIN is 1234 and OTP is 987654 please check',
        }),
      });

      const res = await handleApiRequest(sensitiveReq, restrictedEnv);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('SENSITIVE_CREDENTIALS_REJECTED');
      expect(json.error.message).toContain('Never share UPI PINs');
    });

    it('rejects payment support issues from arbitrary public visitors when public payment collection is disabled with 403', async () => {
      const publicReq = new Request('http://localhost/api/v1/payment-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: 'NT-1234',
          customerName: 'Public Visitor',
          customerMobile: '9848011223',
          issueType: 'QR_LIMIT_REACHED',
          description: 'Payment issue attempt on public site',
        }),
      });

      const publicEnv = {
        ENVIRONMENT: 'production',
        PAYMENT_COLLECTION_ENABLED: 'false',
      };

      const res = await handleApiRequest(publicReq, publicEnv);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('PAYMENT_COLLECTION_DISABLED');
      expect(json.error.message).toContain('Payment support ticket submission is unavailable');
    });
  });

  describe('Customer Directory and Order Linking', () => {
    it('creates customer record on order submission and tracks order history', async () => {
      const orderReq = new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Vijay Devarakonda',
            mobileNumber: '9988776655',
            fulfilmentPreference: 'COUNTER_PICKUP',
            ageConfirmed: true,
          },
          items: [{ variantId: 'var_bijli_60', quantity: 2 }],
        }),
      });

      const orderRes = await handleApiRequest(orderReq, restrictedEnv);
      expect(orderRes.status).toBe(201);

      // Check customer list in admin
      const custListReq = new Request('http://localhost/api/v1/admin/customers', {
        method: 'GET',
        headers: adminHeaders,
      });
      const custListRes = await handleApiRequest(custListReq, restrictedEnv);
      const custListJson = await custListRes.json();
      expect(custListJson.success).toBe(true);

      const cust = custListJson.data.find(
        (c: any) => c.mobile_number === '9988776655'
      );
      expect(cust).toBeDefined();
      expect(cust.full_name).toBe('Vijay Devarakonda');
      expect(cust.total_orders).toBe(1);
      expect(cust.lifetime_spent_paise).toBe(12000); // 2 * 60 = ₹120

      // Check customer detail endpoint
      const custDetailReq = new Request(
        `http://localhost/api/v1/admin/customers/${cust.id}`,
        {
          method: 'GET',
          headers: adminHeaders,
        }
      );
      const custDetailRes = await handleApiRequest(custDetailReq, restrictedEnv);
      const custDetailJson = await custDetailRes.json();
      expect(custDetailJson.success).toBe(true);
      expect(custDetailJson.data.customer.full_name).toBe('Vijay Devarakonda');
      expect(custDetailJson.data.orders.length).toBe(1);
    });
  });

  describe('Sales Reports and CSV Export', () => {
    it('generates sales report distinguishing gross order value from verified funds', async () => {
      // Place an order
      await handleApiRequest(
        new Request('http://localhost/api/v1/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              fullName: 'Samantha Ruth',
              mobileNumber: '9123456780',
              fulfilmentPreference: 'COUNTER_PICKUP',
              ageConfirmed: true,
            },
            items: [{ variantId: 'var_bijli_60', quantity: 4 }],
          }),
        }),
        restrictedEnv
      );

      const reportReq = new Request(
        'http://localhost/api/v1/admin/reports/sales?range=today',
        {
          method: 'GET',
          headers: adminHeaders,
        }
      );

      const reportRes = await handleApiRequest(reportReq, restrictedEnv);
      expect(reportRes.status).toBe(200);

      const reportJson = await reportRes.json();
      expect(reportJson.success).toBe(true);
      expect(reportJson.data.summary.totalOrders).toBeGreaterThanOrEqual(1);
      expect(reportJson.data.summary.totalGrossOrderPaise).toBe(24000); // 4 * ₹60 = ₹240
      expect(reportJson.data.summary.totalVerifiedFundsPaise).toBe(0); // ZERO hallucinated revenue!

      expect(Array.isArray(reportJson.data.dailyTrends)).toBe(true);
      expect(Array.isArray(reportJson.data.productBreakdown)).toBe(true);
    });

    it('exports sales report in RFC 4180 CSV format', async () => {
      const exportReq = new Request(
        'http://localhost/api/v1/admin/reports/export?range=today',
        {
          method: 'GET',
          headers: adminHeaders,
        }
      );

      const exportRes = await handleApiRequest(exportReq, restrictedEnv);
      expect(exportRes.status).toBe(200);
      expect(exportRes.headers.get('Content-Type')).toContain('text/csv');

      const csvText = await exportRes.text();
      expect(csvText).toContain('"Order Reference"');
      expect(csvText).toContain('"Customer Name"');
      expect(csvText).toContain('"Subtotal (INR)"');
      expect(csvText).toContain('"SUMMARY METRICS"');
    });
  });
});
