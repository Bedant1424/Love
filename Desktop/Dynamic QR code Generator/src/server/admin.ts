import type { Context } from 'hono';
import type { Env, AppVariables } from './types';
import type {
  AdminAuditLogEntry,
  AdminCardDetail,
  AdminCardSummary,
  AdminDashboardStats,
  CreateBatchRequest,
  PaginatedResult,
  AdminBatchKeysResponse,
  AdminVaultKeyEntry,
  CardStatus,
} from '../shared/types';
import { createErrorResponse, createSuccessResponse, parsePagination } from '../shared/utils';
import { provisionCardBatch } from './provisioning';
import { decryptActivationCode } from '../shared/activation-crypto';

type AdminContext = Context<{ Bindings: Env; Variables: AppVariables }>;

interface RawCardRow {
  id: string;
  public_id: string;
  batch_id: string;
  batch_name?: string | null;
  status: 'UNACTIVATED' | 'ACTIVE' | 'DISABLED' | 'RETIRED';
  business_name: string | null;
  destination_url: string | null;
  code_rotation_counter: number;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RawAuditRow {
  id: string;
  card_id: string;
  public_id?: string | null;
  action:
    | 'CARD_CREATED'
    | 'CARD_ACTIVATED'
    | 'DESTINATION_CHANGED'
    | 'CARD_DISABLED'
    | 'CARD_RESTORED'
    | 'CARD_RETIRED'
    | 'CARD_METADATA_UPDATED';
  actor_type: 'SYSTEM' | 'PUBLIC' | 'ADMIN';
  actor_identifier: string;
  previous_state: string | null;
  new_state: string | null;
  metadata: string | null;
  created_at: string;
}

function mapCardRow(row: RawCardRow): AdminCardSummary {
  return {
    id: row.id,
    publicId: row.public_id,
    batchId: row.batch_id,
    batchName: row.batch_name ?? null,
    status: row.status,
    businessName: row.business_name,
    destinationUrl: row.destination_url,
    codeRotationCounter: row.code_rotation_counter,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditRow(row: RawAuditRow): AdminAuditLogEntry {
  return {
    id: row.id,
    cardId: row.card_id,
    publicId: row.public_id ?? null,
    action: row.action,
    actorType: row.actor_type,
    actorIdentifier: row.actor_identifier,
    actor: row.actor_identifier,
    previousState: row.previous_state,
    newState: row.new_state,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/admin/dashboard
 * High-level operational statistics
 */
export async function handleAdminDashboard(c: AdminContext) {
  try {
    const totalCardsRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cards').first<{
      count: number;
    }>();

    const statusCountsRes = await c.env.DB.prepare(
      'SELECT status, COUNT(*) as count FROM cards GROUP BY status'
    ).all<{ status: string; count: number }>();

    const totalBatchesRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM batches').first<{
      count: number;
    }>();

    const statusMap = {
      UNACTIVATED: 0,
      ACTIVE: 0,
      DISABLED: 0,
      RETIRED: 0,
    };

    if (statusCountsRes?.results) {
      for (const row of statusCountsRes.results) {
        if (row.status in statusMap) {
          statusMap[row.status as keyof typeof statusMap] = row.count;
        }
      }
    }

    const stats: AdminDashboardStats = {
      totalCards: totalCardsRes?.count ?? 0,
      activeCards: statusMap.ACTIVE,
      unactivatedCards: statusMap.UNACTIVATED,
      disabledCards: statusMap.DISABLED,
      retiredCards: statusMap.RETIRED,
      cardsByStatus: statusMap,
      totalBatches: totalBatchesRes?.count ?? 0,
      adminEmail: c.get('adminEmail') ?? undefined,
    };

    return c.json(createSuccessResponse(stats), 200);
  } catch (error) {
    console.error('[Admin Dashboard Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve dashboard stats'), 500);
  }
}

/**
 * GET /api/admin/cards
 * Paginated card list with bounded filtering
 */
export async function handleAdminListCards(c: AdminContext) {
  const query = c.req.query();
  const { page, limit, offset } = parsePagination(query.page, query.limit, 20, 100);

  const status = query.status?.trim().toUpperCase();
  const batchId = query.batchId?.trim();
  const search = (query.search || query.q)?.trim();

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (status && ['UNACTIVATED', 'ACTIVE', 'DISABLED', 'RETIRED'].includes(status)) {
    whereClauses.push('c.status = ?');
    params.push(status);
  }

  if (batchId) {
    whereClauses.push('c.batch_id = ?');
    params.push(batchId);
  }

  if (search) {
    whereClauses.push('(c.public_id LIKE ? OR c.business_name LIKE ?)');
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    // Count total matching
    const countSql = `SELECT COUNT(*) as count FROM cards c ${whereSql}`;
    const countStmt = c.env.DB.prepare(countSql);
    const countResult = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{
      count: number;
    }>();
    const total = countResult?.count ?? 0;

    // Fetch page items
    const querySql = `
      SELECT c.id, c.public_id, c.batch_id, c.status, c.business_name, c.destination_url,
             c.code_rotation_counter, c.activated_at, c.created_at, c.updated_at,
             b.name as batch_name
      FROM cards c
      LEFT JOIN batches b ON c.batch_id = b.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limit, offset];
    const rows = await c.env.DB.prepare(querySql)
      .bind(...queryParams)
      .all<RawCardRow>();

    const items = (rows.results ?? []).map(mapCardRow);

    const result: PaginatedResult<AdminCardSummary> = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };

    return c.json(createSuccessResponse(result), 200);
  } catch (error) {
    console.error('[Admin List Cards Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve cards'), 500);
  }
}

/**
 * GET /api/admin/cards/:id
 * Card detail with audit trail
 */
export async function handleAdminGetCard(c: AdminContext) {
  const cardIdOrPublicId = c.req.param('id');

  try {
    const card = await c.env.DB.prepare(
      `SELECT c.id, c.public_id, c.batch_id, c.status, c.business_name, c.destination_url,
                c.code_rotation_counter, c.activated_at, c.created_at, c.updated_at,
                b.name as batch_name
         FROM cards c
         LEFT JOIN batches b ON c.batch_id = b.id
         WHERE c.id = ? OR c.public_id = ?`
    )
      .bind(cardIdOrPublicId, cardIdOrPublicId)
      .first<RawCardRow>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    // Fetch audit timeline
    const auditRows = await c.env.DB.prepare(
      `SELECT a.id, a.card_id, a.action, a.actor_type, a.actor_identifier,
                a.previous_state, a.new_state, a.metadata, a.created_at,
                c.public_id as public_id
         FROM audit_logs a
         LEFT JOIN cards c ON a.card_id = c.id
         WHERE a.card_id = ?
         ORDER BY a.created_at DESC
         LIMIT 50`
    )
      .bind(card.id)
      .all<RawAuditRow>();

    const detail: AdminCardDetail = {
      ...mapCardRow(card),
      auditLogs: (auditRows.results ?? []).map(mapAuditRow),
    };

    return c.json(createSuccessResponse(detail), 200);
  } catch (error) {
    console.error('[Admin Get Card Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve card details'), 500);
  }
}

/**
 * POST /api/admin/batches
 * Provisions a new card batch with one-time raw activation codes
 */
export async function handleAdminCreateBatch(c: AdminContext) {
  let body: Partial<CreateBatchRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(createErrorResponse('INVALID_BODY', 'Invalid JSON body'), 400);
  }

  const { name, notes } = body;
  const rawCount = body.cardCount ?? (body as unknown as { count?: unknown }).count;
  const cardCount = typeof rawCount === 'number' ? rawCount : parseInt(String(rawCount), 10);

  if (!name || typeof name !== 'string') {
    return c.json(createErrorResponse('INVALID_NAME', 'Batch name is required'), 400);
  }
  if (isNaN(cardCount) || cardCount < 1) {
    return c.json(createErrorResponse('INVALID_CARD_COUNT', 'Card count must be >= 1'), 400);
  }

  const secret = c.env.ACTIVATION_SECRET;
  if (!secret) {
    return c.json(
      createErrorResponse('CONFIGURATION_ERROR', 'ACTIVATION_SECRET not configured'),
      500
    );
  }

  const encryptionSecret = c.env.ACTIVATION_ENCRYPTION_KEY || secret;
  const adminEmail = c.get('adminEmail') ?? 'admin@system';
  const url = new URL(c.req.url);
  const originUrl = `${url.protocol}//${url.host}`;

  try {
    const result = await provisionCardBatch(
      c.env.DB,
      secret,
      { name, cardCount, notes },
      adminEmail,
      originUrl,
      encryptionSecret
    );

    return c.json(createSuccessResponse(result), 201);
  } catch (error) {
    console.error('[Admin Create Batch Error]', error instanceof Error ? error.message : error);
    return c.json(
      createErrorResponse(
        'PROVISIONING_FAILED',
        error instanceof Error ? error.message : 'Batch creation failed'
      ),
      400
    );
  }
}

/**
 * GET /api/admin/batches
 * List batches
 */
export async function handleAdminListBatches(c: AdminContext) {
  const query = c.req.query();
  const { page, limit, offset } = parsePagination(query.page, query.limit, 20, 100);

  try {
    const countRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM batches').first<{
      count: number;
    }>();
    const total = countRes?.count ?? 0;

    const rows = await c.env.DB.prepare(
      'SELECT id, name, card_count, notes, created_at FROM batches ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
      .bind(limit, offset)
      .all<{
        id: string;
        name: string;
        card_count: number;
        notes: string | null;
        created_at: string;
      }>();

    const items = (rows.results ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      cardCount: b.card_count,
      notes: b.notes,
      createdAt: b.created_at,
    }));

    return c.json(
      createSuccessResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }),
      200
    );
  } catch (error) {
    console.error('[Admin List Batches Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve batches'), 500);
  }
}

