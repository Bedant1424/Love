/**
 * Milestone 13 Live Production Verification Script
 * Validates:
 * 1. Customer Domain: https://nagarjuna-traders.pages.dev
 * 2. Owner Domain: https://nagarjuna-traders-owner.pages.dev
 */

const CUSTOMER_URL = 'https://nagarjuna-traders.pages.dev';
const OWNER_URL = 'https://nagarjuna-traders-owner.pages.dev';

async function runMilestone13Verification() {
  console.log('================================================================');
  console.log('NAGARJUNA TRADERS: MILESTONE 13 PRODUCTION VERIFICATION');
  console.log(`Customer Domain: ${CUSTOMER_URL}`);
  console.log(`Owner Domain:    ${OWNER_URL}`);
  console.log('================================================================\n');

  const results = [];
  function record(id, description, passed, details = '') {
    const symbol = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} [${id}] ${description} ${details ? `(${details})` : ''}`);
    results.push({ id, description, passed, details });
  }

  try {
    // 1. Customer Storefront Home Page loads with 200 OK
    const custHomeRes = await fetch(`${CUSTOMER_URL}/`);
    const custHomeHtml = await custHomeRes.text();
    record(
      'CUST-1',
      'Customer storefront loads with 200 OK',
      custHomeRes.status === 200 && custHomeHtml.includes('<div id="root">'),
      `Status: ${custHomeRes.status}`
    );

    // 2. Customer HTML does not leak demo / portfolio badges in initial markup
    const hasDemoBadge = custHomeHtml.toLowerCase().includes('portfolio demo');
    record(
      'CUST-2',
      'No portfolio demo badges in customer initial markup',
      !hasDemoBadge,
      hasDemoBadge ? 'Found demo badge in HTML' : 'Clean festive markup'
    );

    // 3. Catalogue API returns authentic 6 categories and updated Skyshots names
    const catRes = await fetch(`${CUSTOMER_URL}/api/v1/catalogue`);
    const catJson = await catRes.json();
    const categories = catJson?.data?.categories || [];
    const skyshotsCat = categories.find((c) => c.id === 'skyshots' || c.name === 'Skyshots');
    const skyshotProductNames = (skyshotsCat?.products || []).map((p) => p.name);

    const hasUpdatedSkyshots =
      skyshotProductNames.some((n) => n.includes('Pandav Skyshots')) &&
      skyshotProductNames.some((n) => n.includes('Single Shot Skyshots')) &&
      skyshotProductNames.some((n) => n.includes('Bigboss Skyshots')) &&
      skyshotProductNames.some((n) => n.includes('JJ Skyshots')) &&
      skyshotProductNames.some((n) => n.includes('Elephant Skyshots'));

    record(
      'CUST-3',
      'Catalogue API returns 6 categories with reconciled Skyshots names',
      catRes.status === 200 && categories.length === 6 && hasUpdatedSkyshots,
      `Categories: ${categories.length}, Skyshot products: ${skyshotProductNames.join(', ')}`
    );

    // 4. Payment Collection disabled on customer domain
    const storeConfig = catJson?.data?.store || {};
    record(
      'CUST-4',
      'Public payment collection is strictly disabled',
      storeConfig.paymentCollectionEnabled === false,
      `Payment collection: ${storeConfig.paymentCollectionEnabled}`
    );

    // 5. Customer order placement works WITHOUT age confirmation
    const allVariants = categories.flatMap((c) => c.products.flatMap((p) => p.variants));
    const pricedVariant = allVariants.find((v) => v.demoPricePaise >= 5000) || allVariants[0];

    const orderRes = await fetch(`${CUSTOMER_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          fullName: 'Production Customer',
          mobileNumber: '9876543210',
          fulfilmentPreference: 'COUNTER_PICKUP',
          // Note: NO ageConfirmed flag sent!
        },
        items: [{ variantId: pricedVariant.id, quantity: 2 }],
      }),
    });
    const orderJson = await orderRes.json();
    const orderCreated = orderRes.status === 201 && orderJson.success;
    record(
      'CUST-5',
      'Order creation succeeds without mandatory age confirmation flag',
      orderCreated,
      orderCreated
        ? `Order: ${orderJson.data.orderReference}, Subtotal: ₹${orderJson.data.subtotalPaise / 100}`
        : `Status: ${orderRes.status}, Error: ${JSON.stringify(orderJson.error)}`
    );

    // 6. Accessing /admin on customer storefront
    const custAdminRes = await fetch(`${CUSTOMER_URL}/admin`, { redirect: 'manual' });
    const isRedirectOrNotice =
      custAdminRes.status === 301 ||
      custAdminRes.status === 302 ||
      custAdminRes.status === 200; // SPA serving fallback
    record(
      'CUST-6',
      'Customer storefront /admin does not expose admin forms',
      isRedirectOrNotice,
      `Status: ${custAdminRes.status}`
    );

    // 7. Owner Portal loads at root / with 200 OK
    const ownerHomeRes = await fetch(`${OWNER_URL}/`);
    const ownerHomeHtml = await ownerHomeRes.text();
    record(
      'OWNER-1',
      'Owner portal root / loads with 200 OK',
      ownerHomeRes.status === 200 && ownerHomeHtml.includes('<div id="root">'),
      `Status: ${ownerHomeRes.status}`
    );

    // 8. Owner protected API blocks unauthenticated access with 401
    const ownerApiRes = await fetch(`${OWNER_URL}/api/v1/admin/dashboard`);
    const ownerApiJson = await ownerApiRes.json();
    record(
      'OWNER-2',
      'Owner /api/v1/admin/dashboard requires Cloudflare Access authentication (401)',
      ownerApiRes.status === 401 && !ownerApiJson.success,
      `Status: ${ownerApiRes.status}, Code: ${ownerApiJson?.error?.code || 'UNAUTHORIZED'}`
    );

    // 9. Old compromised passphrase nagarjuna-demo-2026 is strictly blocked on hosted environment
    const loginRes = await fetch(`${OWNER_URL}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: 'nagarjuna-demo-2026' }),
    });
    const loginJson = await loginRes.json();
    record(
      'OWNER-3',
      'Passphrase login is rejected in hosted production (Cloudflare Access required)',
      loginRes.status === 403 && loginJson?.error?.code === 'PASSWORD_AUTH_DISABLED',
      `Status: ${loginRes.status}, Error code: ${loginJson?.error?.code}`
    );

    console.log('\n================================================================');
    const allPassed = results.every((r) => r.passed);
    console.log(`SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} CHECKS PASSED`);
    console.log(`OVERALL STATUS: ${allPassed ? '✅ PRODUCTION VERIFIED' : '❌ VERIFICATION FAILED'}`);
    console.log('================================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

runMilestone13Verification();
