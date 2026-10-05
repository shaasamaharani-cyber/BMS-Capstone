import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const GENERATED_ATTACHMENTS_DIR = resolve('mock/generated/attachments');
const PUBLIC_FILE_BASE = process.env.MOCK_PUBLIC_BASE_URL
  || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;

function publicGeneratedUrl(pathname) {
  return `${PUBLIC_FILE_BASE.replace(/\/$/, '')}${pathname}`;
}

export function withBudgetRequestRelations(db, request) {
  const unit = db.rows('requesting-units')
    .find((row) => Number(row.ru_id) === Number(request.br_requesting_unit_id));
  const year = db.rows('fiscal-years')
    .find((row) => Number(row.fy_id) === Number(request.br_fiscal_year_id));
  const planningPeriod = db.rows('planning-periods')
    .find((row) => Number(row.pp_id) === Number(request.br_planning_period_id));
  const formEntries = hydrateAttachedForms(db, request);
  // Where a consolidated request is now: the approval stage of the consolidated budget that holds it
  const unifiedItem = db.rows('unified-budget-items')
    .find((row) => Number(row.ubi_budget_request_id) === Number(request.id) && !row.ubi_deleted_at);
  const unifiedBudget = unifiedItem ? db.find('unified-budgets', unifiedItem.ubi_unified_budget_id) : null;

  return {
    ...request,
    br_form_entries: formEntries,
    br_attached_files: hydrateAttachedFiles(request),
    requesting_unit: unit ? { ru_id: unit.ru_id, ru_name: unit.ru_name } : null,
    fiscal_year: year ? { fy_id: year.fy_id, fy_year: year.fy_year } : null,
    planning_period: planningPeriod
      ? { pp_id: planningPeriod.pp_id, pp_name: planningPeriod.pp_name }
      : null,
    current_stage: unifiedBudget?.ub_current_stage ?? null,
  };
}

