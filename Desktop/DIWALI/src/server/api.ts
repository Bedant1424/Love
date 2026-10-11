import { TOKEN_AMOUNT_PAISE, MIN_ORDER_SUBTOTAL_PAISE } from '../types/cart';
import { getDb } from './db';
import {
  ApiResponse,
  CreateOrderRequest,
  DbOrder,
  DbOrderItem,
  OperationalStatus,
  UpdateDemoPriceRequest,
  UpdateOrderStatusRequest,
  VerifyPaymentRequest,
} from './types';

export interface RouteContext {
  params: Record<string, string>;
  searchParams: URLSearchParams;
  request: Request;
  env?: any;
}

export async function handleApiRequest(
  request: Request,
  env?: any
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const db = getDb(env?.DB);

  const jsonResponse = <T>(data: ApiResponse<T>, status: number = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Order-Token',
      },
    });
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Order-Token',
      },
    });
  }

  try {
    // ── PUBLIC ENDPOINTS ─────────────────────────────────────────────

    // GET /api/v1/catalogue
    if (path === '/api/v1/catalogue' && method === 'GET') {
      const categories = await db.getCategories();
      return jsonResponse({
        success: true,
        data: {
          store: {
            name: 'Nagarjuna Traders',
            location: 'Sivakasi / Counter Collection',
            checkoutEnabled: false,
            isPortfolioDemo: true,
            fixedTokenAmountPaise: TOKEN_AMOUNT_PAISE,
          },
          categories,
        },
      });
    }

    // POST /api/v1/orders
    if (path === '/api/v1/orders' && method === 'POST') {
      const body = (await request.json()) as CreateOrderRequest;

      // 1. Validate customer details
      if (!body.customer?.fullName || body.customer.fullName.trim().length < 2) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_CUSTOMER_NAME',
              message: 'Full name is required (minimum 2 characters).',
            },
          },
          400
        );
      }

      const mobileClean = (body.customer?.mobileNumber || '').replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(mobileClean)) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_MOBILE_NUMBER',
              message: 'Valid 10-digit Indian mobile number is required.',
            },
          },
          400
        );
      }

      if (!body.customer?.ageConfirmed) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'AGE_VERIFICATION_REQUIRED',
              message: 'Customer must confirm they are 18 years or older.',
            },
          },
          400
        );
      }

      // 2. Validate items
      if (!body.items || body.items.length === 0) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'EMPTY_BASKET',
              message: 'At least one item is required in the demo basket.',
            },
          },
          400
        );
      }

      let subtotalPaise = 0;
      const orderItemsToCreate: Omit<DbOrderItem, 'id' | 'order_id' | 'created_at'>[] = [];

      for (const item of body.items) {
        if (!item.quantity || item.quantity <= 0 || item.quantity > 50) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'INVALID_ITEM_QUANTITY',
                message: `Quantity for variant ${item.variantId} must be between 1 and 50.`,
              },
            },
            400
          );
        }

        const variant = await db.getVariantById(item.variantId);
        if (!variant) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'VARIANT_NOT_FOUND',
                message: `Variant with ID ${item.variantId} was not found in the catalogue.`,
              },
            },
            404
          );
        }

        const pricePaise = variant.demoPricePaise ?? variant.pricePaise;
        if (pricePaise === null || pricePaise === undefined) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'UNPRICED_ITEM_IN_ORDER',
                message: `Every item in your box must have a confirmed price before proceeding to simulated payment. Item "${variant.name}" has an unconfirmed price range.`,
              },
            },
            400
          );
        }

        const lineSubtotalPaise = pricePaise * item.quantity;
        subtotalPaise += lineSubtotalPaise;

        orderItemsToCreate.push({
          product_id: variant.productId || '',
          variant_id: variant.id,
          product_name_snapshot: variant.name,
          variant_name_snapshot: variant.packInfo,
          unit_price_paise: pricePaise,
          quantity: item.quantity,
          line_subtotal_paise: lineSubtotalPaise,
        });
      }

      // 3. Minimum order gating: ₹100
      if (subtotalPaise < MIN_ORDER_SUBTOTAL_PAISE) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'SUBTOTAL_BELOW_MINIMUM',
              message:
                'Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100.',
            },
          },
          400
        );
      }

      // 4. Financial Calculations: Fixed ₹100 Token
      const tokenDuePaise = TOKEN_AMOUNT_PAISE;
      const balanceDuePaise = Math.max(0, subtotalPaise - tokenDuePaise);

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderRef = `DEMO-NT-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessToken = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `token_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;

      const orderRecord: Omit<DbOrder, 'created_at' | 'updated_at'> = {
        id: orderId,
        order_reference: orderRef,
        customer_name: body.customer.fullName.trim(),
        customer_mobile: mobileClean,
        fulfilment_preference: body.customer.fulfilmentPreference || 'COUNTER_PICKUP',
        operational_status: 'SUBMITTED',
        payment_status: 'UNPAID',
        subtotal_paise: subtotalPaise,
        token_amount_paise: tokenDuePaise,
        remaining_balance_paise: balanceDuePaise,
        access_token: accessToken,
        idempotency_key: body.idempotencyKey || null,
        customer_notes: body.customer.notes || null,
        payment_reference: null,
        is_simulated_demo: 1,
      };

      const created = await db.createOrder(orderRecord, orderItemsToCreate);

      return jsonResponse(
        {
          success: true,
          data: {
            orderReference: created.order_reference,
            accessToken: created.access_token,
            operationalStatus: created.operational_status,
            paymentStatus: created.payment_status,
            subtotalPaise: created.subtotal_paise,
            tokenDuePaise: created.token_amount_paise,
            balanceDuePaise: created.remaining_balance_paise,
            isSimulatedDemo: true,
            paymentInstructions: {
              vpa: 'nagarjunatraders@okhdfcbank',
              accountName: 'NAGARJUNA TRADERS (PORTFOLIO DEMO)',
              amountInr: '100.00',
              transactionNote: created.order_reference,
              notice:
                'Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.',
            },
          },
        },
        201
      );
    }

    // Match GET /api/v1/orders/:reference
    const orderLookupMatch = path.match(/^\/api\/v1\/orders\/([^/]+)$/);
    if (orderLookupMatch && method === 'GET') {
      const reference = orderLookupMatch[1];
      const token =
        url.searchParams.get('token') || request.headers.get('X-Order-Token') || undefined;

      const order = await db.getOrderByReference(reference, token);
      if (!order) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: `Order with reference ${reference} was not found.`,
            },
          },
          404
        );
      }

      return jsonResponse({
        success: true,
        data: order,
      });
    }

    // Match POST /api/v1/orders/:reference/payment-reference
    const utrMatch = path.match(/^\/api\/v1\/orders\/([^/]+)\/payment-reference$/);
    if (utrMatch && method === 'POST') {
      const reference = utrMatch[1];
      const token =
        url.searchParams.get('token') || request.headers.get('X-Order-Token') || undefined;
      const body = (await request.json()) as { utr: string };

      if (!body.utr || !/^\d{12}$/.test(body.utr.trim())) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_UTR_FORMAT',
              message: 'Simulated payment UTR reference must be exactly 12 numeric digits.',
            },
          },
          400
        );
      }

      const updated = await db.submitPaymentReference(reference, body.utr.trim(), token);
      return jsonResponse({
        success: true,
        data: {
          orderReference: updated.order_reference,
          paymentReference: updated.payment_reference,
          paymentStatus: updated.payment_status,
          message:
            'Simulated payment UTR submitted successfully. Awaiting administrator verification.',
        },
      });
    }

    // ── ADMIN ENDPOINTS ──────────────────────────────────────────────

    // GET /api/v1/admin/dashboard
    if (path === '/api/v1/admin/dashboard' && method === 'GET') {
      const kpis = await db.getDashboardKPIs();
      return jsonResponse({
        success: true,
        data: kpis,
      });
    }

    // GET /api/v1/admin/orders
    if (path === '/api/v1/admin/orders' && method === 'GET') {
      const opStatus = url.searchParams.get('operationalStatus') as OperationalStatus | undefined;
      const payStatus = url.searchParams.get('paymentStatus') as any;
      const search = url.searchParams.get('search') || undefined;

      const orders = await db.getOrders({
        operationalStatus: opStatus || undefined,
        paymentStatus: payStatus || undefined,
        search,
      });

      return jsonResponse({
        success: true,
        data: orders,
      });
    }

    // GET /api/v1/admin/orders/:id
    const adminOrderDetailMatch = path.match(/^\/api\/v1\/admin\/orders\/([^/]+)$/);
    if (adminOrderDetailMatch && method === 'GET') {
      const orderId = adminOrderDetailMatch[1];
      const order = await db.getOrderById(orderId);
      if (!order) {
        return jsonResponse(
          {
            success: false,
            error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' },
          },
          404
        );
      }
      return jsonResponse({
        success: true,
        data: order,
      });
    }

    // POST /api/v1/admin/orders/:id/status
    const adminStatusMatch = path.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/status$/);
    if (adminStatusMatch && method === 'POST') {
      const orderId = adminStatusMatch[1];
      const body = (await request.json()) as UpdateOrderStatusRequest;

      try {
        const updated = await db.updateOrderStatus(
          orderId,
          body.operationalStatus,
          body.operatorId || 'OP-ADMIN',
          body.notes
        );
        return jsonResponse({
          success: true,
          data: updated,
        });
      } catch (err: any) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: err.message || 'STATUS_UPDATE_FAILED',
              message:
                err.message === 'CANNOT_ADVANCE_UNPAID_ORDER'
                  ? 'Cannot advance order to READY_FOR_PICKUP or COMPLETED while token is UNPAID.'
                  : err.message,
            },
          },
          400
        );
      }
    }

    // POST /api/v1/admin/orders/:id/verify-payment
    const adminVerifyMatch = path.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/verify-payment$/);
    if (adminVerifyMatch && method === 'POST') {
      const orderId = adminVerifyMatch[1];
      const body = (await request.json()) as VerifyPaymentRequest;

      const updated = await db.verifyPayment(
        orderId,
        body.action,
        body.operatorId || 'OP-ADMIN',
        body.operatorNote
      );

      return jsonResponse({
        success: true,
        data: updated,
      });
    }

    // GET /api/v1/admin/variants
    if (path === '/api/v1/admin/variants' && method === 'GET') {
      const variants = await db.getAllVariants();
      return jsonResponse({
        success: true,
        data: variants,
      });
    }

    // POST /api/v1/admin/variants/:id/demo-price
    const adminPriceMatch = path.match(/^\/api\/v1\/admin\/variants\/([^/]+)\/demo-price$/);
    if (adminPriceMatch && method === 'POST') {
      const variantId = adminPriceMatch[1];
      const body = (await request.json()) as UpdateDemoPriceRequest;

      if (!body.newPricePaise || body.newPricePaise <= 0) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'INVALID_PRICE',
              message: 'Price must be a positive integer in paise.',
            },
          },
          400
        );
      }

      const variant = await db.getVariantById(variantId);
      if (!variant) {
        return jsonResponse(
          {
            success: false,
            error: { code: 'VARIANT_NOT_FOUND', message: 'Variant not found.' },
          },
          404
        );
      }

      // Range check
      let isOutsidePrintedRange = false;
      const min = variant.printedMinPaise;
      const max = variant.printedMaxPaise;

      if (min !== null && min !== undefined && body.newPricePaise < min) {
        isOutsidePrintedRange = true;
      }
      if (max !== null && max !== undefined && body.newPricePaise > max) {
        isOutsidePrintedRange = true;
      }

      if (isOutsidePrintedRange && !body.allowOverride) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'PRICE_OUTSIDE_PRINTED_RANGE',
              message: `Price (₹${(body.newPricePaise / 100).toFixed(
                2
              )}) is outside the printed range (${variant.printedPriceText}). To confirm an override, explicit justification is required.`,
              details: {
                printedText: variant.printedPriceText,
                minPaise: min,
                maxPaise: max,
                submittedPaise: body.newPricePaise,
              },
            },
          },
          400
        );
      }

      if (isOutsidePrintedRange && body.allowOverride && !body.reason?.trim()) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'OVERRIDE_REASON_REQUIRED',
              message: 'An audit reason must be supplied when overriding printed range boundaries.',
            },
          },
          400
        );
      }

      const updated = await db.updateVariantDemoPrice(
        variantId,
        body.newPricePaise,
        body.operatorId || 'OP-ADMIN',
        body.reason,
        isOutsidePrintedRange
      );

      return jsonResponse({
        success: true,
        data: updated,
      });
    }

    // GET /api/v1/admin/audit-logs
    if (path === '/api/v1/admin/audit-logs' && method === 'GET') {
      const logs = await db.getAuditLogs();
      return jsonResponse({
        success: true,
        data: logs,
      });
    }

    // POST /api/v1/admin/auth/login
    if (path === '/api/v1/admin/auth/login' && method === 'POST') {
      const body = (await request.json()) as { passphrase?: string };
      // Allow demo passphrase
      if (body.passphrase === 'nagarjuna-demo-2026' || body.passphrase === 'admin') {
        return jsonResponse({
          success: true,
          data: {
            token: 'demo-jwt-session-nagarjuna-admin',
            operatorId: 'OP-NAGARJUNA',
            role: 'ADMINISTRATOR',
            expiresIn: 43200,
          },
        });
      }

      return jsonResponse(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid passphrase. Demo passphrase: "nagarjuna-demo-2026" or "admin".',
          },
        },
        401
      );
    }

    // 404 Route Not Found
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: `API route ${method} ${path} not found.`,
        },
      },
      404
    );
  } catch (err: any) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err?.message || 'An unexpected server error occurred.',
        },
      },
      500
    );
  }
}