/**
 * POST /api/admin/cards/:id/disable
 * Atomic state transition: ACTIVE -> DISABLED
 */
export async function handleAdminDisableCard(c: AdminContext) {
  const cardIdOrPublicId = c.req.param('id');
  const adminEmail = c.get('adminEmail') ?? 'admin@system';
  const nowIso = new Date().toISOString();

  try {
    // 1. Fetch card id and status
    const card = await c.env.DB.prepare(
      'SELECT id, status FROM cards WHERE id = ? OR public_id = ?'
    )
      .bind(cardIdOrPublicId, cardIdOrPublicId)
      .first<{ id: string; status: string }>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    if (card.status !== 'ACTIVE') {
      return c.json(
        createErrorResponse(
          'INVALID_STATE',
          `Only ACTIVE cards can be disabled (current: ${card.status})`
        ),
        400
      );
    }

    // 2. Atomic conditional update
    const res = await c.env.DB.prepare(
      "UPDATE cards SET status = 'DISABLED', updated_at = ? WHERE id = ? AND status = 'ACTIVE'"
    )
      .bind(nowIso, card.id)
      .run();

    if (res.meta.changes !== 1) {
      return c.json(createErrorResponse('CONFLICT', 'Card state changed concurrently'), 409);
    }

    // 3. Immutable audit log
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, card_id, action, actor_type, actor_identifier, previous_state, new_state, created_at)
         VALUES (?, ?, 'CARD_DISABLED', 'ADMIN', ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        card.id,
        adminEmail,
        JSON.stringify({ status: 'ACTIVE' }),
        JSON.stringify({ status: 'DISABLED' }),
        nowIso
      )
      .run();

    return c.json(
      createSuccessResponse({ id: card.id, status: 'DISABLED', updatedAt: nowIso }),
      200
    );
  } catch (error) {
    console.error('[Admin Disable Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to disable card'), 500);
  }
}

