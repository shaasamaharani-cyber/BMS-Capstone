import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');
const PDF_DIR = resolve(PROJECT_ROOT, 'mock/generated/forms');
const PUBLIC_PDF_BASE = process.env.MOCK_PUBLIC_BASE_URL
  || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;

function normalizeSchemaRecord(record) {
  if (!record) return null;

  const schema = record.schema && typeof record.schema === 'object'
    ? record.schema
    : record;

  return {
    ...schema,
    id: schema.id ?? record.id,
    name: schema.name ?? record.name,
    version: schema.version ?? record.version,
    headerFields: schema.headerFields ?? record.headerFields ?? [],
    sections: schema.sections ?? record.sections ?? [],
    footer: schema.footer ?? record.footer ?? {},
  };
}

function safeFilename(value) {
  return String(value || 'form-entry')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'form-entry';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  return String(value);
}

function sectionKey(sectionId, tabId) {
  return tabId ? `${sectionId}__${tabId}` : sectionId;
}

function collectTables(sections = []) {
  const tables = [];

  sections.forEach((section) => {
    if (section.table) {
      tables.push({
        key: sectionKey(section.id),
        title: section.title || section.id,
        table: section.table,
      });
    }

    (section.tabs || []).forEach((tab) => {
      if (!tab.table) return;
      tables.push({
        key: sectionKey(section.id, tab.id),
        title: `${section.title || section.id} - ${tab.label || tab.id}`,
        table: tab.table,
      });
    });

    tables.push(...collectTables(section.subsections || []));
  });

  return tables;
}

function ensureSpace(doc, height = 36) {
  if (doc.y + height <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
}

function writeKeyValue(doc, label, value) {
  ensureSpace(doc, 18);
  doc.font('Helvetica-Bold').fontSize(9).text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(formatValue(value));
}

function writeTable(doc, tableInfo, rows) {
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(11).text(tableInfo.title);
  doc.moveDown(0.3);

  const columns = (tableInfo.table.columns || []).slice(0, 8);
  if (!columns.length) return;

  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const actionlessWidth = usableWidth / columns.length;
  const rowHeight = 18;

  ensureSpace(doc, rowHeight * 2);
  const headerY = doc.y;
  let x = doc.page.margins.left;

  doc.font('Helvetica-Bold').fontSize(7);
  columns.forEach((column) => {
    doc.rect(x, headerY, actionlessWidth, rowHeight).stroke();
    doc.text(column.label || column.key, x + 3, headerY + 5, {
      width: actionlessWidth - 6,
      height: rowHeight - 4,
      ellipsis: true,
    });
    x += actionlessWidth;
  });
  doc.y = headerY + rowHeight;

  doc.font('Helvetica').fontSize(7);
  (rows || []).forEach((row) => {
    ensureSpace(doc, rowHeight);
    const y = doc.y;
    x = doc.page.margins.left;

    columns.forEach((column) => {
      const indent = column.indentKey ? Number(row[column.indentKey] || 0) * 7 : 0;
      const align = column.align === 'right' || ['number', 'computed'].includes(column.type) ? 'right' : 'left';
      doc.rect(x, y, actionlessWidth, rowHeight).stroke();
      doc.text(formatValue(row[column.key]), x + 3 + indent, y + 5, {
        width: Math.max(actionlessWidth - 6 - indent, 12),
        height: rowHeight - 4,
        ellipsis: true,
        align,
      });
      x += actionlessWidth;
    });

    doc.y = y + rowHeight;
  });
}

export async function generateFormEntryPdf({ entry, schemaRecord }) {
  const schema = normalizeSchemaRecord(schemaRecord);
  if (!entry || !schema) return entry;

  await mkdir(PDF_DIR, { recursive: true });

  const filename = `${safeFilename(schema.id)}-${safeFilename(entry.id)}.pdf`;
  const filePath = resolve(PDF_DIR, filename);
  const publicUrl = `${PUBLIC_PDF_BASE.replace(/\/$/, '')}/generated/forms/${filename}`;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 42, right: 36, bottom: 42, left: 36 },
    info: {
      Title: schema.name || 'Form Entry',
      Author: 'DOST BMS Mock Server',
    },
  });

  await new Promise((resolvePromise, rejectPromise) => {
    const stream = createWriteStream(filePath);
    stream.on('finish', resolvePromise);
    stream.on('error', rejectPromise);
    doc.on('error', rejectPromise);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(16).text(schema.name || 'Form Entry', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text(`Version ${schema.version || '-'} | Entry ${entry.id}`, { align: 'center' });
    doc.moveDown(1);

    (schema.headerFields || []).forEach((field) => {
      writeKeyValue(doc, field.label || field.key, entry.header?.[field.key]);
    });

    collectTables(schema.sections).forEach((tableInfo) => {
      writeTable(doc, tableInfo, entry.sections?.[tableInfo.key] || []);
    });

    if (schema.footer?.notes?.length) {
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(9).text('Notes');
      doc.font('Helvetica').fontSize(8);
      schema.footer.notes.forEach((note) => {
        ensureSpace(doc, 14);
        doc.text(note.label || '');
      });
    }

    doc.end();
  });

  return {
    ...entry,
    pdfUrl: publicUrl,
    pdfPath: filePath,
    pdfGeneratedAt: new Date().toISOString(),
  };
}
