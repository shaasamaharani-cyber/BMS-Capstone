import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { money, sortItems } from '../utils.mjs';
import { logActivity, getVersionsForRequest } from './budgetRequestLifecycle.mjs';
import { saveBudgetRequest } from './budgetRequests.mjs';
import { generateUnifiedBudgetVersionPdf } from './unifiedBudgetVersionPdf.mjs';

const CATEGORY_CODES = ['PS', 'MOOE', 'CO', 'TAG'];
const GENERATED_ATTACHMENTS_DIR = resolve('mock/generated/attachments');
const PUBLIC_FILE_BASE = process.env.MOCK_PUBLIC_BASE_URL
  || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;

function publicGeneratedUrl(pathname) {
  return `${PUBLIC_FILE_BASE.replace(/\/$/, '')}${pathname}`;
}

function findFiscalYearByYear(db, year) {
  return db.rows('fiscal-years')
    .find((row) => String(row.fy_year) === String(year));
}

function fiscalYearForBudget(db, budget) {
  return db.rows('fiscal-years')
    .find((row) => Number(row.fy_id) === Number(budget.ub_fiscal_year_id));
}

function planningPeriodForBudget(db, budget) {
  return db.rows('planning-periods')
    .find((row) => Number(row.pp_id) === Number(budget.ub_planning_period_id));
}

function categoryForId(db, categoryId) {
  return db.rows('budget-categories')
    .find((row) => Number(row.bcat_id) === Number(categoryId));
}

function categoryIdForCode(db, code) {
  const category = db.rows('budget-categories')
    .find((row) => String(row.bcat_code).toUpperCase() === String(code).toUpperCase());
  return category?.bcat_id ?? null;
}

function unitForId(db, unitId) {
  return db.rows('requesting-units')
    .find((row) => Number(row.ru_id) === Number(unitId));
}

function unitIdForName(db, name) {
  const unit = db.rows('requesting-units')
    .find((row) => String(row.ru_name).toLowerCase() === String(name).toLowerCase());
  return unit?.ru_id ?? null;
}

function nextUnifiedBudgetReference(db, fiscalYear) {
  const current = db.rows('unified-budgets')
    .map((row) => String(row.ub_reference_no || '').match(/UB-\d{4}-(\d+)$/)?.[1])
    .map(Number)
    .filter(Number.isFinite);
  return `UB-${fiscalYear}-${String((current.length ? Math.max(...current) : 0) + 1).padStart(3, '0')}`;
}

function unifiedBudgetItems(db, ubId) {
  return db.rows('unified-budget-items')
    .filter((item) => Number(item.ubi_unified_budget_id) === Number(ubId))
    .filter((item) => item.ubi_deleted_at == null)
    .sort((a, b) => Number(a.ubi_id ?? a.id) - Number(b.ubi_id ?? b.id));
}

function workflowSteps(db, ubId) {
  return db.rows('unified-budget-workflow-steps')
    .filter((step) => Number(step.ubws_unified_budget_id) === Number(ubId))
    .sort((a, b) => Number(a.ubws_sort_order) - Number(b.ubws_sort_order))
    .map((step) => step.ubws_payload);
}

function approvalVersions(db, ubId, budget) {
  const currentVersion = Number(budget?.ub_current_version_number) || 1;
  const currentStatus = String(budget?.ub_current_status || 'draft').toUpperCase();
  const currentStage = budget?.ub_current_stage || 'Draft';

  return db.rows('unified-budget-versions')
    .filter((version) => Number(version.ubv_unified_budget_id) === Number(ubId))
    .sort((a, b) => Number(a.ubv_version_number) - Number(b.ubv_version_number))
    .map((version) => {
      const payload = { ...version.ubv_payload };
      const vNum = Number(payload.version ?? version.ubv_version_number);
      if (vNum === currentVersion) {
        payload.status = currentStatus;
        payload.stage = currentStage;
        if (payload.snapshot) {
          payload.snapshot = {
            ...payload.snapshot,
            overview: payload.snapshot.overview ? {
              ...payload.snapshot.overview,
              status: currentStatus,
              stage: currentStage,
            } : undefined
          };
        }
      } else if (vNum < currentVersion) {
        payload.status = 'REJECTED';
        if (payload.snapshot) {
          payload.snapshot = {
            ...payload.snapshot,
            overview: payload.snapshot.overview ? {
              ...payload.snapshot.overview,
              status: 'REJECTED',
            } : undefined
          };
        }
      }
      return payload;
    });
}