/**
 * POST /api/admin/cards/:id/restore
 * Atomic state transition: DISABLED -> ACTIVE
 */
export async function handleAdminRestoreCard(c: AdminContext) {
  const cardIdOrPublicId = c.req.param('id');
  const adminEmail = c.get('adminEmail') ?? 'admin@system';
  const nowIso = new Date().toISOString();

  try {
    const card = await c.env.DB.prepare(
      'SELECT id, status FROM cards WHERE id = ? OR public_id = ?'
    )
      .bind(cardIdOrPublicId, cardIdOrPublicId)
      .first<{ id: string; status: string }>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    if (card.status !== 'DISABLED') {
      return c.json(
        createErrorResponse(
          'INVALID_STATE',
          `Only DISABLED cards can be restored (current: ${card.status})`
        ),
        400
      );
    }

    // Atomic conditional update
    const res = await c.env.DB.prepare(
      "UPDATE cards SET status = 'ACTIVE', updated_at = ? WHERE id = ? AND status = 'DISABLED'"
    )
      .bind(nowIso, card.id)
      .run();

    if (res.meta.changes !== 1) {
      return c.json(createErrorResponse('CONFLICT', 'Card state changed concurrently'), 409);
    }

    // Immutable audit log
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, card_id, action, actor_type, actor_identifier, previous_state, new_state, created_at)
         VALUES (?, ?, 'CARD_RESTORED', 'ADMIN', ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        card.id,
        adminEmail,
        JSON.stringify({ status: 'DISABLED' }),
        JSON.stringify({ status: 'ACTIVE' }),
        nowIso
      )
      .run();

    return c.json(createSuccessResponse({ id: card.id, status: 'ACTIVE', updatedAt: nowIso }), 200);
  } catch (error) {
    console.error('[Admin Restore Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to restore card'), 500);
  }
}

