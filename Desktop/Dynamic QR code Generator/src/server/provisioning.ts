import type { D1Database } from '@cloudflare/workers-types/2023-07-01';
import type {
  AdminBatchSummary,
  CreateBatchRequest,
  CreateBatchResponse,
  ProvisionedCard,
} from '../shared/types';
import { generateCrockfordPublicId } from '../shared/utils';
import { generateActivationCode, hashActivationCode } from '../shared/activation-crypto';

export interface CardInsertData {
  id: string;
  publicId: string;
  rawActivationCode: string;
  codeHash: string;
  nfcUrl: string;
}

/**
 * Provisions a new manufacturing batch of review cards.
 * Generates unique non-sequential Crockford Base32 public IDs and secure activation codes.
 * Stores exclusively HMAC-SHA256 digests in Cloudflare D1.
 * Returns raw codes strictly once for supplier manifest fulfillment.
 */
export async function provisionCardBatch(
  db: D1Database,
  secret: string,
  request: CreateBatchRequest,
  adminEmail: string,
  originUrl = 'https://qr.local'
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

  const batchId = `batch_${crypto.randomUUID()}`;
  const nowIso = new Date().toISOString();

  // 2. Generate unique cards
  const generatedIds = new Set<string>();
  const cardsToInsert: CardInsertData[] = [];

  for (let i = 0; i < cardCount; i++) {
    // Generate collision-resistant Crockford Base32 ID
    let publicId = generateCrockfordPublicId(10);
    while (generatedIds.has(publicId)) {
      publicId = generateCrockfordPublicId(10);
    }
    generatedIds.add(publicId);

    // Generate secure random activation code and derive HMAC digest
    const rawActivationCode = generateActivationCode();
    const codeHash = await hashActivationCode(rawActivationCode, secret);
    const nfcUrl = `${originUrl}/c/${publicId}`;

    cardsToInsert.push({
      id: crypto.randomUUID(),
      publicId,
      rawActivationCode,
      codeHash,
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
             code_rotation_counter, created_at, updated_at
           ) VALUES (?, ?, ?, 'UNACTIVATED', ?, 0, ?, ?)`
        )
        .bind(card.id, card.publicId, batchId, card.codeHash, nowIso, nowIso)
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
}
