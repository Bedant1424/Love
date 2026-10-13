import { sanitizeBatchNameForFilename } from './fulfillment';

/**
 * Standard A4 Dimensions in PostScript points (72 points/inch)
 * 210 mm x 297 mm = 595.28 pt x 841.89 pt
 */
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const MARGIN_X_PT = 36.0; // 0.5 inch margins
const PRINTABLE_WIDTH_PT = A4_WIDTH_PT - MARGIN_X_PT * 2; // 523.28 pt

const ROWS_PAGE_1 = 28;
const ROWS_PAGE_N = 34;
const ROW_HEIGHT_PT = 20.0;
const HEADER_ROW_HEIGHT_PT = 22.0;

export interface ActivationKeyExportItem {
  publicId: string;
  activationCode: string;
  batchName?: string | null;
  status?: string;
}

export interface ActivationKeysPdfOptions {
  generatedAt?: Date | string;
}

/**
 * Escapes string for use in PDF string literals (text).
 * Replaces backslashes and parentheses and strips non-printable ASCII.
 */
function escapePdfText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

/**
 * Calculates total page count based on page 1 and subsequent page row capacity.
 */
export function calculateActivationKeysPdfTotalPages(totalItems: number): number {
  if (totalItems <= 0) return 1;
  if (totalItems <= ROWS_PAGE_1) return 1;
  const remaining = totalItems - ROWS_PAGE_1;
  return 1 + Math.ceil(remaining / ROWS_PAGE_N);
}

/**
 * Formats canonical PDF filename for internal vaulted activation keys export.
 * Example: QRoute_Activation_Keys_Batch-2026-A.pdf
 */
export function formatActivationKeysPdfFilename(batchName: string): string {
  return `QRoute_Activation_Keys_${sanitizeBatchNameForFilename(batchName)}.pdf`;
}

/**
 * Formats canonical PDF filename for admin provisioning key backup.
 * Example: QRoute_Admin_Keys_Batch-2026-A.pdf
 */
export function formatAdminMappingPdfFilename(batchName: string): string {
  return `QRoute_Admin_Keys_${sanitizeBatchNameForFilename(batchName)}.pdf`;
}

/**
 * Generates an executive-grade, confidential A4 PDF document (PDF 1.4)
 * containing vaulted activation keys formatted for archival and printing.
 *
 * Sacred Architectural Invariants:
 * - Internal Admin Vault Document only (Never sent to suppliers or third parties).
 * - Multi-page dynamic pagination with repeating table headers.
 * - Monospaced Courier typography for Crockford Base32 IDs and activation keys.
 * - Zero external PDF library dependencies (pure standards-compliant PDF 1.4).
 */