/**
 * POST /api/admin/cards/:id/retire
 * Atomic irreversible state transition: * -> RETIRED
 */
export async function handleAdminRetireCard(c: AdminContext) {
  const cardIdOrPublicId = c.req.param('id');
  const adminEmail = c.get('adminEmail') ?? 'admin@system';
  const nowIso = new Date().toISOString();

  try {
    const card = await c.env.DB.prepare(
      'SELECT id, status FROM cards WHERE id = ? OR public_id = ?'
    )
      .bind(cardIdOrPublicId, cardIdOrPublicId)
      .first<{ id: string; status: string }>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    if (card.status === 'RETIRED') {
      return c.json(
        createErrorResponse('INVALID_STATE', 'Card is already permanently retired'),
        400
      );
    }

    // Atomic conditional update: status != 'RETIRED'
    const res = await c.env.DB.prepare(
      "UPDATE cards SET status = 'RETIRED', updated_at = ? WHERE id = ? AND status != 'RETIRED'"
    )
      .bind(nowIso, card.id)
      .run();

    if (res.meta.changes !== 1) {
      return c.json(createErrorResponse('CONFLICT', 'Card state changed concurrently'), 409);
    }

    // Immutable audit log
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, card_id, action, actor_type, actor_identifier, previous_state, new_state, created_at)
         VALUES (?, ?, 'CARD_RETIRED', 'ADMIN', ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        card.id,
        adminEmail,
        JSON.stringify({ status: card.status }),
        JSON.stringify({ status: 'RETIRED' }),
        nowIso
      )
      .run();

    return c.json(
      createSuccessResponse({ id: card.id, status: 'RETIRED', updatedAt: nowIso }),
      200
    );
  } catch (error) {
    console.error('[Admin Retire Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retire card'), 500);
  }
}

/**
 * PATCH /api/admin/cards/:id
 * Updates non-routing card metadata (business_name only).
 * Google Review destination, status, and public routing identifiers are strictly immutable.
 */
export async function handleAdminUpdateCard(c: AdminContext) {
  const cardIdOrPublicId = c.req.param('id');
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(createErrorResponse('INVALID_BODY', 'Invalid JSON body'), 400);
  }

  // Strict Invariant: Reject any attempt to mutate destination_url
  if ('destinationUrl' in body || 'destination_url' in body) {
    return c.json(
      createErrorResponse(
        'DESTINATION_LOCKED',
        'Google Review destinations are permanently locked and cannot be modified.'
      ),
      400
    );
  }

  // Strict Invariant: Reject attempts to mutate status, publicId, or database id via metadata edit
  if ('status' in body || 'publicId' in body || 'public_id' in body || 'id' in body) {
    return c.json(
      createErrorResponse(
        'FORBIDDEN_MUTATION',
        'Card status and routing identifiers cannot be modified via metadata edit.'
      ),
      400
    );
  }

  const adminEmail = c.get('adminEmail') ?? 'admin@system';
  const nowIso = new Date().toISOString();

  try {
    const card = await c.env.DB.prepare(
      'SELECT id, public_id, status, business_name, destination_url FROM cards WHERE id = ? OR public_id = ?'
    )
      .bind(cardIdOrPublicId, cardIdOrPublicId)
      .first<RawCardRow>();

    if (!card) {
      return c.json(createErrorResponse('NOT_FOUND', 'Card not found'), 404);
    }

    if (card.status === 'RETIRED') {
      return c.json(createErrorResponse('INVALID_STATE', 'Retired cards cannot be modified'), 400);
    }

    const rawBusinessName =
      body.businessName !== undefined ? body.businessName : body.business_name;
    let businessName: string | null = null;
    if (typeof rawBusinessName === 'string') {
      const trimmed = rawBusinessName.trim();
      businessName = trimmed.length > 0 ? trimmed.slice(0, 100) : null;
    } else if (rawBusinessName === null) {
      businessName = null;
    } else {
      return c.json(
        createErrorResponse('INVALID_PARAM', 'Business name must be a string or null'),
        400
      );
    }

    await c.env.DB.prepare('UPDATE cards SET business_name = ?, updated_at = ? WHERE id = ?')
      .bind(businessName, nowIso, card.id)
      .run();

    // Immutable audit log
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, card_id, action, actor_type, actor_identifier, previous_state, new_state, metadata, created_at)
         VALUES (?, ?, 'CARD_METADATA_UPDATED', 'ADMIN', ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        card.id,
        adminEmail,
        JSON.stringify({ businessName: card.business_name }),
        JSON.stringify({ businessName }),
        JSON.stringify({ field: 'business_name' }),
        nowIso
      )
      .run();

    return c.json(
      createSuccessResponse({
        id: card.id,
        publicId: card.public_id,
        businessName,
        status: card.status,
        updatedAt: nowIso,
      }),
      200
    );
  } catch (error) {
    console.error('[Admin Update Card Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to update card metadata'), 500);
  }
}

