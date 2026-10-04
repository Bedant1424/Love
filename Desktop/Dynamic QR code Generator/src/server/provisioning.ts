import type { D1Database } from '@cloudflare/workers-types/2023-07-01';
import type {
  AdminBatchSummary,
  CreateBatchRequest,
  CreateBatchResponse,
  ProvisionedCard,
} from '../shared/types';
import { generateRandomPublicId, PUBLIC_ID_LENGTH } from '../shared/public-id';
import {
  generateActivationCode,
  hashActivationCode,
  encryptActivationCode,
} from '../shared/activation-crypto';
import { CANONICAL_PUBLIC_ORIGIN } from '../shared/url';

export interface CardInsertData {
  id: string;
  publicId: string;
  rawActivationCode: string;
  codeHash: string;
  encryptedActivationCode: string;
  nfcUrl: string;
}

/**
 * Maximum number of bounded retries when a unique constraint collision is encountered.
 */
export const MAX_COLLISION_RETRIES = 5;

/**
 * Provisions a new manufacturing batch of review cards.
 * Generates unique non-sequential 16-character Crockford Base32 public IDs and secure activation codes.
 * Stores exclusively HMAC-SHA256 digests in Cloudflare D1.
 * Returns raw codes strictly once for supplier manifest fulfillment.
 * Includes bounded collision retry if database unique constraint triggers.
 */
