import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const PDF_DIR = resolve(PROJECT_ROOT, 'mock/generated/unified-budget-versions');
const PUBLIC_PDF_BASE = process.env.MOCK_PUBLIC_BASE_URL
  || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;

function safeFilename(value) {
  return String(value || 'unified-budget-version')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'unified-budget-version';
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

function writeTotals(doc, totals = {}) {
  writeKeyValue(doc, 'PS', formatMoney(totals.psTotal));
  writeKeyValue(doc, 'MOOE', formatMoney(totals.mooeTotal));
  writeKeyValue(doc, 'CO', formatMoney(totals.coTotal));
  writeKeyValue(doc, 'TAG', formatMoney(totals.tagTotal));
  writeKeyValue(doc, 'Grand Total', formatMoney(totals.grandTotal));
}

function writeSectionsSummary(doc, sections = []) {
  if (!sections.length) {
    doc.font('Helvetica').fontSize(9).text('No budget request sections captured.');
    return;
  }

  sections.forEach((section, index) => {
    ensureSpace(doc, 26);
    const itemCount = Array.isArray(section.items) ? section.items.length : 0;
    doc.font('Helvetica-Bold').fontSize(9).text(`${index + 1}. ${section.requestTitle || section.requestId || 'Budget Request'}`);
    doc.font('Helvetica').fontSize(8).text(`Unit: ${formatValue(section.requestingUnit)} | Items: ${itemCount}`);
  });
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

export async function generateUnifiedBudgetVersionPdf({ version, snapshot }) {
  await mkdir(PDF_DIR, { recursive: true });

  const referenceNo = snapshot?.overview?.referenceNo || `UB-${snapshot?.overview?.id || 'budget'}`;
  const filename = `${safeFilename(referenceNo)}-v${safeFilename(version.version)}.pdf`;
  const filePath = resolve(PDF_DIR, filename);
  const publicUrl = `${PUBLIC_PDF_BASE.replace(/\/$/, '')}/generated/unified-budget-versions/${filename}`;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 42, right: 36, bottom: 42, left: 36 },
    info: {
      Title: `${referenceNo} v${version.version} Overview`,
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

    doc.font('Helvetica-Bold').fontSize(16).text('Unified Budget Version Snapshot', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('Overview Capture', { align: 'center' });
    doc.moveDown(1);

    writeKeyValue(doc, 'Reference No', overview.referenceNo || referenceNo);
    writeKeyValue(doc, 'Version', `v${version.version}`);
    writeKeyValue(doc, 'Status', version.status);
    writeKeyValue(doc, 'Stage', version.stage);
    writeKeyValue(doc, 'Captured At', formatDateTime(version.startedAt || snapshot?.capturedAt));

    writeSection(doc, 'General Information');
    writeKeyValue(doc, 'Title', overview.title);
    writeKeyValue(doc, 'Fiscal Year', overview.fiscalYear);
    writeKeyValue(doc, 'Planning Period', overview.planningPeriodName);
    writeKeyValue(doc, 'Description', overview.description);

    writeSection(doc, 'Appropriation Summary');
    writeTotals(doc, snapshot?.totals || {});

    writeSection(doc, 'Budget Requests Included');
    writeSectionsSummary(doc, snapshot?.consolidatedLineItems || []);

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
