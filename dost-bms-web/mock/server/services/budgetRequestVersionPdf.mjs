import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const PDF_DIR = resolve(PROJECT_ROOT, 'mock/generated/budget-request-versions');
const PUBLIC_PDF_BASE = process.env.MOCK_PUBLIC_BASE_URL
  || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;

function safeFilename(value) {
  return String(value || 'budget-request-version')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'budget-request-version';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ensureSpace(doc, height = 36) {
  if (doc.y + height <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
}

function writeSection(doc, title) {
  ensureSpace(doc, 34);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(title);
  doc.moveTo(doc.page.margins.left, doc.y + 3)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 3)
    .strokeColor('#d1d5db')
    .stroke();
  doc.moveDown(0.6);
  doc.fillColor('#111827');
}

function writeKeyValue(doc, label, value) {
  ensureSpace(doc, 18);
  doc.font('Helvetica-Bold').fontSize(9).text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(formatValue(value));
}

function writeLineItemsTable(doc, items = []) {
  const cols = [
    { label: '#', width: 24, key: 'index' },
    { label: 'Description', width: 160, key: 'description' },
    { label: 'Cost Structure', width: 78, key: 'costStructure' },
    { label: 'Category', width: 70, key: 'category' },
    { label: 'Amount', width: 86, key: 'amount', align: 'right' },
    { label: 'Justification', width: 106, key: 'justification' },
  ];
  const rowHeight = 30;
  let x = doc.page.margins.left;

  ensureSpace(doc, rowHeight * 2);
  const headerY = doc.y;
  doc.font('Helvetica-Bold').fontSize(7);
  cols.forEach((col) => {
    doc.rect(x, headerY, col.width, 18).stroke();
    doc.text(col.label, x + 3, headerY + 5, {
      width: col.width - 6,
      height: 12,
      align: col.align || 'left',
    });
    x += col.width;
  });
  doc.y = headerY + 18;

  doc.font('Helvetica').fontSize(7);
  if (!items.length) {
    doc.text('No line items captured.');
    return;
  }

  items.forEach((item, index) => {
    ensureSpace(doc, rowHeight);
    const y = doc.y;
    x = doc.page.margins.left;
    const row = {
      index: index + 1,
      description: item.bri_description || item.description,
      costStructure: item.bri_cost_structure || item.costStructure,
      category: item.categoryCode || item.bcat_code || item.bri_category_id,
      amount: formatMoney(item.bri_planned_amount ?? item.amount),
      justification: item.bri_justification || item.justification,
    };

    cols.forEach((col) => {
      doc.rect(x, y, col.width, rowHeight).stroke();
      doc.text(formatValue(row[col.key]), x + 3, y + 5, {
        width: col.width - 6,
        height: rowHeight - 8,
        ellipsis: true,
        align: col.align || 'left',
      });
      x += col.width;
    });
    doc.y = y + rowHeight;
  });
}

function writeTotals(doc, totals = {}) {
  writeKeyValue(doc, 'PS', formatMoney(totals.psTotal));
  writeKeyValue(doc, 'MOOE', formatMoney(totals.mooeTotal));
  writeKeyValue(doc, 'CO', formatMoney(totals.coTotal));
  writeKeyValue(doc, 'TAG', formatMoney(totals.tagTotal));
  writeKeyValue(doc, 'Grand Total', formatMoney(totals.grandTotal));
}

function writeAttachedFiles(doc, files = []) {
  if (!files.length) {
    doc.font('Helvetica').fontSize(9).text('No attached forms captured.');
    return;
  }

  files.forEach((file, index) => {
    ensureSpace(doc, 28);
    doc.font('Helvetica-Bold').fontSize(9).text(`${index + 1}. ${file.name || file.id || 'File'}`);
    doc.font('Helvetica').fontSize(8).text(`Type: ${formatValue(file.type)} | Size: ${formatValue(file.size)} bytes`);
    if (file.url) {
      doc.fillColor('#2563eb').text(file.url, { link: file.url, underline: true });
      doc.fillColor('#111827');
    }
    doc.moveDown(0.3);
  });
}

export async function generateBudgetRequestVersionPdf({ version, snapshot }) {
  await mkdir(PDF_DIR, { recursive: true });

  const referenceNo = snapshot?.overview?.referenceNo || snapshot?.br_reference_no || `BR-${version.brv_br_id}`;
  const filename = `${safeFilename(referenceNo)}-v${safeFilename(version.brv_version_number)}.pdf`;
  const filePath = resolve(PDF_DIR, filename);
  const publicUrl = `${PUBLIC_PDF_BASE.replace(/\/$/, '')}/generated/budget-request-versions/${filename}`;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 42, right: 36, bottom: 42, left: 36 },
    info: {
      Title: `${referenceNo} v${version.brv_version_number} Overview`,
      Author: 'DOST BMS Mock Server',
    },
  });

  await new Promise((resolvePromise, rejectPromise) => {
    const stream = createWriteStream(filePath);
    stream.on('finish', resolvePromise);
    stream.on('error', rejectPromise);
    doc.on('error', rejectPromise);
    doc.pipe(stream);

    const overview = snapshot?.overview || {};

    doc.font('Helvetica-Bold').fontSize(16).text('Budget Request Version Snapshot', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('Overview Capture', { align: 'center' });
    doc.moveDown(1);

    writeKeyValue(doc, 'Reference No', overview.referenceNo || referenceNo);
    writeKeyValue(doc, 'Version', `v${version.brv_version_number}`);
    writeKeyValue(doc, 'Status', version.brv_status);
    writeKeyValue(doc, 'Submitted By', version.brv_submitted_by_name);
    writeKeyValue(doc, 'Submitted Role', version.brv_submitted_by_role);
    writeKeyValue(doc, 'Captured At', formatDateTime(version.brv_created_at));

    writeSection(doc, 'General Information');
    writeKeyValue(doc, 'Title', overview.title || snapshot?.br_title);
    writeKeyValue(doc, 'Requesting Unit', overview.requestingUnitName);
    writeKeyValue(doc, 'Fiscal Year', overview.fiscalYear);
    writeKeyValue(doc, 'Planning Period', overview.planningPeriodName);
    writeKeyValue(doc, 'Description', overview.description || snapshot?.br_description);

    writeSection(doc, 'Budget Line Items');
    writeLineItemsTable(doc, snapshot?.items || []);

    writeSection(doc, 'Appropriation Summary');
    writeTotals(doc, snapshot?.totals || { grandTotal: snapshot?.br_total_amount });

    writeSection(doc, 'Attached Forms Captured With This Version');
    writeAttachedFiles(doc, snapshot?.attachedFiles || []);

    doc.end();
  });

  return {
    pdfUrl: publicUrl,
    pdfPath: filePath,
    pdfGeneratedAt: new Date().toISOString(),
  };
}