export async function provisionCardBatch(
  db: D1Database,
  secret: string,
  request: CreateBatchRequest,
  adminEmail: string,
  originUrl = 'https://qr.local',
  encryptionSecret?: string
): Promise<CreateBatchResponse> {
  const { name, cardCount, notes } = request;

  // 1. Validate inputs
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Batch name is required and cannot be empty');
  }
  const cleanName = name.trim();
  if (cleanName.length > 100) {
    throw new Error('Batch name cannot exceed 100 characters');
  }

  if (typeof cardCount !== 'number' || !Number.isInteger(cardCount) || cardCount < 1) {
    throw new Error('Card count must be an integer greater than 0');
  }
  if (cardCount > 500) {
    throw new Error('Card count cannot exceed 500 cards per batch');
  }

  if (!secret || secret.trim().length === 0) {
    throw new Error('ACTIVATION_SECRET is required for card provisioning');
  }

  const encSecret = encryptionSecret || secret;
  const batchId = `batch_${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt <= MAX_COLLISION_RETRIES; attempt++) {
    // 2. Generate unique cards
    const generatedIds = new Set<string>();
    const cardsToInsert: CardInsertData[] = [];

    for (let i = 0; i < cardCount; i++) {
      // Generate collision-resistant 16-character Crockford Base32 ID
      let publicId = generateRandomPublicId(PUBLIC_ID_LENGTH);
      while (generatedIds.has(publicId)) {
        publicId = generateRandomPublicId(PUBLIC_ID_LENGTH);
      }
      generatedIds.add(publicId);

      // Generate secure random activation code and derive HMAC digest + encrypted vault code
      const rawActivationCode = generateActivationCode();
      const codeHash = await hashActivationCode(rawActivationCode, secret);
      const encryptedActivationCode = await encryptActivationCode(rawActivationCode, encSecret);
      const nfcUrl = `${originUrl}/c/${publicId}`;

      cardsToInsert.push({
        id: crypto.randomUUID(),
        publicId,
        rawActivationCode,
        codeHash,
        encryptedActivationCode,
        nfcUrl,
      });
    }

    // 3. Assemble D1 batch statements
    const statements: ReturnType<D1Database['prepare']>[] = [];

    // Statement 1: Insert batch row
    statements.push(
      db
        .prepare(
          'INSERT INTO batches (id, name, card_count, notes, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(batchId, cleanName, cardCount, notes?.trim() || null, nowIso)
    );

    // Statements 2..N: Insert cards and audit logs
    for (const card of cardsToInsert) {
      statements.push(
        db
          .prepare(
            `INSERT INTO cards (
               id, public_id, batch_id, status, activation_code_hash,
               encrypted_activation_code, code_rotation_counter, created_at, updated_at
             ) VALUES (?, ?, ?, 'UNACTIVATED', ?, ?, 0, ?, ?)`
          )
          .bind(
            card.id,
            card.publicId,
            batchId,
            card.codeHash,
            card.encryptedActivationCode,
            nowIso,
            nowIso
          )
      );

      const auditId = crypto.randomUUID();
      statements.push(
        db
          .prepare(
            `INSERT INTO audit_logs (
               id, card_id, action, actor_type, actor_identifier,
               previous_state, new_state, metadata, created_at
             ) VALUES (?, ?, 'CARD_CREATED', 'ADMIN', ?, null, ?, null, ?)`
          )
          .bind(
            auditId,
            card.id,
            adminEmail,
            JSON.stringify({ status: 'UNACTIVATED', batchId, publicId: card.publicId }),
            nowIso
          )
      );
    }

    try {
      // 4. Atomically commit all statements to D1
      await db.batch(statements);

      // 5. Build response envelope
      const batchSummary: AdminBatchSummary = {
        id: batchId,
        name: cleanName,
        cardCount,
        notes: notes?.trim() || null,
        createdAt: nowIso,
      };

      const provisionedCards: ProvisionedCard[] = cardsToInsert.map((c) => ({
        id: c.id,
        publicId: c.publicId,
        activationCode: c.rawActivationCode,
        nfcUrl: c.nfcUrl,
      }));

      return {
        batch: batchSummary,
        cards: provisionedCards,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isUniqueCollision =
        errMsg.includes('UNIQUE constraint failed') ||
        errMsg.includes('cards.public_id') ||
        errMsg.includes('constraint');
      if (isUniqueCollision && attempt < MAX_COLLISION_RETRIES) {
        continue; // Retry with fresh random IDs
      }
      throw err;
    }
  }

  throw new Error('Exceeded maximum retry attempts for batch provisioning due to collision');
}

/**
 * Inserts a single card with automatic bounded collision retry.
 * The database unique constraint on cards.public_id remains the final authority.
 */
export async function insertCardWithRetry(
  db: D1Database,
  cardData: {
    id?: string;
    batchId: string;
    secret: string;
    encryptionSecret?: string;
    originUrl?: string;
    status?: 'UNACTIVATED' | 'ACTIVE';
    businessName?: string | null;
    destinationUrl?: string | null;
  },
  maxRetries = MAX_COLLISION_RETRIES
): Promise<ProvisionedCard> {
  const cardId = cardData.id ?? crypto.randomUUID();
  const rawCode = generateActivationCode();
  const codeHash = await hashActivationCode(rawCode, cardData.secret);
  const encSecret = cardData.encryptionSecret || cardData.secret;
  const encryptedCode = await encryptActivationCode(rawCode, encSecret);
  const nowIso = new Date().toISOString();
  const origin = cardData.originUrl ?? CANONICAL_PUBLIC_ORIGIN;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const publicId = generateRandomPublicId(PUBLIC_ID_LENGTH);
    const nfcUrl = `${origin}/c/${publicId}`;

    try {
      await db
        .prepare(
          `INSERT INTO cards (
             id, public_id, batch_id, status, activation_code_hash,
             encrypted_activation_code, code_rotation_counter, business_name, destination_url,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
        )
        .bind(
          cardId,
          publicId,
          cardData.batchId,
          cardData.status ?? 'UNACTIVATED',
          codeHash,
          encryptedCode,
          cardData.businessName ?? null,
          cardData.destinationUrl ?? null,
          nowIso,
          nowIso
        )
        .run();

      return {
        id: cardId,
        publicId,
        activationCode: rawCode,
        nfcUrl,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isUniqueCollision =
        errMsg.includes('UNIQUE constraint failed') ||
        errMsg.includes('cards.public_id') ||
        errMsg.includes('constraint');
      if (isUniqueCollision && attempt < maxRetries) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Exceeded maximum retry attempts for card insertion due to collision');
}
