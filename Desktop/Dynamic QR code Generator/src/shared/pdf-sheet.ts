import QRCode from 'qrcode';
import { buildCardUrl, type CardUrlOptions } from './url';
import { MASTER_QR_OPTIONS } from './qr-generator';

export interface QrSheetOptions {
  urlOptions?: CardUrlOptions;
  columns?: number;
  rows?: number;
  qrSizePt?: number;
}

/**
 * Standard A4 Dimensions in PostScript points (72 points/inch)
 * 210 mm x 297 mm = 595.28 pt x 841.89 pt
 */
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

/**
 * Default margins and grid layout for clean supplier print sheets
 */
const MARGIN_X_PT = 36.0; // 0.5 in / ~12.7 mm
const MARGIN_Y_PT = 40.0; // ~14.1 mm
const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 4;
const DEFAULT_QR_SIZE_PT = 130.0; // ~45.8 mm QR size (industry standard for scanning)

/**
 * Generates a multi-page, standards-compliant A4 PDF sheet (PDF 1.4)
 * containing all cards in a clean grid of vector QR codes.
 *
 * Sacred Security & Supplier Invariants:
 * - Pure vector QR geometry (lossless scaling, sharp at 1200+ DPI).
 * - ZERO activation codes or passwords.
 * - ZERO Google destination URLs or customer/business details.
 * - ZERO public IDs printed beneath or beside customer-facing artwork.
 * - ZERO PVC/card mockups, frames, or decorative text.
 */
export async function generateQrSheetPdf(
  cards: { publicId: string }[],
  options: QrSheetOptions = {}
): Promise<Uint8Array> {
  if (!cards || cards.length === 0) {
    throw new Error('At least one card is required to generate a QR sheet');
  }

  const cols = options.columns ?? DEFAULT_COLS;
  const rows = options.rows ?? DEFAULT_ROWS;
  const qrSize = options.qrSizePt ?? DEFAULT_QR_SIZE_PT;
  const cardsPerPage = cols * rows;

  const printableWidth = A4_WIDTH_PT - MARGIN_X_PT * 2;
  const printableHeight = A4_HEIGHT_PT - MARGIN_Y_PT * 2;
  const cellWidth = printableWidth / cols;
  const cellHeight = printableHeight / rows;

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  // Pre-generate QR matrices for each card
  interface QrMatrixData {
    publicId: string;
    modules: { size: number; get: (x: number, y: number) => number | boolean };
  }

  const matrices: QrMatrixData[] = [];
  for (const card of cards) {
    const canonicalUrl = buildCardUrl(card.publicId, options.urlOptions);
    const qr = QRCode.create(canonicalUrl, {
      errorCorrectionLevel: MASTER_QR_OPTIONS.errorCorrectionLevel,
    });
    matrices.push({
      publicId: card.publicId,
      modules: qr.modules,
    });
  }

  // Generate page content streams
  const pageStreams: string[] = [];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const startIdx = pageIdx * cardsPerPage;
    const pageCards = matrices.slice(startIdx, startIdx + cardsPerPage);

    let stream = '0 0 0 rg\n'; // Black fill color

    for (let i = 0; i < pageCards.length; i++) {
      const card = pageCards[i]!;
      const col = i % cols;
      const row = Math.floor(i / cols); // 0 at top

      // PDF coordinate origin (0, 0) is bottom-left
      const cellLeft = MARGIN_X_PT + col * cellWidth;
      const cellTop = A4_HEIGHT_PT - MARGIN_Y_PT - row * cellHeight;
      const cellBottom = cellTop - cellHeight;

      // Center the QR code inside its cell
      const qrX = cellLeft + (cellWidth - qrSize) / 2;
      const qrY = cellBottom + (cellHeight - qrSize) / 2;

      const modCount = card.modules.size;
      const moduleSize = qrSize / modCount;

      for (let my = 0; my < modCount; my++) {
        for (let mx = 0; mx < modCount; mx++) {
          const isDark = card.modules.get(mx, my) === 1 || card.modules.get(mx, my) === true;
          if (isDark) {
            const x = (qrX + mx * moduleSize).toFixed(2);
            // Invert Y axis: row 0 in matrix is top of QR
            const y = (qrY + (modCount - 1 - my) * moduleSize).toFixed(2);
            const w = moduleSize.toFixed(2);
            const h = moduleSize.toFixed(2);
            stream += `${x} ${y} ${w} ${h} re\n`;
          }
        }
      }
    }

    stream += 'f\n'; // Fill all module rectangles
    pageStreams.push(stream);
  }

  // Construct standard PDF 1.4 document
  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3 .. 2 + totalPages: Page objects
  // 3 + totalPages .. 2 + totalPages * 2: Content stream objects

  const pdfObjects: { id: number; body: string }[] = [];

  const catalogObjId = 1;
  const pagesObjId = 2;
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  for (let p = 0; p < totalPages; p++) {
    pageObjIds.push(3 + p);
    contentObjIds.push(3 + totalPages + p);
  }

  // 1. Catalog Object
  pdfObjects.push({
    id: catalogObjId,
    body: `<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`,
  });

  // 2. Pages Object
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  pdfObjects.push({
    id: pagesObjId,
    body: `<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`,
  });

  // 3. Page Objects
  for (let p = 0; p < totalPages; p++) {
    const pageId = pageObjIds[p]!;
    const contentId = contentObjIds[p]!;
    pdfObjects.push({
      id: pageId,
      body: `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${A4_WIDTH_PT.toFixed(2)} ${A4_HEIGHT_PT.toFixed(2)}] /Contents ${contentId} 0 R /Resources << >> >>`,
    });
  }

  // 4. Content Stream Objects
  for (let p = 0; p < totalPages; p++) {
    const contentId = contentObjIds[p]!;
    const streamContent = pageStreams[p]!;
    const streamBytes = new TextEncoder().encode(streamContent);
    pdfObjects.push({
      id: contentId,
      body: `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream`,
    });
  }

  // Assemble PDF bytes with XRef Table and Trailer
  const encoder = new TextEncoder();
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let pdfString = header;

  const offsets: number[] = [0]; // object 0 offset is 0

  for (const obj of pdfObjects) {
    const offset = encoder.encode(pdfString).length;
    offsets.push(offset);
    pdfString += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdfString).length;
  pdfString += `xref\n0 ${pdfObjects.length + 1}\n`;
  pdfString += '0000000000 65535 f \n';

  for (let i = 1; i <= pdfObjects.length; i++) {
    const off = offsets[i]!;
    const padded = String(off).padStart(10, '0');
    pdfString += `${padded} 00000 n \n`;
  }

  pdfString += `trailer\n<< /Size ${pdfObjects.length + 1} /Root ${catalogObjId} 0 R >>\n`;
  pdfString += `startxref\n${xrefOffset}\n%%EOF\n`;

  return encoder.encode(pdfString);
}