export function generateActivationKeysPdf(
  items: ActivationKeyExportItem[],
  batchName: string,
  options: ActivationKeysPdfOptions = {}
): Uint8Array {
  if (!items || items.length === 0) {
    throw new Error('At least one card record is required to generate an activation keys PDF');
  }

  const cleanBatchName = batchName.trim() || 'Batch';
  const totalPages = calculateActivationKeysPdfTotalPages(items.length);
  const now =
    options.generatedAt instanceof Date
      ? options.generatedAt.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      : typeof options.generatedAt === 'string'
        ? options.generatedAt
        : new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Table Column Specifications (Total width = 523.28 pt)
  // Col 1: # (35 pt) -> x: 36.0 to 71.0
  // Col 2: PUBLIC ID (170 pt) -> x: 71.0 to 241.0
  // Col 3: STATUS (105 pt) -> x: 241.0 to 346.0
  // Col 4: ACTIVATION KEY (177.28 pt) -> x: 346.0 to 559.28
  const colX = {
    index: MARGIN_X_PT,
    indexWidth: 35.0,
    publicId: MARGIN_X_PT + 35.0,
    publicIdWidth: 170.0,
    status: MARGIN_X_PT + 35.0 + 170.0,
    statusWidth: 105.0,
    key: MARGIN_X_PT + 35.0 + 170.0 + 105.0,
    keyWidth: 177.28,
  };

  const pageStreams: string[] = [];
  let itemOffset = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    let stream = '';
    const isPage1 = pageNum === 1;
    const maxRowsThisPage = isPage1 ? ROWS_PAGE_1 : ROWS_PAGE_N;
    const pageItems = items.slice(itemOffset, itemOffset + maxRowsThisPage);

    // ==========================================
    // 1. PAGE HEADER
    // ==========================================
    if (isPage1) {
      // Document Title: QROUTE
      stream += `BT /F2 20 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${MARGIN_X_PT.toFixed(2)} 790.00 Tm (${escapePdfText('QROUTE')}) Tj ET\n`;
      // Subtitle
      stream += `BT /F1 10 Tf 0.28 0.33 0.41 rg 1 0 0 1 135.00 792.00 Tm (${escapePdfText('ACTIVATION KEYS VAULT')}) Tj ET\n`;

      // Confidential Badge (Top Right)
      // Pill background
      stream += `0.99 0.95 0.95 rg 380.00 786.00 179.28 18.00 re f\n`;
      // Pill border
      stream += `0.50 w 0.99 0.79 0.79 RG 380.00 786.00 179.28 18.00 re S\n`;
      // Pill text
      stream += `BT /F2 7.5 Tf 0.60 0.11 0.11 rg 1 0 0 1 388.00 791.50 Tm (${escapePdfText('CONFIDENTIAL • INTERNAL ADMIN ONLY')}) Tj ET\n`;

      // Header bottom border
      stream += `0.75 w 0.88 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} 778.00 ${PRINTABLE_WIDTH_PT.toFixed(2)} 0.00 re S\n`;

      // Metadata Infobox (y: 720.00, height: 46.00)
      const boxY = 722.0;
      const boxH = 46.0;
      // Infobox background
      stream += `0.97 0.98 0.99 rg ${MARGIN_X_PT.toFixed(2)} ${boxY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${boxH.toFixed(2)} re f\n`;
      // Infobox border
      stream += `0.75 w 0.88 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} ${boxY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${boxH.toFixed(2)} re S\n`;

      // Column Dividers inside Infobox
      const colDiv1X = MARGIN_X_PT + 175.0;
      const colDiv2X = MARGIN_X_PT + 345.0;
      stream += `0.5 w 0.88 0.91 0.94 RG ${colDiv1X.toFixed(2)} ${boxY.toFixed(2)} m ${colDiv1X.toFixed(2)} ${(boxY + boxH).toFixed(2)} l S\n`;
      stream += `0.5 w 0.88 0.91 0.94 RG ${colDiv2X.toFixed(2)} ${boxY.toFixed(2)} m ${colDiv2X.toFixed(2)} ${(boxY + boxH).toFixed(2)} l S\n`;

      // Infobox Field 1: BATCH NAME
      stream += `BT /F2 7.0 Tf 0.39 0.45 0.55 rg 1 0 0 1 ${(MARGIN_X_PT + 12).toFixed(2)} 753.00 Tm (${escapePdfText('BATCH IDENTIFIER')}) Tj ET\n`;
      stream += `BT /F2 10.5 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${(MARGIN_X_PT + 12).toFixed(2)} 735.00 Tm (${escapePdfText(cleanBatchName)}) Tj ET\n`;

      // Infobox Field 2: TOTAL KEYS & DATE
      stream += `BT /F2 7.0 Tf 0.39 0.45 0.55 rg 1 0 0 1 ${(colDiv1X + 12).toFixed(2)} 753.00 Tm (${escapePdfText('VAULT INVENTORY COUNT')}) Tj ET\n`;
      stream += `BT /F2 10.5 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${(colDiv1X + 12).toFixed(2)} 735.00 Tm (${escapePdfText(`${items.length} Cards Vaulted`)}) Tj ET\n`;

      // Infobox Field 3: SECURITY PROTOCOL
      stream += `BT /F2 7.0 Tf 0.39 0.45 0.55 rg 1 0 0 1 ${(colDiv2X + 12).toFixed(2)} 753.00 Tm (${escapePdfText('EXPORTED AT')}) Tj ET\n`;
      stream += `BT /F1 9.0 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${(colDiv2X + 12).toFixed(2)} 735.00 Tm (${escapePdfText(now)}) Tj ET\n`;

      // Warning Banner (y: 694.00, height: 20.00)
      const warnY = 694.0;
      const warnH = 20.0;
      stream += `0.99 0.99 0.92 rg ${MARGIN_X_PT.toFixed(2)} ${warnY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${warnH.toFixed(2)} re f\n`;
      stream += `0.5 w 0.99 0.94 0.54 RG ${MARGIN_X_PT.toFixed(2)} ${warnY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${warnH.toFixed(2)} re S\n`;
      stream += `BT /F2 7.5 Tf 0.52 0.30 0.05 rg 1 0 0 1 ${(MARGIN_X_PT + 10).toFixed(2)} 700.50 Tm (${escapePdfText('SECURITY NOTICE: Contains decrypted activation credentials. Store securely. Never distribute to print suppliers.')}) Tj ET\n`;
    } else {
      // Subsequent Pages Compact Header
      stream += `BT /F2 10.0 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${MARGIN_X_PT.toFixed(2)} 795.00 Tm (${escapePdfText(`QROUTE ACTIVATION KEYS VAULT — ${cleanBatchName} (Page ${pageNum} of ${totalPages})`)}) Tj ET\n`;
      stream += `BT /F2 8.0 Tf 0.60 0.11 0.11 rg 1 0 0 1 420.00 795.00 Tm (${escapePdfText('CONFIDENTIAL • VAULT RECORD')}) Tj ET\n`;
      stream += `0.75 w 0.88 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} 786.00 ${PRINTABLE_WIDTH_PT.toFixed(2)} 0.00 re S\n`;
    }

    // ==========================================
    // 2. TABLE HEADER ROW
    // ==========================================
    const tableHeaderY = isPage1 ? 664.0 : 756.0;
    // Table Header Background (Deep Slate #0F172A)
    stream += `0.06 0.09 0.16 rg ${MARGIN_X_PT.toFixed(2)} ${(tableHeaderY - HEADER_ROW_HEIGHT_PT).toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${HEADER_ROW_HEIGHT_PT.toFixed(2)} re f\n`;

    // Table Header Text
    const headerTextY = tableHeaderY - 14.5;
    stream += `BT /F2 8.0 Tf 1.0 1.0 1.0 rg 1 0 0 1 ${(colX.index + 8).toFixed(2)} ${headerTextY.toFixed(2)} Tm (${escapePdfText('#')}) Tj ET\n`;
    stream += `BT /F2 8.0 Tf 1.0 1.0 1.0 rg 1 0 0 1 ${(colX.publicId + 8).toFixed(2)} ${headerTextY.toFixed(2)} Tm (${escapePdfText('PUBLIC CARD ID')}) Tj ET\n`;
    stream += `BT /F2 8.0 Tf 1.0 1.0 1.0 rg 1 0 0 1 ${(colX.status + 8).toFixed(2)} ${headerTextY.toFixed(2)} Tm (${escapePdfText('STATUS')}) Tj ET\n`;
    stream += `BT /F2 8.0 Tf 1.0 1.0 1.0 rg 1 0 0 1 ${(colX.key + 8).toFixed(2)} ${headerTextY.toFixed(2)} Tm (${escapePdfText('ACTIVATION KEY')}) Tj ET\n`;

    // ==========================================
    // 3. TABLE DATA ROWS
    // ==========================================
    let currentY = tableHeaderY - HEADER_ROW_HEIGHT_PT;

    for (let r = 0; r < pageItems.length; r++) {
      const item = pageItems[r]!;
      const globalIndex = itemOffset + r + 1;
      const rowY = currentY - ROW_HEIGHT_PT;

      // Alternating row background
      if (r % 2 === 1) {
        stream += `0.97 0.98 0.99 rg ${MARGIN_X_PT.toFixed(2)} ${rowY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${ROW_HEIGHT_PT.toFixed(2)} re f\n`;
      }

      // Row bottom divider
      stream += `0.5 w 0.89 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} ${rowY.toFixed(2)} m ${(MARGIN_X_PT + PRINTABLE_WIDTH_PT).toFixed(2)} ${rowY.toFixed(2)} l S\n`;

      const textY = rowY + 6.0;

      // Col 1: Index
      stream += `BT /F1 8.5 Tf 0.39 0.45 0.55 rg 1 0 0 1 ${(colX.index + 8).toFixed(2)} ${textY.toFixed(2)} Tm (${escapePdfText(String(globalIndex))}) Tj ET\n`;

      // Col 2: Public ID (Courier-Bold)
      stream += `BT /F4 9.0 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${(colX.publicId + 8).toFixed(2)} ${textY.toFixed(2)} Tm (${escapePdfText(item.publicId)}) Tj ET\n`;

      // Col 3: Status Badge
      const statusText = (item.status || 'UNACTIVATED').toUpperCase();
      let statusR = '0.20 0.25 0.33'; // Default slate
      if (statusText === 'ACTIVE') {
        statusR = '0.02 0.47 0.34'; // Emerald Green
      } else if (statusText === 'UNACTIVATED') {
        statusR = '0.15 0.39 0.92'; // Royal Blue
      } else if (statusText === 'RETIRED') {
        statusR = '0.75 0.07 0.24'; // Red
      }
      stream += `BT /F2 8.0 Tf ${statusR} rg 1 0 0 1 ${(colX.status + 8).toFixed(2)} ${textY.toFixed(2)} Tm (${escapePdfText(statusText)}) Tj ET\n`;

      // Col 4: Activation Key (Courier-Bold)
      stream += `BT /F4 9.5 Tf 0.06 0.09 0.16 rg 1 0 0 1 ${(colX.key + 8).toFixed(2)} ${textY.toFixed(2)} Tm (${escapePdfText(item.activationCode)}) Tj ET\n`;

      currentY = rowY;
    }

    // Outer table border outline
    const tableTop = tableHeaderY;
    const tableBottom = currentY;
    const totalTableHeight = tableTop - tableBottom;
    stream += `0.75 w 0.88 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} ${tableBottom.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} ${totalTableHeight.toFixed(2)} re S\n`;

    // ==========================================
    // 4. PAGE FOOTER
    // ==========================================
    const footerY = 36.0;
    // Footer horizontal line
    stream += `0.5 w 0.88 0.91 0.94 RG ${MARGIN_X_PT.toFixed(2)} ${footerY.toFixed(2)} ${PRINTABLE_WIDTH_PT.toFixed(2)} 0.00 re S\n`;

    // Left: System branding & security note
    stream += `BT /F1 7.5 Tf 0.39 0.45 0.55 rg 1 0 0 1 ${MARGIN_X_PT.toFixed(2)} ${(footerY - 12.0).toFixed(2)} Tm (${escapePdfText('CONFIDENTIAL • QRoute Cryptographic Engine • AES-GCM Vault Export')}) Tj ET\n`;

    // Right: Page numbering
    const pageText = `Page ${pageNum} of ${totalPages}`;
    stream += `BT /F2 7.5 Tf 0.39 0.45 0.55 rg 1 0 0 1 505.00 ${(footerY - 12.0).toFixed(2)} Tm (${escapePdfText(pageText)}) Tj ET\n`;

    pageStreams.push(stream);
    itemOffset += pageItems.length;
  }

  // ==========================================
  // 5. ASSEMBLE PDF 1.4 OBJECT STRUCTURE
  // ==========================================
  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3: Resources (Standard Type 1 Fonts)
  // 4 .. (3 + totalPages): Page objects
  // (4 + totalPages) .. (3 + totalPages * 2): Content stream objects

  const catalogObjId = 1;
  const pagesObjId = 2;
  const resourcesObjId = 3;
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  for (let p = 0; p < totalPages; p++) {
    pageObjIds.push(4 + p);
    contentObjIds.push(4 + totalPages + p);
  }

  const pdfObjects: { id: number; body: string }[] = [];

  // 1. Catalog
  pdfObjects.push({
    id: catalogObjId,
    body: `<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`,
  });

  // 2. Pages
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  pdfObjects.push({
    id: pagesObjId,
    body: `<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`,
  });

  // 3. Shared Resources Object with standard 14 Type 1 Fonts
  pdfObjects.push({
    id: resourcesObjId,
    body: `<< /Font <<
      /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
      /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
      /F3 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>
      /F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>
    >> >>`,
  });

  // 4. Page Objects
  for (let p = 0; p < totalPages; p++) {
    const pageId = pageObjIds[p]!;
    const contentId = contentObjIds[p]!;
    pdfObjects.push({
      id: pageId,
      body: `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${A4_WIDTH_PT.toFixed(2)} ${A4_HEIGHT_PT.toFixed(2)}] /Contents ${contentId} 0 R /Resources ${resourcesObjId} 0 R >>`,
    });
  }

  // 5. Content Streams
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
