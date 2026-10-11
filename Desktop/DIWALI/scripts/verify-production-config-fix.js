/**
 * NAGARJUNA TRADERS: Production Configuration Fix Verification Script
 * Validates:
 * 1. Production environment detection (isRestrictedEnv: false, paymentCollectionEnabled: false)
 * 2. Total absence of test fixtures, test VPA, test account name, test QR payload in public responses
 * 3. Inability to trigger test mode via headers (X-Restricted-Test-Mode) or query parameters (?test=true)
 * 4. UTR submission strictly disabled (403 PAYMENT_COLLECTION_DISABLED)
 * 5. Payment support ticket submission disabled (403 PAYMENT_COLLECTION_DISABLED)
 * 6. Order creation paymentInstructions clean and free of test fixtures
 * 7. Cloudflare Access Zero Trust protections active on both customer and owner admin routes
 */

const CUSTOMER_URL = 'https://nagarjuna-traders.pages.dev';
const OWNER_URL = 'https://nagarjuna-traders-owner.pages.dev';

async function runVerification() {
  console.log('================================================================');
  console.log('NAGARJUNA TRADERS: PRODUCTION CONFIGURATION FIX VERIFICATION');
  console.log(`Customer URL: ${CUSTOMER_URL}`);
  console.log(`Owner URL:    ${OWNER_URL}`);
  console.log('================================================================\n');

  let passedAll = true;
  function assertCheck(id, desc, pass, details = '') {
    const symbol = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} [${id}] ${desc} ${details ? `(${details})` : ''}`);
    if (!pass) passedAll = false;
  }

  // 1. Production /api/v1/payment-config check
  const payConfigRes = await fetch(`${CUSTOMER_URL}/api/v1/payment-config`);
  const payConfigJson = await payConfigRes.json();
  const d = payConfigJson?.data || {};

  assertCheck(
    'PAYCFG-1',
    'paymentCollectionEnabled is false',
    d.paymentCollectionEnabled === false,
    `Value: ${d.paymentCollectionEnabled}`
  );

  assertCheck(
    'PAYCFG-2',
    'isRestrictedEnv is false',
    d.isRestrictedEnv === false,
    `Value: ${d.isRestrictedEnv}`
  );

  assertCheck(
    'PAYCFG-3',
    'No test VPA present in response',
    d.vpa === undefined,
    `VPA: ${d.vpa}`
  );

  assertCheck(
    'PAYCFG-4',
    'No test account name present in response',
    d.accountName === undefined,
    `Account Name: ${d.accountName}`
  );

  assertCheck(
    'PAYCFG-5',
    'No test QR payload present in response',
    d.qrPayload === undefined && d.qrImageUrl === undefined,
    `QR Payload: ${d.qrPayload}`
  );

  assertCheck(
    'PAYCFG-6',
    'No testFixture object exposed in response',
    d.testFixture === undefined,
    `testFixture: ${JSON.stringify(d.testFixture)}`
  );

  assertCheck(
    'PAYCFG-7',
    'Plain unavailable message returned',
    d.message === 'Payment instructions are currently unavailable.',
    `Message: "${d.message}"`
  );

  // 2. Spoof attempt via header and query param
  const spoofRes = await fetch(
    `${CUSTOMER_URL}/api/v1/payment-config?test=true&restricted=true`,
    {
      headers: {
        'X-Restricted-Test-Mode': 'true',
        'X-Test-Mode': 'true',
      },
    }
  );
  const spoofJson = await spoofRes.json();
  const spoofData = spoofJson?.data || {};

  assertCheck(
    'SPOOF-1',
    'Header/param cannot activate restricted mode',
    spoofData.isRestrictedEnv === false && spoofData.testFixture === undefined,
    `isRestrictedEnv: ${spoofData.isRestrictedEnv}, testFixture: ${spoofData.testFixture}`
  );

  // 3. Blocked UTR submission
  const utrRes = await fetch(`${CUSTOMER_URL}/api/v1/orders/NT-9999/utr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Order-Token': 'random-token',
    },
    body: JSON.stringify({ utr: '123456789012' }),
  });
  const utrJson = await utrRes.json();

  assertCheck(
    'UTR-1',
    'UTR submission blocked with 403 PAYMENT_COLLECTION_DISABLED',
    utrRes.status === 403 && utrJson?.error?.code === 'PAYMENT_COLLECTION_DISABLED',
    `Status: ${utrRes.status}, Error Code: ${utrJson?.error?.code}`
  );

  // 4. Payment support tickets blocked
  const issueRes = await fetch(`${CUSTOMER_URL}/api/v1/payment-issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerName: 'Test Customer',
      customerMobile: '9876543210',
      issueType: 'OTHER',
      description: 'Support test',
    }),
  });
  const issueJson = await issueRes.json();

  assertCheck(
    'ISSUE-1',
    'Payment issue submission blocked with 403 PAYMENT_COLLECTION_DISABLED',
    issueRes.status === 403 && issueJson?.error?.code === 'PAYMENT_COLLECTION_DISABLED',
    `Status: ${issueRes.status}, Error Code: ${issueJson?.error?.code}`
  );

  // 5. Order creation paymentInstructions clean
  const orderRes = await fetch(`${CUSTOMER_URL}/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: {
        fullName: 'Production Customer',
        mobileNumber: '9876543210',
        fulfilmentPreference: 'COUNTER_PICKUP',
      },
      items: [
        {
          variantId: 'var_bijli_50',
          quantity: 2,
        },
      ],
    }),
  });
  const orderJson = await orderRes.json();
  const orderInst = orderJson?.data?.paymentInstructions || {};

  assertCheck(
    'ORDER-1',
    'Order creation paymentInstructions has paymentCollectionEnabled: false',
    orderInst.paymentCollectionEnabled === false,
    `Value: ${orderInst.paymentCollectionEnabled}`
  );

  assertCheck(
    'ORDER-2',
    'Order creation paymentInstructions does not expose test VPA or fixtures',
    orderInst.vpa === undefined && orderInst.accountName === undefined && orderInst.testFixture === undefined,
    `VPA: ${orderInst.vpa}, Account: ${orderInst.accountName}`
  );

  // 6. Admin endpoint protections
  const custAdminRes = await fetch(`${CUSTOMER_URL}/api/v1/admin/dashboard`);
  assertCheck(
    'ADMIN-1',
    'Customer /api/v1/admin/dashboard protected by Cloudflare Access (401)',
    custAdminRes.status === 401,
    `Status: ${custAdminRes.status}`
  );

  const ownerAdminRes = await fetch(`${OWNER_URL}/api/v1/admin/dashboard`);
  assertCheck(
    'ADMIN-2',
    'Owner /api/v1/admin/dashboard protected by Cloudflare Access (401)',
    ownerAdminRes.status === 401,
    `Status: ${ownerAdminRes.status}`
  );

  // 7. Owner portal payment config
  const ownerConfigRes = await fetch(`${OWNER_URL}/api/v1/payment-config`);
  const ownerConfigJson = await ownerConfigRes.json();
  const od = ownerConfigJson?.data || {};

  assertCheck(
    'OWNER-PAYCFG',
    'Owner portal payment-config returns isRestrictedEnv: false with no test fixtures',
    od.isRestrictedEnv === false && od.testFixture === undefined && od.vpa === undefined,
    `isRestrictedEnv: ${od.isRestrictedEnv}`
  );

  console.log('\n================================================================');
  if (passedAll) {
    console.log('RESULT: ALL 13 PRODUCTION CONFIGURATION CHECKS PASSED ✅');
  } else {
    console.log('RESULT: SOME CHECKS FAILED ❌');
    process.exit(1);
  }
  console.log('================================================================');
}

runVerification().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
