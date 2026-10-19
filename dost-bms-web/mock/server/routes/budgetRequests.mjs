import { cleanHeaderPayload, cleanItemPayload, validateRequestPayload, validateItemPayload } from '../services/budgetRequestValidation.mjs';
import {
  budgetRequestItems,
  saveBudgetRequest,
  withBudgetRequestRelations,
} from '../services/budgetRequests.mjs';
import {
  createVersionSnapshot,
  getActivityForRequest,
  getVersionsForRequest,
  logActivity,
  nextVersionNumber,
} from '../services/budgetRequestLifecycle.mjs';
import { resolveRequestActor } from '../services/requestActor.mjs';
import {
  canRequesterAccessBudgetRequest,
  isRequesterUser,
  requestingUnitIdForUser,
} from '../services/users.mjs';
import { sortItems } from '../utils.mjs';
import { validateConfiguredSubmission } from '../services/requestFormConfiguration.mjs';
import { serializeWorkflowWrite } from '../services/workflowWrites.mjs';

function filteredBudgetRequests(db, params, actor = null) {
  let items = db.rows('budget-requests').map((row) => withBudgetRequestRelations(db, row));

  const ids = params.get('ids');
  if (ids) {
    const idSet = new Set(ids.split(',').map((value) => value.trim()));
    items = items.filter((item) => idSet.has(String(item.br_id)));
  }

  const title = params.get('title');
  if (title) {
    items = items.filter((item) => String(item.br_title).toLowerCase().includes(title.toLowerCase()));
  }

  const status = params.get('status');
  if (status) {
    items = items.filter((item) => String(item.br_status).toLowerCase() === status.toLowerCase());
  }

  const unitId = params.get('requesting_unit_id');
  if (unitId) {
    items = items.filter((item) => String(item.br_requesting_unit_id) === unitId);
  } else if (isRequesterUser(actor)) {
    const intActorUnitId = requestingUnitIdForUser(actor);
    if (intActorUnitId != null) {
      items = items.filter((item) => Number(item.br_requesting_unit_id) === intActorUnitId);
    }
  }
  items = items.filter((item) => canRequesterAccessBudgetRequest(actor, item));

  const fiscalYearId = params.get('fiscal_year_id');
  if (fiscalYearId) {
    items = items.filter((item) => String(item.br_fiscal_year_id) === fiscalYearId);
  }

  return sortItems(items, params, {
    title: (item) => item.br_title,
    unit: (item) => item.requesting_unit?.ru_name,
    fiscalYear: (item) => item.fiscal_year?.fy_year,
    status: (item) => item.br_status,
    lastUpdated: (item) => item.br_updated_at || item.br_created_at,
  });
}

function validateBudgetRequestFiscalYear(db, fiscalYearId) {
  if (fiscalYearId === null || typeof fiscalYearId === 'undefined' || fiscalYearId === '') {
    return 'Fiscal year is required.';
  }

  const selectedYear = db.rows('fiscal-years')
    .find((row) => Number(row.fy_id) === Number(fiscalYearId));

  if (!selectedYear) {
    return 'Fiscal year is invalid.';
  }

  const currentYear = new Date().getFullYear();
  if (Number(selectedYear.fy_year) < currentYear) {
    return `Fiscal year must be ${currentYear} or later.`;
  }

  return null;
}

export async function handleBudgetRequests(ctx) {
  if (ctx.parts[0] !== 'budget-requests') return false;
  return ctx.req.method === 'GET' ? handleBudgetRequestOperation(ctx) : serializeWorkflowWrite(ctx.db, () => handleBudgetRequestOperation(ctx));
}