function normalizeExistingAttachmentUrl(file = {}) {
  const existingUrl = String(file.url || file.fileUrl || '');
  const match = existingUrl.match(/\/generated\/attachments\/[^?#]+/);

  if (match) {
    return publicGeneratedUrl(match[0]);
  }

  return existingUrl;
}

function safeFilename(value) {
  return String(value || 'attachment')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'attachment';
}

function extensionForFile(file = {}) {
  const fromName = extname(String(file.name || '')).toLowerCase();
  if (fromName) return fromName;
  const mime = String(file.type || '').toLowerCase();
  if (mime === 'application/pdf') return '.pdf';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  return '';
}

function saveAttachedFiles(payloadFiles, existingFiles = [], requestId = '') {
  if (!Array.isArray(payloadFiles)) {
    return Array.isArray(existingFiles) ? existingFiles : [];
  }

  mkdirSync(GENERATED_ATTACHMENTS_DIR, { recursive: true });

  return payloadFiles.map((file, index) => {
    if (file.url || file.fileUrl) {
      const cleaned = { ...file };
      cleaned.url = normalizeExistingAttachmentUrl(file);
      delete cleaned.dataUrl;
      delete cleaned.previewUrl;
      delete cleaned.fileUrl;
      return cleaned;
    }

    const match = String(file.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      const cleaned = { ...file };
      delete cleaned.dataUrl;
      delete cleaned.previewUrl;
      return cleaned;
    }

    const type = file.type || match[1] || 'application/octet-stream';
    const ext = extensionForFile({ ...file, type });
    const baseName = safeFilename(file.name || `attachment-${index + 1}`).replace(/\.[^.]+$/, '');
    const filename = `${safeFilename(requestId)}-${Date.now()}-${index + 1}-${baseName}${ext}`;
    const filePath = resolve(GENERATED_ATTACHMENTS_DIR, filename);
    writeFileSync(filePath, Buffer.from(match[2], 'base64'));

    return {
      id: file.id || filename,
      name: file.name || filename,
      size: Number(file.size) || Buffer.byteLength(match[2], 'base64'),
      type,
      lastModified: file.lastModified || null,
      url: publicGeneratedUrl(`/generated/attachments/${filename}`),
    };
  });
}

function hydrateAttachedFiles(request = {}) {
  const attachedFiles = Array.isArray(request.br_attached_files)
    ? request.br_attached_files
    : [];

  return saveAttachedFiles(attachedFiles, [], request.br_id ?? request.id);
}

function normalizeSchemaRecord(record) {
  if (!record) return null;
  const schema = record.schema && typeof record.schema === 'object' ? record.schema : record;
  return {
    ...schema,
    id: schema.id ?? record.id,
    name: schema.name ?? record.name,
    version: schema.version ?? record.version,
  };
}

function hydrateAttachedForms(db, request = {}) {
  const attached = Array.isArray(request.br_form_entries)
    ? request.br_form_entries
    : (request.br_form_entry_id ? [{
      schemaId: request.br_form_schema_id || '',
      entryId: request.br_form_entry_id,
    }] : []);

  return attached.map((form) => {
    const entry = db.find('form_entries', form.entryId);
    const schema = normalizeSchemaRecord(db.find('form_schemas', form.schemaId || entry?.schemaId));

    return {
      ...form,
      schemaId: form.schemaId || entry?.schemaId || '',
      schemaName: form.schemaName || schema?.name || form.schemaId || entry?.schemaId || '',
      entryId: form.entryId,
      entryLabel: form.entryLabel || entry?.name || entry?.header?.department || entry?.header?.agency || entry?.id || form.entryId,
      pdfUrl: entry?.pdfUrl || form.pdfUrl || '',
      pdfGeneratedAt: entry?.pdfGeneratedAt || form.pdfGeneratedAt || '',
    };
  });
}

export function budgetRequestItems(db, brId) {
  return db.rows('budget-request-items')
    .filter((item) => Number(item.bri_br_id) === Number(brId))
    .sort((a, b) => Number(a.bri_sort_order) - Number(b.bri_sort_order));
}

function withoutEmbeddedRelations(record = {}) {
  const cleaned = { ...record };
  delete cleaned.fiscal_year;
  delete cleaned.planning_period;
  delete cleaned.items;
  delete cleaned.requesting_unit;
  return cleaned;
}

export function saveBudgetRequest(db, payload, existing = null) {
  const now = new Date().toISOString();
  const id = existing?.id ?? db.nextId('budget-requests');
  const brId = existing?.br_id ?? id;
  const items = Array.isArray(payload.items) ? payload.items : null;
  const totalAmount = items
    ? items.reduce((sum, item) => sum + Number(item.bri_planned_amount || 0), 0).toFixed(2)
    : existing?.br_total_amount ?? '0.00';

  const storagePayload = withoutEmbeddedRelations(payload);
  const storageExisting = withoutEmbeddedRelations(existing);
  storagePayload.br_attached_files = saveAttachedFiles(
    payload.br_attached_files,
    existing?.br_attached_files,
    brId
  );

  const saved = {
    id,
    br_id: brId,
    ...storageExisting,
    ...storagePayload,
    br_reference_no: existing?.br_reference_no ?? `BR-2026-${String(brId).padStart(3, '0')}`,
    br_status: payload.br_status ?? existing?.br_status ?? 'draft',
    br_current_version_number: payload.br_current_version_number ?? existing?.br_current_version_number ?? 1,
    br_total_amount: totalAmount,
    br_created_at: existing?.br_created_at ?? now,
    br_updated_at: now,
  };

  db.upsert('budget-requests', id, saved);

  if (items) {
    items.forEach((item, index) => {
      const itemId = item.bri_id ?? db.nextId('budget-request-items');
      db.upsert('budget-request-items', itemId, {
        id: itemId,
        bri_id: itemId,
        bri_br_id: brId,
        bri_sort_order: index + 1,
        ...item,
      });
    });
  }

  return withBudgetRequestRelations(db, saved);
}