/**
 * GET /api/admin/audit
 * List global audit log entries
 */
export async function handleAdminListAuditLogs(c: AdminContext) {
  const query = c.req.query();
  const { page, limit, offset } = parsePagination(query.page, query.limit, 20, 100);

  const cardId = query.cardId?.trim();
  const action = query.action?.trim().toUpperCase();

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (cardId) {
    whereClauses.push('a.card_id = ?');
    params.push(cardId);
  }
  if (action) {
    whereClauses.push('a.action = ?');
    params.push(action);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const countSql = `SELECT COUNT(*) as count FROM audit_logs a ${whereSql}`;
    const countStmt = c.env.DB.prepare(countSql);
    const countRes = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{
      count: number;
    }>();
    const total = countRes?.count ?? 0;

    const querySql = `
      SELECT a.id, a.card_id, a.action, a.actor_type, a.actor_identifier,
             a.previous_state, a.new_state, a.metadata, a.created_at,
             c.public_id as public_id
      FROM audit_logs a
      LEFT JOIN cards c ON a.card_id = c.id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await c.env.DB.prepare(querySql)
      .bind(...params, limit, offset)
      .all<RawAuditRow>();

    const items = (rows.results ?? []).map(mapAuditRow);

    return c.json(
      createSuccessResponse({
        items,
        pagination: {
          page,
          limit,
          total,
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      }),
      200
    );
  } catch (error) {
    console.error('[Admin List Audit Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve audit logs'), 500);
  }
}

/**
 * GET /api/admin/batches/:id/keys
 * Retrieves decrypted activation keys for all cards in a specified batch.
 * Strictly protected by Cloudflare Access Zero Trust authentication.
 * Decrypts only inside authenticated admin request; never logs decrypted keys or writes them to audit trail.
 */
export async function handleAdminGetBatchKeys(c: AdminContext) {
  const batchId = c.req.param('id');
  const secret = c.env.ACTIVATION_ENCRYPTION_KEY || c.env.ACTIVATION_SECRET;

  if (!secret) {
    return c.json(
      createErrorResponse('CONFIGURATION_ERROR', 'Encryption secret not configured'),
      500
    );
  }

  try {
    const batch = await c.env.DB.prepare('SELECT id, name, card_count FROM batches WHERE id = ?')
      .bind(batchId)
      .first<{ id: string; name: string; card_count: number }>();

    if (!batch) {
      return c.json(createErrorResponse('NOT_FOUND', 'Batch not found'), 404);
    }

    const cardsRes = await c.env.DB.prepare(
      `SELECT public_id, status, encrypted_activation_code, created_at
       FROM cards
       WHERE batch_id = ?
       ORDER BY created_at ASC`
    )
      .bind(batchId)
      .all<{
        public_id: string;
        status: CardStatus;
        encrypted_activation_code: string | null;
        created_at: string;
      }>();

    const keys: AdminVaultKeyEntry[] = [];
    for (const card of cardsRes.results ?? []) {
      let code = '[Not vaulted]';
      if (card.encrypted_activation_code) {
        try {
          code = await decryptActivationCode(card.encrypted_activation_code, secret);
        } catch {
          code = '[Decryption error]';
        }
      }
      keys.push({
        publicId: card.public_id,
        status: card.status,
        activationCode: code,
        batchName: batch.name,
      });
    }

    const response: AdminBatchKeysResponse = {
      batchId: batch.id,
      batchName: batch.name,
      cardCount: batch.card_count,
      keys,
    };

    return c.json(createSuccessResponse(response), 200);
  } catch (error) {
    console.error('[Admin Batch Keys Error]', error instanceof Error ? error.message : error);
    return c.json(createErrorResponse('SERVER_ERROR', 'Failed to retrieve batch keys'), 500);
  }
}