async function handleBudgetRequestOperation(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'budget-requests') return false;
  const authenticatedActor = resolveRequestActor(db, req);
  if (!authenticatedActor) { json(res, 401, { message: 'Authentication required.' }); return true; }

  if (req.method === 'GET' && parts.length === 1) {
    const actor = resolveRequestActor(db, req, payload);
    json(res, 200, paginate(filteredBudgetRequests(db, url.searchParams, actor), url.searchParams));
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    const actor = resolveRequestActor(db, req, payload);
    const fiscalYearError = validateBudgetRequestFiscalYear(db, payload?.br_fiscal_year_id);
    if (fiscalYearError) {
      json(res, 422, { errors: { br_fiscal_year_id: [fiscalYearError] } });
      return true;
    }

    if (!isRequesterUser(actor) || requestingUnitIdForUser(actor) == null) { json(res, 403, { message: 'Only a requester assigned to a unit can create requests.' }); return true; }
    const createPayload = { ...cleanHeaderPayload(payload), br_unified_request: payload.br_unified_request || {}, items: payload.items ?? [] };
    const intActorUnitId = requestingUnitIdForUser(actor);
    if (isRequesterUser(actor) && intActorUnitId != null) {
      createPayload.br_requesting_unit_id = intActorUnitId;
    }

    const errors = validateRequestPayload(db, createPayload);
    if (errors.length) { json(res, 422, { message: errors.join(' '), errors: { request: errors } }); return true; }
    createPayload.items = (createPayload.items || []).map(cleanItemPayload);
    createPayload.br_created_by_id = actor.id;
    const created = saveBudgetRequest(db, createPayload);
    if (Object.keys(created.br_unified_request?.overrides || {}).length) logActivity(db, created.br_id, 'form_overrides_recorded', 'draft', 'draft', actor, JSON.stringify(created.br_unified_request.overrides));
    json(res, 201, { data: created });
    return true;
  }

  const id = parts[1];
  const sub = parts[2];
  const request = db.find('budget-requests', id);

  if (!request) {
    json(res, 404, { message: 'Budget request not found' });
    return true;
  }

  const actor = resolveRequestActor(db, req, payload);
  if (!canRequesterAccessBudgetRequest(actor, request)) {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }

  const isEdit = ['PUT', 'DELETE'].includes(req.method) || (req.method === 'POST' && ['items', 'submit'].includes(sub));
  if (isEdit && (!isRequesterUser(actor) || requestingUnitIdForUser(actor) !== Number(request.br_requesting_unit_id))) {
    json(res, 403, { message: 'Only a requester from this unit can change this request.' }); return true;
  }
  if (isEdit && !['draft', 'rejected'].includes(String(request.br_status).toLowerCase())) {
    json(res, 409, { message: 'Only draft or returned requests can be changed or submitted.' }); return true;
  }
  if (req.method === 'GET' && parts.length === 2) {
    json(res, 200, {
      data: {
        ...withBudgetRequestRelations(db, request),
        items: budgetRequestItems(db, id),
      },
    });
    return true;
  }

  if (req.method === 'PUT' && parts.length === 2) {
    const fiscalYearId = payload?.br_fiscal_year_id ?? request.br_fiscal_year_id;
    const fiscalYearError = validateBudgetRequestFiscalYear(db, fiscalYearId);
    if (fiscalYearError) {
      json(res, 422, { errors: { br_fiscal_year_id: [fiscalYearError] } });
      return true;
    }
    const next = { ...cleanHeaderPayload(payload), ...(Object.hasOwn(payload, 'items') ? { items: payload.items } : {}) };
    if (Number(next.br_requesting_unit_id ?? request.br_requesting_unit_id) !== requestingUnitIdForUser(actor)) { json(res, 403, { message: 'The requesting unit cannot be changed.' }); return true; }
    const errors = validateRequestPayload(db, next, request);
    if (errors.length) { json(res, 422, { message: errors.join(' '), errors: { request: errors } }); return true; }
    if (next.items) next.items = next.items.map((item) => ({ ...cleanItemPayload(item), ...(item.bri_id != null ? { bri_id: item.bri_id } : {}) }));
    const previousOverrides = request.br_unified_request?.overrides || {};
    const nextOverrides = next.br_unified_request?.overrides || previousOverrides;
    const saved = saveBudgetRequest(db, next, request);
    if (JSON.stringify(previousOverrides) !== JSON.stringify(nextOverrides)) logActivity(db, id, 'form_overrides_updated', request.br_status, request.br_status, authenticatedActor, JSON.stringify({ before: previousOverrides, after: nextOverrides }));
    json(res, 200, { data: saved });
    return true;
  }

  if (req.method === 'DELETE' && parts.length === 2) {
    if (getVersionsForRequest(db, id).length) { json(res, 409, { message: 'Requests with submitted versions must be retained.' }); return true; }
    for (const item of budgetRequestItems(db, id)) db.remove('budget-request-items', item.id);
    db.remove('budget-requests', id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  if (req.method === 'POST' && sub === 'submit') {
    const validation = validateConfiguredSubmission(db, request);
    if (validation.errors.length) {
      json(res, 422, { message: validation.errors.join(' '), errors: { forms: validation.errors } });
      return true;
    }
    const actor = authenticatedActor;
    const fromStatus = request.br_status;
    const isResubmit = fromStatus === 'rejected';
    const versionNum = nextVersionNumber(db, id);
    const updated = saveBudgetRequest(db, { br_status: 'submitted', br_current_version_number: versionNum, ...(request.br_unified_request || Object.keys(validation.unified.formConfigs).length ? { br_unified_request: validation.unified } : {}) }, request);
    let version;
    try { version = await createVersionSnapshot(db, updated, versionNum, actor, 'submitted'); }
    catch (error) { db.upsert('budget-requests', request.id, request); throw error; }
    logActivity(db, id, isResubmit ? 'resubmitted' : 'submitted', fromStatus, 'submitted', actor, payload.comment ?? null, version.id);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'POST' && sub === 'review') {
    // Only the logged-in user's role decides: validate and return are the Budget and Finance Division's
    // actions (reviewer group); the main administrator may view but not act (Security Standard 6.15)
    if (String(resolveRequestActor(db, req)?.role?.role_group || '').toLowerCase() !== 'reviewer') {
      json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
      return true;
    }
    // Follow the flow (Security Standard 6.17): only a submitted request can be validated or returned
    if (!['approve', 'validate', 'reject', 'return'].includes(payload.action)) {
      json(res, 422, { message: 'Choose a valid review action.' }); return true;
    }
    if (['reject', 'return'].includes(payload.action) && !String(payload.comment || '').trim()) {
      json(res, 422, { message: 'Remarks are required when returning a request.' }); return true;
    }
    const strRequiredStatus = 'submitted';
    if (String(request.br_status).toLowerCase() !== strRequiredStatus) {
      json(res, 409, { message: `This request is ${request.br_status}; only a ${strRequiredStatus} request can be ${payload.action === 'return' ? 'returned' : 'validated'}.` });
      return true;
    }
    const actor = authenticatedActor;
    const statusMap = {
      approve: 'reviewed',
      validate: 'reviewed',
      reject: 'rejected',
      return: 'rejected',
    };
    const actionMap = {
      approve: 'validated',
      validate: 'validated',
      reject: 'rejected',
      return: 'returned',
    };
    if (!Object.hasOwn(statusMap, payload.action)) { json(res, 422, { message: 'Choose a valid review action.' }); return true; }
    const toStatus = statusMap[payload.action];
    const action = actionMap[payload.action] || 'validated';
    const latestVersion = getVersionsForRequest(db, id).at(-1);


    const reviewComment = typeof payload.comment === 'string' ? payload.comment.trim() : '';
    const updated = saveBudgetRequest(db, {
      br_status: toStatus,
      br_review_comment: reviewComment || request.br_review_comment || null,
      br_reviewed_at: new Date().toISOString(),
      br_reviewed_by_id: actor?.id ?? null,
    }, request);
    logActivity(db, id, action, request.br_status, toStatus, actor, payload.comment ?? null, latestVersion?.id ?? null);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'GET' && sub === 'versions' && parts[3]) {
    const version = db.find('budget-request-versions', parts[3]);
    if (!version || Number(version.brv_br_id) !== Number(id)) { json(res, 404, { message: 'Version not found' }); return true; }
    json(res, 200, { data: version });
    return true;
  }

  if (req.method === 'GET' && sub === 'versions') {
    json(res, 200, { data: getVersionsForRequest(db, id) });
    return true;
  }

  if (req.method === 'GET' && sub === 'activity') {
    json(res, 200, { data: getActivityForRequest(db, id) });
    return true;
  }

  if (req.method === 'GET' && sub === 'items') {
    json(res, 200, { data: budgetRequestItems(db, id) });
    return true;
  }

  if (req.method === 'POST' && sub === 'items') {
    const errors = validateItemPayload(db, payload);
    if (errors.length) { json(res, 422, { message: errors.join(' ') }); return true; }
    const itemId = db.nextId('budget-request-items');
    const item = db.upsert('budget-request-items', itemId, {
      id: itemId,
      bri_id: itemId,
      bri_br_id: Number(id),
      ...cleanItemPayload(payload),
    });
    saveBudgetRequest(db, {}, request);
    json(res, 201, { data: item });
    return true;
  }

  if (sub === 'items' && parts[3]) {
    const itemId = parts[3];
    const existing = db.find('budget-request-items', itemId);
    if (!existing || Number(existing.bri_br_id) !== Number(id)) { json(res, 404, { message: 'Item not found in this request.' }); return true; }

    if (req.method === 'GET') {
      json(res, 200, { data: existing });
      return true;
    }

    if (req.method === 'PUT') {
      const errors = validateItemPayload(db, payload, existing);
      if (errors.length) { json(res, 422, { message: errors.join(' ') }); return true; }
      const saved = db.upsert('budget-request-items', itemId, { ...existing, ...cleanItemPayload(payload) });
      saveBudgetRequest(db, {}, request);
      json(res, 200, { data: saved });
      return true;
    }

    if (req.method === 'DELETE') {
      db.remove('budget-request-items', itemId);
      saveBudgetRequest(db, {}, request);
      json(res, 200, { message: 'Deleted' });
      return true;
    }
  }

  return false;
}