function resolveBudgetRequestItemId(db, item) {
  const brId = item?.ubi_budget_request_id;
  const storedId = item?.ubi_budget_request_item_id;

  if (storedId != null && storedId !== '') {
    const storedRow = db.rows('budget-request-items').find((row) => (
      Number(row.bri_id ?? row.id) === Number(storedId) &&
      (!brId || Number(row.bri_br_id) === Number(brId))
    ));
    if (storedRow) {
      return storedRow.bri_id ?? storedRow.id;
    }
  }

  if (!brId) {
    return null;
  }

  const description = String(item?.ubi_description || '').trim();
  if (!description) {
    return null;
  }

  const matches = db.rows('budget-request-items').filter((row) => (
    Number(row.bri_br_id) === Number(brId) &&
    String(row.bri_description || '').trim() === description
  ));

  if (matches.length === 1) {
    return matches[0].bri_id ?? matches[0].id ?? null;
  }

  return null;
}


function budgetRequestRecordForId(db, brId) {
  if (brId == null || brId === '') {
    return null;
  }

  return db.find('budget-requests', brId) ?? null;
}


function budgetRequestTitleForId(db, brId) {
  const request = budgetRequestRecordForId(db, brId);
  return request?.br_title ?? request?.title ?? null;
}


function budgetRequestCodeForId(db, brId) {
  const request = budgetRequestRecordForId(db, brId);
  return request?.br_reference_no ?? request?.code ?? null;
}


function resolveDeclaredBudgetRequestItemId(item) {
  const rowId = item?.id ?? item?.ubi_id;
  const fromFields = item?.budgetRequestItemId ??
    item?.sourceItemId ??
    item?.ubi_budget_request_item_id;

  if (
    fromFields != null &&
    fromFields !== '' &&
    String(fromFields) !== String(rowId)
  ) {
    const parsed = Number(fromFields);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const suffixMatch = String(item?.id || '').match(/-(\d+)$/);
  if (!suffixMatch) {
    return null;
  }

  const parsedSuffix = Number(suffixMatch[1]);
  return Number.isFinite(parsedSuffix) && parsedSuffix > 0 ? parsedSuffix : null;
}


function resolveExistingUnifiedBudgetItemRow(db, ubId, item) {
  const rawId = item?.id ?? item?.ubi_id;
  if (rawId == null || rawId === '') {
    return null;
  }

  const existing = db.find('unified-budget-items', rawId);
  if (!existing) {
    return null;
  }
  if (Number(existing.ubi_unified_budget_id) !== Number(ubId)) {
    return null;
  }

  return existing;
}


function buildConsolidatedLineItems(db, ubId) {
  const sections = new Map();

  unifiedBudgetItems(db, ubId).forEach((item) => {
    const unit = unitForId(db, item.ubi_requesting_unit_id);
    const category = categoryForId(db, item.ubi_category_id);
    const sourceRequestId = item.ubi_budget_request_id ?? null;
    const requestCode = budgetRequestCodeForId(db, sourceRequestId)
      || (sourceRequestId ? `BR-${String(sourceRequestId).padStart(3, '0')}` : `UB-${ubId}`);
    const unitName = unit?.ru_name ?? 'Unknown Unit';
    const key = `${sourceRequestId ?? 'none'}:${item.ubi_requesting_unit_id ?? 'none'}`;

    if (!sections.has(key)) {
      const requestTitle = budgetRequestTitleForId(db, sourceRequestId)
        || (sourceRequestId ? `Budget Request #${sourceRequestId}` : 'Unified Source');
      sections.set(key, {
        requestId: requestCode,
        sourceRequestId,
        requestTitle,
        requestingUnit: unitName,
        items: [],
      });
    }

    const budgetRequestItemId = resolveBudgetRequestItemId(db, item);

    sections.get(key).items.push({
      id: item.ubi_id ?? item.id,
      sourceItemId: budgetRequestItemId,
      budgetRequestItemId,
      ubi_budget_request_item_id: item.ubi_budget_request_item_id ?? budgetRequestItemId,
      requestId: requestCode,
      sourceRequestId,
      requestingUnit: unitName,
      category: category?.bcat_code ?? '',
      costStructure: item.ubi_cost_structure ?? 'General',
      name: item.ubi_description,
      amount: Number(item.ubi_adjusted_amount ?? item.ubi_original_amount ?? 0),
      justification: item.ubi_adjustment_notes ?? '',
    });
  });

  return [...sections.values()];
}

function totalsForItems(db, ubId) {
  const totals = { psTotal: 0, mooeTotal: 0, coTotal: 0, tagTotal: 0, grandTotal: 0 };

  unifiedBudgetItems(db, ubId).forEach((item) => {
    const category = categoryForId(db, item.ubi_category_id)?.bcat_code;
    const amount = Number(item.ubi_adjusted_amount ?? item.ubi_original_amount ?? 0);

    if (category === 'PS') totals.psTotal += amount;
    if (category === 'MOOE') totals.mooeTotal += amount;
    if (category === 'CO') totals.coTotal += amount;
    if (category === 'TAG') totals.tagTotal += amount;
  });

  totals.grandTotal = CATEGORY_CODES.reduce((sum, code) => {
    const key = `${code.toLowerCase()}Total`;
    return sum + totals[key];
  }, 0);

  return totals;
}

function budgetRequestIdsForBudget(db, ubId) {
  return [...new Set(
    unifiedBudgetItems(db, ubId)
      .map((item) => item.ubi_budget_request_id)
      .filter((value) => value != null)
  )];
}

function collectSourceBudgetRequestIdsFromPayload(db, ubId, payload = {}) {
  const setIds = new Set();

  const addId = (value) => {
    const intId = Number(value);
    if (Number.isFinite(intId) && intId > 0) {
      setIds.add(intId);
    }
  };

  (Array.isArray(payload.budgetRequestIds) ? payload.budgetRequestIds : []).forEach(addId);

  (Array.isArray(payload.consolidatedLineItems) ? payload.consolidatedLineItems : []).forEach((section) => {
    addId(section?.sourceRequestId);
    (Array.isArray(section?.items) ? section.items : []).forEach((item) => {
      addId(item?.sourceRequestId);
    });
  });

  budgetRequestIdsForBudget(db, ubId).forEach(addId);

  return [...setIds];
}

function markLinkedBudgetRequestsConsolidated(db, ubId, payload, existing, actorId = null) {
  const strPrevious = String(
    existing?.ub_current_status ?? payload.previousStatus ?? ''
  ).trim().toLowerCase();
  const strNext = String(
    payload.ub_current_status ?? payload.status ?? existing?.ub_current_status ?? ''
  ).trim().toLowerCase();

  const blnIsSubmit = strNext === 'pending'
    && (strPrevious === 'draft' || strPrevious === 'rejected' || strPrevious === '');

  if (!blnIsSubmit) {
    return;
  }

  const objActor = actorId != null ? db.find('users', actorId) : null;
  const arrRequestIds = collectSourceBudgetRequestIdsFromPayload(db, ubId, payload);

  arrRequestIds.forEach((intBrId) => {
    const objRequest = db.find('budget-requests', intBrId);
    if (!objRequest) {
      return;
    }

    const strCurrent = String(objRequest.br_status || '').trim().toLowerCase();
    if (strCurrent !== 'reviewed') {
      return;
    }

    const latestVersion = getVersionsForRequest(db, intBrId).at(-1);
    if (latestVersion) {
      latestVersion.brv_status = 'consolidated';
      if (latestVersion.brv_snapshot?.overview) {
        latestVersion.brv_snapshot.overview.status = 'consolidated';
      }
      db.upsert('budget-request-versions', latestVersion.id, latestVersion);
    }

    saveBudgetRequest(db, { br_status: 'consolidated' }, objRequest);
    logActivity(
      db,
      intBrId,
      'consolidated',
      strCurrent,
      'consolidated',
      objActor,
      null,
      latestVersion?.id ?? null
    );
  });
}

function isPresidentWorkflowComplete(arrSteps = []) {
  if (!Array.isArray(arrSteps) || arrSteps.length === 0) {
    return false;
  }

  const objPresident = arrSteps.find((step) => {
    const strKey = String(step?.stepKey || '').trim().toLowerCase();
    const strTitle = String(step?.title || '').trim().toLowerCase();
    return strKey === 'president' || strTitle === 'president';
  });

  return String(objPresident?.status || '').toLowerCase() === 'done';
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

function saveAttachedFiles(payloadFiles, existingFiles = [], budgetId = '') {
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
    const filename = `${safeFilename(budgetId)}-${Date.now()}-${index + 1}-${baseName}${ext}`;
    const filePath = resolve(GENERATED_ATTACHMENTS_DIR, filename);
    writeFileSync(filePath, Buffer.from(match[2], 'base64'));

    return {
      id: file.id || filename,
      name: file.name || filename,
      size: Number(file.size) || Buffer.byteLength(match[2], 'base64'),
      type,
      lastModified: file.lastModified || null,
      url: publicGeneratedUrl(`/generated/attachments/${filename}`),
      stage: file.stage || '',
      uploadedAt: file.uploadedAt || new Date().toISOString(),
    };
  });
}

function hydrateAttachedFiles(budget = {}) {
  const attachedFiles = Array.isArray(budget.ub_attached_files)
    ? budget.ub_attached_files
    : (Array.isArray(budget.attachedFiles) ? budget.attachedFiles : []);

  return saveAttachedFiles(attachedFiles, [], budget.ub_id ?? budget.id);
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

function hydrateAttachedForms(db, budget = {}) {
  const attached = Array.isArray(budget.ub_form_entries)
    ? budget.ub_form_entries
    : (Array.isArray(budget.attachedForms) ? budget.attachedForms : []);

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

export function withUnifiedBudgetRelations(db, budget) {
  if (!budget) return null;

  const fiscalYear = fiscalYearForBudget(db, budget);
  const year = fiscalYear?.fy_year ?? String(new Date().getFullYear());
  const planningPeriodRow = planningPeriodForBudget(db, budget);
  const planningPeriodId = String(
    planningPeriodRow?.pp_id ?? budget.ub_planning_period_id ?? 1
  );
  const ubId = budget.ub_id ?? budget.id;
  const status = budget.ub_current_status ?? 'draft';
  const stage = budget.ub_current_stage ?? 'Draft';
  const updatedAt = budget.ub_updated_at ?? budget.updated_at;
  const attachedFiles = hydrateAttachedFiles(budget);
  const attachedForms = hydrateAttachedForms(db, budget);

  return {
    ...budget,
    code: budget.ub_reference_no,
    title: budget.ub_title,
    description: budget.ub_description ?? '',
    status: String(status).toUpperCase(),
    stage,
    unit: 'Budget Division',
    requestingUnit: 'Budget Division',
    fiscalYear: year,
    periodStart: year,
    planningPeriod: planningPeriodId,
    planning_period: planningPeriodRow
      ? { pp_id: planningPeriodRow.pp_id, pp_name: planningPeriodRow.pp_name }
      : null,
    lastUpdated: updatedAt,
    currentVersion: Number(budget.ub_current_version_number) || 1,
    budgetRequestIds: budgetRequestIdsForBudget(db, ubId),
    consolidatedLineItems: buildConsolidatedLineItems(db, ubId),
    approvalWorkflow: workflowSteps(db, ubId),
    approvalVersions: approvalVersions(db, ubId, budget),
    totals: totalsForItems(db, ubId),
    ub_form_entries: attachedForms,
    attachedForms,
    ub_attached_files: attachedFiles,
    attachedFiles,
  };
}

function saveUnifiedBudgetItems(db, ubId, sections, now) {
  if (!Array.isArray(sections)) return;

  const retainedIds = new Set();

  sections.forEach((section) => {
    const items = Array.isArray(section.items) ? section.items : [];
    items.forEach((item) => {
      const budgetRequestItemId = resolveDeclaredBudgetRequestItemId(item);
      const existingRow = resolveExistingUnifiedBudgetItemRow(db, ubId, item);
      const id = existingRow
        ? Number(existingRow.ubi_id ?? existingRow.id)
        : db.nextId('unified-budget-items');
      const amount = Number(item.amount ?? 0);

      retainedIds.add(id);
      db.upsert('unified-budget-items', id, {
        id,
        ubi_id: id,
        ubi_unified_budget_id: Number(ubId),
        ubi_budget_request_id: Number(item.sourceRequestId ?? section.sourceRequestId) || null,
        ubi_budget_request_item_id: budgetRequestItemId,
        ubi_requesting_unit_id: unitIdForName(db, item.requestingUnit ?? section.requestingUnit) ?? null,
        ubi_category_id: categoryIdForCode(db, item.category) ?? null,
        ubi_description: String(item.name ?? item.description ?? '').trim(),
        ubi_cost_structure: item.costStructure ?? null,
        ubi_period_type: 'annual',
        ubi_period_label: String(item.periodLabel ?? ''),
        ubi_original_amount: amount,
        ubi_adjusted_amount: amount,
        ubi_adjustment_notes: item.justification ?? null,
        ubi_created_at: now,
        ubi_updated_at: now,
        ubi_deleted_at: null,
      });
    });
  });

  db.removeWhere('unified-budget-items', (item) => (
    Number(item.ubi_unified_budget_id) === Number(ubId) &&
    !retainedIds.has(Number(item.ubi_id ?? item.id))
  ));
}

function saveWorkflowSteps(db, ubId, steps) {
  if (!Array.isArray(steps)) return;

  db.removeWhere('unified-budget-workflow-steps', (step) => Number(step.ubws_unified_budget_id) === Number(ubId));

  steps.forEach((step, index) => {
    const id = db.nextId('unified-budget-workflow-steps');
    db.upsert('unified-budget-workflow-steps', id, {
      id,
      ubws_id: id,
      ubws_unified_budget_id: Number(ubId),
      ubws_sort_order: index + 1,
      ubws_payload: step,
    });
  });
}

function saveApprovalVersions(db, ubId, versions) {
  if (!Array.isArray(versions)) return;

  db.removeWhere('unified-budget-versions', (version) => Number(version.ubv_unified_budget_id) === Number(ubId));

  versions.forEach((version, index) => {
    const id = db.nextId('unified-budget-versions');
    db.upsert('unified-budget-versions', id, {
      id,
      ubv_id: id,
      ubv_unified_budget_id: Number(ubId),
      ubv_version_number: Number(version.version ?? version.id ?? index + 1),
      ubv_payload: version,
    });
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function capturedAttachedFiles(budget = {}) {
  const attachedFiles = Array.isArray(budget.ub_attached_files)
    ? budget.ub_attached_files
    : [];

  return attachedFiles.map((file) => ({
    id: file.id ?? file.name ?? '',
    name: file.name ?? '',
    size: Number(file.size) || 0,
    type: file.type ?? '',
    lastModified: file.lastModified ?? null,
    url: file.url ?? file.fileUrl ?? '',
  }));
}

function buildVersionSnapshot(db, saved, version) {
  const planningPeriodRow = planningPeriodForBudget(db, saved);
  const fiscalYear = fiscalYearForBudget(db, saved);
  const consolidatedLineItems = buildConsolidatedLineItems(db, saved.ub_id ?? saved.id);
  const attachedFiles = capturedAttachedFiles(saved);
  const totals = totalsForItems(db, saved.ub_id ?? saved.id);

  return {
    title: saved.ub_title,
    description: saved.ub_description ?? '',
    fiscalYear: fiscalYear?.fy_year ?? '',
    planningPeriodName: planningPeriodRow?.pp_name ?? '',
    totals,
    sectionCount: consolidatedLineItems.length,
    itemCount: consolidatedLineItems.reduce((sum, section) => sum + (Array.isArray(section.items) ? section.items.length : 0), 0),
    consolidatedLineItems: cloneJson(consolidatedLineItems),
    attachedFiles,
    capturedAt: new Date().toISOString(),
    overview: {
      id: saved.ub_id ?? saved.id,
      referenceNo: saved.ub_reference_no,
      title: saved.ub_title,
      description: saved.ub_description ?? '',
      status: saved.ub_current_status,
      stage: saved.ub_current_stage,
      versionNumber: version.version,
      fiscalYearId: saved.ub_fiscal_year_id,
      fiscalYear: fiscalYear?.fy_year ?? '',
      planningPeriodId: saved.ub_planning_period_id,
      planningPeriodName: planningPeriodRow?.pp_name ?? '',
    },
  };
}

function buildRawVersionData(db, saved, snapshot, version) {
  return {
    budget: cloneJson(saved),
    consolidatedLineItems: cloneJson(snapshot.consolidatedLineItems),
    workflow: cloneJson(version.workflow),
    overview: cloneJson(snapshot.overview),
    totals: cloneJson(snapshot.totals),
    attachedFiles: cloneJson(snapshot.attachedFiles),
    capturedAt: snapshot.capturedAt,
  };
}

async function enrichApprovalVersion(db, saved, version) {
  if (!version || typeof version !== 'object') return version;
  if (version.pdfUrl && Array.isArray(version.attachedFiles) && version.rawData) return version;

  const snapshot = {
    ...buildVersionSnapshot(db, saved, version),
    ...(version.snapshot && typeof version.snapshot === 'object' ? version.snapshot : {}),
  };
  const next = {
    ...version,
    snapshot,
    rawData: version.rawData || buildRawVersionData(db, saved, snapshot, version),
    attachedFiles: Array.isArray(version.attachedFiles) ? version.attachedFiles : snapshot.attachedFiles,
  };

  if (!next.pdfUrl) {
    const pdf = await generateUnifiedBudgetVersionPdf({ version: next, snapshot });
    next.pdfUrl = pdf.pdfUrl;
    next.pdfPath = pdf.pdfPath;
    next.pdfGeneratedAt = pdf.pdfGeneratedAt;
  }

  return next;
}

async function saveApprovalVersionsWithCapture(db, ubId, saved, versions) {
  let list = versions;
  if (!Array.isArray(list)) {
    list = approvalVersions(db, ubId, saved);
  }
  if (!list || list.length === 0) return;

  const enriched = [];
  for (const version of list) {
    let nextVersion = { ...version };
    const vNum = Number(nextVersion.version);
    if (vNum === Number(saved.ub_current_version_number)) {
      nextVersion.status = String(saved.ub_current_status).toUpperCase();
      nextVersion.stage = saved.ub_current_stage;
      if (nextVersion.snapshot) {
        nextVersion.snapshot = {
          ...nextVersion.snapshot,
          overview: nextVersion.snapshot.overview ? {
            ...nextVersion.snapshot.overview,
            status: String(saved.ub_current_status).toUpperCase(),
            stage: saved.ub_current_stage,
          } : undefined
        };
      }
      if (nextVersion.rawData && typeof nextVersion.rawData === 'object') {
        nextVersion.rawData = {
          ...nextVersion.rawData,
          budget: nextVersion.rawData.budget ? {
            ...nextVersion.rawData.budget,
            ub_current_status: String(saved.ub_current_status).toUpperCase(),
            ub_current_stage: saved.ub_current_stage,
          } : undefined,
          overview: nextVersion.rawData.overview ? {
            ...nextVersion.rawData.overview,
            status: String(saved.ub_current_status).toUpperCase(),
            stage: saved.ub_current_stage,
          } : undefined,
        };
      }
    } else if (vNum < Number(saved.ub_current_version_number)) {
      nextVersion.status = 'REJECTED';
      if (nextVersion.snapshot) {
        nextVersion.snapshot = {
          ...nextVersion.snapshot,
          overview: nextVersion.snapshot.overview ? {
            ...nextVersion.snapshot.overview,
            status: 'REJECTED',
          } : undefined
        };
      }
      if (nextVersion.rawData && typeof nextVersion.rawData === 'object') {
        nextVersion.rawData = {
          ...nextVersion.rawData,
          budget: nextVersion.rawData.budget ? {
            ...nextVersion.rawData.budget,
            ub_current_status: 'REJECTED',
          } : undefined,
          overview: nextVersion.rawData.overview ? {
            ...nextVersion.rawData.overview,
            status: 'REJECTED',
          } : undefined,
        };
      }
    }
    enriched.push(await enrichApprovalVersion(db, saved, nextVersion));
  }

  saveApprovalVersions(db, ubId, enriched);
}

export async function saveUnifiedBudget(db, payload, existing = null) {
  const now = new Date().toISOString();
  const id = existing?.id ?? db.nextId('unified-budgets');
  const ubId = existing?.ub_id ?? id;
  const fiscalYearValue = payload.ub_fiscal_year_id
    ? fiscalYearForBudget(db, { ub_fiscal_year_id: payload.ub_fiscal_year_id })?.fy_year
    : (payload.fiscalYear ?? existing?.fiscalYear ?? fiscalYearForBudget(db, existing ?? {})?.fy_year ?? new Date().getFullYear());
  const fiscalYear = findFiscalYearByYear(db, fiscalYearValue);
  const planningPeriodIdRaw = payload.ub_planning_period_id ?? payload.planningPeriod ?? existing?.ub_planning_period_id ?? 1;
  const planningPeriodRow = db.rows('planning-periods')
    .find((row) => Number(row.pp_id) === Number(planningPeriodIdRaw));
  const resolvedPlanningPeriodId = Number(planningPeriodRow?.pp_id ?? 1);
  const referenceNo = payload.ub_reference_no
    ?? payload.code
    ?? existing?.ub_reference_no
    ?? nextUnifiedBudgetReference(db, fiscalYear?.fy_year ?? fiscalYearValue);
  const requestedStatus = String(payload.ub_current_status ?? payload.status ?? existing?.ub_current_status ?? 'draft').toLowerCase();
  const requestedStage = payload.ub_current_stage ?? payload.stage ?? existing?.ub_current_stage ?? 'Draft';
  const arrWorkflowForGuard = Array.isArray(payload.approvalWorkflow) && payload.approvalWorkflow.length > 0
    ? payload.approvalWorkflow
    : workflowSteps(db, ubId);
  const shouldPreserveApproved = existing
    && isPresidentWorkflowComplete(arrWorkflowForGuard)
    && requestedStatus === 'rejected';

  if (shouldPreserveApproved) {
    return withUnifiedBudgetRelations(db, existing);
  }

  const saved = {
    id,
    ub_id: ubId,
    ub_reference_no: referenceNo,
    ub_fiscal_year_id: payload.ub_fiscal_year_id ?? fiscalYear?.fy_id ?? existing?.ub_fiscal_year_id ?? null,
    ub_planning_period_id: resolvedPlanningPeriodId,
    ub_created_by: payload.ub_created_by ?? existing?.ub_created_by ?? 2,
    ub_title: payload.ub_title ?? payload.title ?? existing?.ub_title ?? 'Untitled Consolidated Budget',
    ub_description: payload.ub_description ?? payload.description ?? existing?.ub_description ?? '',
    ub_current_version_number: payload.ub_current_version_number ?? payload.currentVersion ?? existing?.ub_current_version_number ?? 1,
    ub_current_status: requestedStatus,
    ub_current_stage: requestedStage,
    ub_form_entries: payload.ub_form_entries ?? payload.attachedForms ?? existing?.ub_form_entries ?? [],
    ub_form_schema_id: payload.ub_form_schema_id ?? payload.ub_form_entries?.[0]?.schemaId ?? existing?.ub_form_schema_id ?? null,
    ub_form_entry_id: payload.ub_form_entry_id ?? payload.ub_form_entries?.[0]?.entryId ?? existing?.ub_form_entry_id ?? null,
    ub_attached_files: saveAttachedFiles(
      payload.ub_attached_files ?? payload.attachedFiles,
      existing?.ub_attached_files,
      ubId
    ),
    ub_created_at: existing?.ub_created_at ?? payload.ub_created_at ?? now,
    ub_updated_at: payload.ub_updated_at ?? payload.lastUpdated ?? now,
  };

  db.upsert('unified-budgets', id, saved);
  saveUnifiedBudgetItems(db, ubId, payload.consolidatedLineItems, now);
  saveWorkflowSteps(db, ubId, payload.approvalWorkflow);
  await saveApprovalVersionsWithCapture(db, ubId, saved, payload.approvalVersions);
  markLinkedBudgetRequestsConsolidated(
    db,
    ubId,
    payload,
    existing,
    payload.actor_id ?? payload.ub_created_by ?? existing?.ub_created_by ?? null
  );

  return withUnifiedBudgetRelations(db, saved);
}

const EXTERNAL_STEP_TYPES = new Set(['external_approval', 'review']);

function nowLocaleString() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function applyApproveToWorkflow(steps, strActorName = '') {
  if (!Array.isArray(steps) || steps.length === 0) return steps;

  const approvedAt = nowLocaleString();
  const strPerson = String(strActorName || '').trim();
  const strApproveLabel = strPerson ? `Approved by ${strPerson}` : 'Approved';
  let firstExternal = true;

  return steps.map((step) => {
    const isExternal = EXTERNAL_STEP_TYPES.has(String(step.type || '').toLowerCase());
    if (!isExternal) {
      return {
        ...step,
        status: 'done',
        actionText: strApproveLabel,
        actionAt: step.actionAt || approvedAt,
        actorRole: step.actorRole || step.title || '',
        actorName: strPerson,
      };
    }
    if (firstExternal) {
      firstExternal = false;
      return { ...step, status: 'current', actionText: 'Pending Approval' };
    }
    return { ...step, status: 'locked', actionText: '' };
  });
}

export function applyRejectToWorkflow(steps, strActorName = '') {
  if (!Array.isArray(steps) || steps.length === 0) return steps;

  const rejectedAt = nowLocaleString();
  const strPerson = String(strActorName || '').trim();
  const strRejectLabel = strPerson ? `Rejected by ${strPerson}` : 'Rejected';
  const intCurrentIndex = steps.findIndex((step) => step.status === 'current');
  const intDraftIndex = steps.findIndex(
    (step) => String(step.stepKey || '').toLowerCase() === 'draft'
      || String(step.title || '').toLowerCase() === 'internal consolidation'
  );

  if (intCurrentIndex < 0 || intDraftIndex < 0) {
    return steps;
  }

  return steps.map((step, intIndex) => {
    if (intIndex === intDraftIndex) {
      return {
        ...step,
        status: 'current',
        actionText: 'Resubmit',
        actionAt: rejectedAt,
        actorRole: step.actorRole || step.title || '',
      };
    }
    if (intIndex === intCurrentIndex) {
      return {
        ...step,
        status: 'rejected',
        actionText: strRejectLabel,
        actionAt: step.actionAt || rejectedAt,
        actorRole: step.actorRole || step.title || '',
        actorName: strPerson,
      };
    }
    return {
      ...step,
      status: 'locked',
      actionText: '',
      actionAt: '',
      actorRole: '',
    };
  });
}

export function unifiedBudgetRows(db, params) {
  let items = db.rows('unified-budgets').map((item) => withUnifiedBudgetRelations(db, item));

  const stage = params.get('stage');
  if (stage) items = items.filter((item) => String(item.stage).toLowerCase() === stage.toLowerCase());

  const status = params.get('status');
  if (status) items = items.filter((item) => String(item.status).toLowerCase() === status.toLowerCase());

  const title = params.get('title');
  if (title) items = items.filter((item) => String(item.title || '').toLowerCase().includes(title.toLowerCase()));

  const fiscalYear = params.get('fiscal_year');
  if (fiscalYear) items = items.filter((item) => String(item.fiscalYear) === String(fiscalYear));

  return sortItems(items, params, {
    title: (item) => item.title,
    requestingUnit: (item) => item.requestingUnit,
    fiscalYear: (item) => item.fiscalYear,
    status: (item) => item.status,
    stage: (item) => item.stage,
    lastUpdated: (item) => item.lastUpdated,
  });
}

export function unifiedBudgetSummary(db) {
  const reviewedCount = db.rows('budget-requests')
    .filter((request) => String(request.br_status || '').toLowerCase() === 'reviewed')
    .length;
  const totals = db.rows('unified-budgets').reduce(
    (acc, item) => {
      const itemTotals = totalsForItems(db, item.ub_id ?? item.id);
      acc.ps += itemTotals.psTotal;
      acc.mooe += itemTotals.mooeTotal;
      acc.co += itemTotals.coTotal;
      return acc;
    },
    { ps: 0, mooe: 0, co: 0 }
  );

  return {
    totalRequestsToReview: reviewedCount,
    ps: money(totals.ps),
    mooe: money(totals.mooe),
    co: money(totals.co),
  };
}
